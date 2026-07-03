<!-- 本文件由 docs/deployment.md 翻译生成；原文仍保留在上级目录。 -->

# 部署

在 `nanobot agent -m "Hello!"` 本地运行后使用此页。部署会让需要长期运行的界面保持在线：WebUI、聊天应用、heartbeat、Dream、cron jobs，以及通道连接。

## 部署前

在 Docker、systemd 或 LaunchAgent 之前先检查这些项：

| 检查 | 重要原因 |
|---|---|
| `nanobot status` 显示预期的配置和工作区 | 确认进程会读取你打算运行的实例 |
| `nanobot agent -m "Hello!"` 可用 | 在添加服务层之前，证明安装、配置、提供商、模型和工作区写入都正常 |
| 密钥位于环境变量或受保护的配置文件中 | API keys、bot tokens、OAuth state 和聊天凭据不应对所有人可读 |
| `~/.nanobot/` 或你的自定义配置/工作区路径是持久化的 | 会话、记忆、通道登录状态、生成的产物和 cron jobs 都存放在那里 |
| 通道访问控制是有意设计的 | 在对外暴露机器人之前，使用 `allowFrom`、配对、WebSocket `token`/`tokenIssueSecret` 或私有测试通道 |
| 端口已规划 | 网关健康检查默认是 `18790`；WebUI/WebSocket 默认是 `8765`；`nanobot serve` 默认为 `8900` |
| 日志容易获取 | 在排查启动问题时使用 `docker compose logs`、`journalctl`、LaunchAgent 日志文件或 `nanobot gateway --verbose` |

编辑 `config.json` 后，重启已部署的进程。长期运行的进程会在启动时读取配置。

## 选择运行时

| 运行时 | 适用场景 | 状态位置 | 有用的第一条命令 |
|---|---|---|---|
| Docker Compose | 在 Linux 服务器或工作站上进行可重复的容器运行 | 将 `~/.nanobot` 绑定挂载到 `/home/nanobot/.nanobot` | `docker compose run --rm nanobot-cli agent -m "Hello!"` |
| Docker CLI | 手动容器测试或小型一次性主机 | 将 `~/.nanobot` 绑定挂载到 `/home/nanobot/.nanobot` | `docker run -v ~/.nanobot:/home/nanobot/.nanobot --rm nanobot status` |
| systemd 用户服务 | 会自动重启的 Linux 用户级网关 | 主机用户的 `~/.nanobot`，除非你传入明确路径 | `systemctl --user status nanobot-gateway` |
| macOS LaunchAgent | 登录后启动的 macOS 网关 | 主机用户的 `~/.nanobot`，除非 plist 传入明确路径 | `launchctl list | grep ai.nanobot.gateway` |

## Docker

> [!TIP]
> `-v ~/.nanobot:/home/nanobot/.nanobot` 标志会将你的本地配置目录挂载到容器中，因此你的配置和工作区会在容器重启之间保持持久化。
> 容器以非 root 用户 `nanobot`（UID 1000）运行，并从 `/home/nanobot/.nanobot` 读取配置。始终将主机上的配置目录挂载到 `/home/nanobot/.nanobot`，而不是 `/root/.nanobot`。
> 如果你遇到 **Permission denied**，先在主机上修复所有权：`sudo chown -R 1000:1000 ~/.nanobot`，或者传入 `--user $(id -u):$(id -g)` 以匹配你的主机 UID。Podman 用户也可以改用 `--userns=keep-id`。
>
> [!IMPORTANT]
> 目前官方 Docker 用法是使用随附的 `Dockerfile` 从此仓库构建。第三方命名空间下的 Docker Hub 镜像并非由 HKUDS/nanobot 维护或验证；除非你信任发布者，否则不要向其中挂载 API keys 或 bot tokens。

> [!IMPORTANT]
> 网关和 WebSocket 通道在 `host: "127.0.0.1"` 中默认使用 `config.json`（在 `nanobot/config/schema.py` 中设置）。Docker `-p` 端口转发无法访问容器的 loopback 接口，因此若要让主机或局域网访问暴露的端口，你必须在启动容器前将两个绑定都设为 `0.0.0.0`，并在 `~/.nanobot/config.json` 中设置。要从 Docker 提供捆绑的 WebUI，请启用 WebSocket 通道并使用密钥保护 bootstrap：
>
> ```json
> {
>   "gateway": { "host": "0.0.0.0" },
>   "channels": {
>     "websocket": {
>       "enabled": true,
>       "host": "0.0.0.0",
>       "port": 8765,
>       "tokenIssueSecret": "your-secret-here"
>     }
>   }
> }
> ```
>
> 当 WebSocket `host` 为 `0.0.0.0` 时，除非同时配置了 `token` 或 `tokenIssueSecret`，否则该通道会拒绝启动。详情参见 [`webui.md#lan-access`](./webui.md#lan-access)。

### Docker Compose

```bash
docker compose run --rm nanobot-cli onboard   # first-time setup
vim ~/.nanobot/config.json                     # add API keys
docker compose up -d nanobot-gateway           # start gateway
```

```bash
docker compose run --rm nanobot-cli agent -m "Hello!"   # run CLI
docker compose logs -f nanobot-gateway                   # view logs
docker compose down                                      # stop
```

### Docker

```bash
# Build the image
docker build -t nanobot .

# Initialize config (first time only)
docker run -v ~/.nanobot:/home/nanobot/.nanobot --rm nanobot onboard

# Edit config on host to add API keys
vim ~/.nanobot/config.json

# Run gateway (connects to enabled channels, e.g. Telegram/Discord/Mochat).
# Mirrors the security caps and port mappings declared in docker-compose.yml:
#   - `--cap-drop ALL --cap-add SYS_ADMIN` + unconfined apparmor/seccomp are required
#     when `tools.exec.sandbox: "bwrap"` is enabled (bwrap needs CAP_SYS_ADMIN for
#     user namespaces). Without them, `bwrap` exits with `clone3: Operation not permitted`.
#   - `-p 8765:8765` exposes the WebSocket channel / WebUI alongside the gateway health
#     endpoint on 18790.
docker run \
  --cap-drop ALL --cap-add SYS_ADMIN \
  --security-opt apparmor=unconfined \
  --security-opt seccomp=unconfined \
  -v ~/.nanobot:/home/nanobot/.nanobot \
  -p 18790:18790 -p 8765:8765 \
  nanobot gateway

# Or run a single command
docker run -v ~/.nanobot:/home/nanobot/.nanobot --rm nanobot agent -m "Hello!"
docker run -v ~/.nanobot:/home/nanobot/.nanobot --rm nanobot status
```

## Linux 服务

将网关作为 systemd 用户服务运行，这样它会自动启动并在失败时重启。

先预览生成的单元文件：

```bash
nanobot gateway install-service --manager systemd --dry-run
```

安装、启用并启动它：

```bash
nanobot gateway install-service --manager systemd
```

对于自定义实例，传入与你运行网关时相同的配置/工作区选择器：

```bash
nanobot gateway install-service \
  --manager systemd \
  --name nanobot-telegram \
  --config ~/.nanobot-telegram/config.json \
  --workspace ~/.nanobot-telegram/workspace
```

常用操作：

```bash
systemctl --user status nanobot-gateway        # check status
systemctl --user restart nanobot-gateway       # restart after config changes
journalctl --user -u nanobot-gateway -f        # follow logs
nanobot gateway uninstall-service --manager systemd
```

安装器会写入 `~/.config/systemd/user/nanobot-gateway.service`，运行
`systemctl --user daemon-reload`，启用该单元，并重启它。它使用当前的 Python 可执行文件和 `python -m nanobot gateway --foreground`，因此
服务会运行在你安装 nanobot 时所使用的同一环境中。

> **注意：** 用户服务只会在你登录期间运行。要让网关在注销后继续运行，请启用 lingering：
>
> ```bash
> loginctl enable-linger $USER
> ```

## macOS LaunchAgent

当你希望 `nanobot gateway` 在你登录后保持在线，而无需保持终端打开时，请使用 LaunchAgent。

先预览生成的 plist：

```bash
nanobot gateway install-service --manager launchd --dry-run
```

安装、加载、启用并启动它：

```bash
nanobot gateway install-service --manager launchd
```

对于自定义实例：

```bash
nanobot gateway install-service \
  --manager launchd \
  --name nanobot-telegram \
  --config ~/.nanobot-telegram/config.json \
  --workspace ~/.nanobot-telegram/workspace
```

常用操作：

```bash
launchctl list | grep ai.nanobot.gateway
launchctl kickstart -k gui/$(id -u)/ai.nanobot.gateway
nanobot gateway uninstall-service --manager launchd
```

安装器会写入 `~/Library/LaunchAgents/ai.nanobot.gateway.plist`，使用
当前 Python 可执行文件和 `python -m nanobot gateway --foreground`，并将
LaunchAgent 日志写入 `~/.nanobot/logs/` 下。

> **注意：** 如果启动失败并提示 "address already in use"，请先停止手动启动的 `nanobot gateway` 进程。
