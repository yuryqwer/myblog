---
date: '2026-05-02T19:54:25+08:00'
draft: false
title: '程序员如何配置一台 Macbook Neo'
---
## 触摸板
Macbook Neo 的触控板虽然跟 Pro 和 Air 的 Force Touch 触控板相比还是有些差距，但是和 Windows 笔记本的触控板相比依然领先很多，有一些选项可以设置一下，让这个触控板更好用。
### 轻点来点按
在“系统设置” > “触控板” > “光标与点按”中，开启“轻点来点按”，这样就几乎不太需要把触摸板按下去的操作了，省力。
{{< img src="/img/2026-05-02_20.00.03.png" alt="轻点来点按" class="narrow" >}}
### 三指拖移
在“系统设置” > “辅助功能” > “指针控制”中，点击“触摸板选项”，勾选“使用触控板进行拖移”，然后在“拖移样式”中选择“三指拖移”，这样可以直接使用三根手指选中文本或者拖动窗口。
{{< img src="/img/2026-05-02_20.16.31.png" alt="三指拖移" class="narrow" >}}

## 终端
终端是程序员必不可少的工具，通过一些配置，可以让它变得更好用，提高效率。
### Command Line Tools
> Command Line Tools 是Mac用户（尤其是程序员）可以安装的一套工具，它提供了许多常用的Unix工具包，实用程序和编译器。这个工具包包括了如svn、git、make、GCC、clang、perl等在Linux中默认安装的命令。从MacOS High Sierra、Sierra、OS X El Capitan、Yosemite、Mavericks开始，用户可以不必安装整个Xcode软件包，也不需要登录开发人员账户，就可以单独安装Command Line Tools。
#### 安装步骤
1. 打开Terminal或iTerm终端。
2. 输入命令`xcode-select --install`。
3. 在弹出的窗口中点击“安装”。
4. 同意服务条款。
5. 等待下载和安装过程完成。

安装完成后，可以通过运行 gcc -v 或 git version 来验证是否安装成功。

#### 安装位置
Command Line Tools被安装在Mac的根目录 /Library/Developer/CommandLineTools/ 下。这个位置包含了61个可用的新命令，都位于 /Library/Developer/CommandLineTools/usr/bin/ 中。

#### 卸载方法
如果需要卸载Command Line Tools，可以使用以下命令：
```shell
sudo rm -rf /Library/Developer/CommandLineTools/
```
这将删除系统现有的CommandLineTools目录及其内容。
（未完待续）