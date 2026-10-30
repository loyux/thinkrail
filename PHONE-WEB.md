# phone-web 使用与更新

本 fork：<https://github.com/loyux/thinkrail>

上游：<https://github.com/JetBrains/thinkrail>

## 分支约定

- `main`：接收上游更新，保留本 fork 的同步工作流和本文档。
- `phone-web`：手机 Web 适配与日常使用分支，自动合入本 fork 的 `main`。
- `origin`：`loyux/thinkrail`，自己的提交推送到这里。
- `upstream`：`JetBrains/thinkrail`，获取原项目更新。

手机相关开发提交到 `phone-web`，或从它创建功能分支后合回。不要将手机适配合入
`main`；这样能分别维护上游基础与手机版。

## 使用手机版

需要 `package.json` 中指定版本的 Bun，以及 Node.js ≥ 22.19。

```bash
git clone --branch phone-web https://github.com/loyux/thinkrail.git
cd thinkrail
git remote add upstream https://github.com/JetBrains/thinkrail.git
bun install --frozen-lockfile
bun run build:web
bun apps/cli/src/index.ts --host 0.0.0.0 --no-open
```

手机通过可访问这台电脑的网络打开终端显示的端口，例如 `http://电脑的局域网IP:24242`。
`0.0.0.0` 是监听地址，手机应使用电脑的实际 IP。已有的访问入口也可以继续使用。
这里启动的是具有本机文件和终端权限的开发工具，应使用你信任的网络或已有的安全访问入口。

上游 README 中的官方安装脚本和发布文件来自 JetBrains，不包含本 fork 的手机适配。
使用手机版时应从 `phone-web` 构建。

## 自动接收上游更新

工作流：[Sync upstream and phone-web](https://github.com/loyux/thinkrail/actions/workflows/sync-upstream.yml)。

每天 UTC 20:23（北京时间次日 04:23）执行，GitHub 调度可能延迟。任务依次将
`upstream/main` 合入 `origin/main`，再将更新后的 `main` 合入 `origin/phone-web`。
没有新提交时不会制造空提交。合并保留手机适配和全部已有提交，不执行强制推送、重置或变基。

任务通过本仓库专用的可写 Deploy Key 推送，私钥保存在 Actions Secret `FORK_SYNC_SSH_KEY`，
不复用个人令牌。内置 `GITHUB_TOKEN` 无法推送工作流文件的修改，部署密钥用于覆盖这类上游更新。
密钥仅授权本 fork；更换密钥时，需同时更新 Settings → Deploy keys 和该 Actions Secret。
`main` 保持仓库默认分支，因为定时工作流从默认分支运行。工作流仅允许在
`loyux/thinkrail` 的 `main` 上执行。

需要立即同步时，在上述 Actions 页面选择 **Run workflow**，分支选择 `main`；也可以运行：

```bash
gh workflow run sync-upstream.yml --repo loyux/thinkrail --ref main
```

若 GitHub 提示 fork 的 Actions 被禁用，在 Actions 页面启用工作流。GitHub 也可能在公开仓库
长期无活动（60 天）后停用定时任务；届时需重新启用。

自动合并只检查 Git 能否完成合并，不执行应用回归测试。没有文本冲突也可能出现功能不兼容；
如出现问题，可在 `phone-web` 上修复并推送，保留双方提交历史。

## 更新本机使用版本

GitHub 自动更新分支后，本机源码和正在运行的服务不会自动更新。在工作区干净时执行：

```bash
git switch phone-web
git pull --ff-only origin phone-web
bun install --frozen-lockfile
bun run build:web
```

随后重启原先运行的服务。如果本地有改动，先提交并推送；若本地与远端各有新提交，使用
`git fetch origin` 和 `git merge origin/phone-web` 合并后再构建，不使用强制覆盖。

## 冲突恢复

合并发生冲突或普通推送被远端拒绝时，工作流失败并保留受影响远端分支原状，错误见 Actions。
如果 `main` 已更新而 `phone-web` 合并失败，`main` 的更新保留，手机版仍停在先前的提交。
按 GitHub 个人通知设置接收 Actions 失败通知。

`phone-web` 冲突可在工作区干净时按以下步骤处理：

```bash
git switch phone-web
git fetch origin
git merge origin/phone-web
git merge origin/main
# 编辑冲突文件，保留需要的上游更新和手机适配，然后执行：
git add <已解决的文件>
git commit
# 运行受影响的检查；涉及应用行为时运行 bun run e2e。
git push origin phone-web
```

若 `main` 自身冲突，在干净的 `main` 检出中先合入 `origin/main`，再获取并合入
`upstream/main`，解决冲突、检查并推送到 `origin/main`。之后重新运行工作流。

`.github/scripts/sync-upstream.sh` 是工作流使用的同步助手，会切换到 detached HEAD 并直接推送，
只应在完整历史、干净的一次性检出中运行；本机日常更新使用上面的 `git pull` 命令。
