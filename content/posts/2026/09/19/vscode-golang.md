---
date: '2026-09-19T10:45:15+08:00'
toc: true
title: '使用 VS Code 同时管理多个 Golang 项目'
tags:
    - vscode
    - golang
---
## 背景
我一直使用 VS Code 作为主力编辑器，在开发 Golang 项目的时候使用官方的 Go 插件，这个插件会自动安装`gopls`(the Go language server) 等必要的程序，在开发单个项目的时候基本没什么问题，但在工作中我经常需要同时打开多个项目，查看 gRPC 调用链以及各项目接口的实现逻辑。我没有使用过 VS Code 的工作区模式，每个项目都单独开启新的编辑器窗口，于是每个窗口都会单独启动一个 gopls 进程，每个进程可能都会占用很多内存。

如下图所示，这是打开三个项目后的进程情况，三个`gopls`进程加上三个`gopls ** telemetry **`遥测进程。
{{< img src="/img/IMG_0782.PNG" alt="进程占用情况before" class="wide" >}}

## 解决方案
我问了一下 AI，它给了我一些方案：
> 我：我现在手里同时有很多个golang微服务要开发，用的vscode+官方的go插件，每个项目都打开一个vscode，会新启动一个gopls，这样会非常占用内存。有没有办法让所有的项目都使用同一个gopls来完成代码跳转之类的
> 
> Deepseek：你遇到的多项目开发内存占用问题，核心在于每个 VS Code 窗口都独立启动了一个 gopls 进程。要解决这个问题，最直接的方法是启用 gopls 的共享守护进程（Daemon）模式。
>
> 🚀 方案一：启用 gopls 守护进程模式（推荐）
> 
> 这是官方支持的解决方案，能让多个 VS Code 窗口共享同一个 gopls 进程，大幅降低内存占用。
> 
> 配置步骤：
> 
> 1. 在你的 VS Code settings.json 文件（用户或工作区设置均可）中添加以下配置：
>    ```json
>    {
>      "go.languageServerFlags": [
>        "-remote=auto"
>      ]
>    }
>    ```
>    配置 -remote=auto 后，每个 VS Code 窗口启动的 gopls 会变成一个轻量的“转发器”（forwarder），自动查找或启动一个共享的 gopls 守护进程来处> 理所有请求。
> 2. 保存设置并重启 VS Code（或执行 Go: Restart Language Server 命令）。
> 
> 工作原理：这个共享进程会持续运行以管理所有会话，并在没有客户端连接一分钟后自动关闭，无需手动管理。你可以在终端通过 ps aux | grep gopls 命令验证，> 应该只能看到一个 gopls -remote=auto 的守护进程。
> 
> 📁 方案二：使用 VS Code 多根工作区（Multi-root Workspace）
> 
> 如果你需要同时编辑多个关联项目，可以将它们作为一个“工作区”打开，而不是分别打开窗口。
> 
> 使用方法：通过 VS Code 的“文件”->“将文件夹添加到工作区”功能，把多个项目文件夹添加到同一个窗口中。这样，Go 扩展会为这个包含多个文件夹的工作区启动> 一个 gopls 进程来服务所有项目。
> 
> 📦 方案三：使用 go.work 文件（Go 1.18+）
> 
> 对于大型微服务群，Go 官方推荐使用 go.work 文件来统一管理多个模块。
> 
> 使用步骤：
> 
> 1. 在项目根目录创建 go.work 文件，列出所有子模块路径：
>    ```
>    go 1.18
>    
>    use (
>        ./service-a
>        ./service-b
>        ./shared-lib
>    )
>    ```
> 2. 务必使用 code ./go.work 命令来打开 VS Code，而不是 code .。这样 gopls 才能正确识别并启用 go.work 的全局模块索引，实现跨模块的代码跳转。
> 
> ⚠️ 重要提示
> 
> · 功能限制：目前一个共享的 gopls 守护进程尚不能跨不同项目（不同的 go.mod 根目录）进行代码跳转。它主要节省的是内存，每个项目仍会保留自己的分析上下> 文。对于跨项目跳转，go.work 或工作区模式仍是更好的选择。
> · 版本要求：请确保 gopls 版本较新（建议 v0.13+），以获得最稳定的守护进程支持。
> 
> 你可以先尝试方案一（配置 -remote=auto），这是解决内存问题最通用的方法。如果项目间存在紧密的跨模块调用，再结合使用方案三（go.work）来获得最佳体> 验。

使用方案一，在用户设置中加入以下配置
```json
{
    "go.languageServerFlags": [
        "-remote=auto"
    ]
}
```
并且重启语言服务器`Go: Restart Language Server`，再次打开三个项目后的进程情况如下
{{< img src="/img/IMG_0784.PNG" alt="进程占用情况after" class="wide" >}}
一个内存占用最大的守护进程，三个`gopls -remote=auto`进程，以及四个`gopls ** telemetry **`遥测进程[^1]，总体内存占用从 3G 降低到了 1.4G。
[^1]: 还可以运行`go telemetry off`并重启语言服务器来关闭遥测进程（除了守护进程的那个）来进一步节省内存空间。