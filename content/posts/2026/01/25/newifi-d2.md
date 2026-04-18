---
date: "2026-01-25T00:00:00+08:00"
title: "COMFAST 定制版 newifi D2 路由器免拆刷机"
tags:
    - 路由器
    - 刷机
    - newifi
---
## 写在前面
我老家有一台用了很久的斐讯 K1 路由器，这款路由器的网口都是百兆，而老家的宽带从 100Mbps 升级到了 200Mbps，百兆路由器损失了一半的带宽。另外，这台路由器的无线信号也不是特别强，因此考虑换一台千兆路由器。

我对能刷机的路由器还是比较感兴趣的，同时又不想花太多钱购买性能过剩的设备，主要用途也就是给家人刷刷视频之类，因此一台二手价格五十元以内的 Wifi5 路由器就足够了。

最终决定从新路由 3（newifi D2）和 k2p 这两台中选择一台，这两台设备主要的区别是 newifi D2 的内存和闪存都要大一些，另外还多了个 USB3.0 接口，我当时没有两台设备的无线信号对比数据，所以直接下单了 newifi D2，后面看了一篇文章才发现 k2p 的信号还是要强不少的：
[新路由3(Newifi D2)与斐讯K2P对比测试](https://www.acwifi.net/5638.html)。

## 踩坑
闲鱼卖家并没有提供包装图，收到货后发现跟正常的 newifi D2 不太一样，包装上印着 COMFAST 的标志，型号是 CF-N3。
{{< img src="/img/IMG_8672.png" alt="路由器包装" class="wide" >}}

我在官网的[产品列表](http://www.comfast.com.cn/index.php?m=content&c=index&a=lists&catid=98)里没找到这款，但是说明书里的图片显示的外观完全不像，反而路由器本体比较像 [CF-N5](http://www.comfast.com.cn/index.php?m=content&c=index&a=show&catid=98&id=16) 这款。当然，后面发现说明书下载错了，下载的 [CF-N3 V3 的说明书](http://www.comfast.com.cn/uploadfile/2021/0630/20210630024130157.rar)，如果是 [CF-N3 的说明书](http://www.comfast.com.cn/uploadfile/2021/0630/20210630024033586.rar)就会发现外观是一致的，这也为后面的犯错埋下了伏笔。
{{< figure src="/img/CF-N3V3.png" alt="CF-N3" caption="错误的CF-N3 V3说明书" class="wide" >}}

{{< figure src="/img/CF-N3.png" alt="CF-N3V3" caption="正确的CF-N3说明书" class="wide" >}}

路由器上面倒并没有印着 COMFAST 的字样，外观跟正常的 newifi D2 一模一样。

路由器自带的 CF-N3 固件可以通过连接无线网后输入 192.168.0.1 进入后台，账号密码都是 admin，不过无法使用 USB 接口，虽然可以正常上网，但是 5G 速度测下来只有 300Mbps，远没达到标称的 866Mbps，刷机，必须刷机。

### 掉坑里了
上面说到路由器本体比较像 CF-N5 这款，于是我果断下载了 CF-N5 的固件并通过浏览器成功升级。
{{< img src="/img/COMFAST_CF-N5.png" alt="路由器后台" class="wide" >}}

问题也从这个时候开始出现，我刷了这个固件之后怎么都没办法上网了，无论是使用 PPPoE 拨号还是挂在主路由下面都不行。

我尝试刷回 CF-N3 固件，结果发现直接提示失败，只有跟当前一模一样的 CF-N5 固件可以刷成功，而这没什么意义。
{{< img src="/img/firmware_update_failure.png" alt="固件无法还原" class="wide" >}}

这不是正常的 newifi D2 固件，所以也没办法像[网上介绍的方法](https://www.right.com.cn/forum/thread-342918-1-1.html)一样刷 breed。COMFAST 倒是默认开启了 ssh，但是 root 账户的密码既不为空，也不是 root/admin/12345678 这些网上能查到的通用密码。

### 一线希望
路由器既不能正常上网，也不能通过简单的方式刷机，几乎变成了砖头。貌似只能采用 ttl 线刷或者编程器的方式来补救了，而这会非常麻烦。网上能查到相关的教程：
- [newifiD2 新三 编程器救砖小白流程](https://www.right.com.cn/forum/thread-631830-1-1.html)
- [个人newifiD2 新三 救砖记录](https://www.right.com.cn/forum/thread-4040621-1-1.html)

但是不到万不得已，我不太想尝试这些硬件层面的方法，先从软件层面看看有没有突破口。

路由器后台管理页面的“系统工具” > “配置管理”中有一个“配置备份”选项，点击之后会下载一个 backup.file 的文件，我在 Kali Linux 系统中可以看到这是个 Gzip archive 的压缩文件，解压后得到一个 etc 目录，突破口就藏在其中。

比较重要的文件如下：

- `/etc/passwd`
  ```text
  root:x:0:0:root:/root:/bin/ash
  admin:x:500:500:admin:/home/admin:/bin/false
  daemon:*:1:1:daemon:/var:/bin/false
  ftp:*:55:55:ftp:/home/ftp:/bin/false
  network:*:101:101:network:/var:/bin/false
  nobody:*:65534:65534:nobody:/var:/bin/false
  dnsmasq:x:453:453:dnsmasq:/var/run/dnsmasq:/bin/false
  ```
  我们可以得到两条最重要的信息：
  1. 只有 root 用户可以通过 shell/ssh 登录，其他所有的用户都不行
  2. x 表示 root 用户的密码保存在 /etc/shadow 文件中

- `/etc/shadow`
  ```text
  root:$1$Ae0K1uzW$cnfY6ItA1jFlTRaNtEnFU1:16518:0:99999:7:::
  daemon:*:0:0:99999:7:::
  ftp:*:0:0:99999:7:::
  network:*:0:0:99999:7:::
  nobudy:*:0:0:99999:7:::
  dnsmasq:x:0:0:99999:7:::
  ```
  root 用户的密码以 md5 加密，加的盐是`Ae0K1uzW`，最终得到的哈希值是`cnfY6ItA1jFlTRaNtEnFU1`。

加盐的哈希连彩虹表都怕，暴力破解是行不通了。但是路由器后台管理页面的“系统工具” > “配置管理”中还有一个“配置更新”选项，因此我们大概率可以直接在 etc 目录中修改文件并打包，然后直接替换。

### 搞定 ssh
我们手动生成一个简单的密码
```shell
$ openssl passwd -1 "root"
$1$xTOHgqWd$47NGihh483JxTAsUGym5B1
```
然后解压下载的文件并替换其中的文本
```shell
tar -xzf backup.file
cd etc
nano shadow
```
将其中的
```text
root:$1$Ae0K1uzW$cnfY6ItA1jFlTRaNtEnFU1:16518:0:99999:7:::
```
修改为
```text
root:$1$xTOHgqWd$47NGihh483JxTAsUGym5B1:16518:0:99999:7:::
```
并保存。然后打包成一个新的文件
```shell
cd ..
tar -czf newbackup.file etc/
```
点击页面上“配置更新”中的“选择文件”，选择刚刚生成的`newbackup.file`，然后点击上传配置，等待一段时间后重新连接无线网，然后在终端输入
```shell
ssh -o HostKeyAlgorithms=ssh-rsa root@192.168.0.1
```
密码是`root`，成功登录 ssh。
{{< img src="/img/COMFAST_ssh.png" alt="成功登录ssh" class="wide" >}}

### 又一个坑 {#upload_file}
按照[新路由3 (Newifi D2) 免拆机免解锁刷 Breed 教程](https://www.right.com.cn/forum/thread-342918-1-1.html)中的操作，将 newifi-d2-jail-break.ko 文件下载到 /tmp 目录下。

路由器无法上网，只能通过本地上传给路由器，但是 `scp` 命令一直有一些问题，可以通过 ssh 执行 `cat` 命令然后通过管道将 newifi-d2-jail-break.ko 文件的内容写入路由器，不过我选择了另外一种方法。

首先在连接了路由器的客户端上运行
```shell
python3 -m http.server 8000 --bind 0.0.0.0 --directory <ko文件所在目录>
```
然后在路由器中运行
```shell
wget http://[客户端ip地址]:8000/newifi-d2-jail-break.ko -O /tmp/newifi-d2-jail-break.ko
```
其中客户端 IP 地址类似 192.168.0.x，在路由器的管理页面可以找到。

在路由器中执行
```shell
insmod newifi-d2-jail-break.ko
```
命令后，路由器并没有像预期那样重启，原因可能是内核模块与当前路由器系统不兼容，上述 newifi-d2-jail-break.ko 文件是为 newifi D2 官方固件准备的，对应的内核比较旧（大概率是 3.x），而我的 CF-N5 固件对应的内核是
```shell
root@COMFAST:~# uname -r
4.4.198 
```

### 搞定 breed
Deepseek 提到可以通过降级成 newifi D2 原厂固件来解决，我上面说过在 192.168.0.1 的网页后台中只有跟当前一模一样的 CF-N5 固件可以刷成功，其他固件都被禁止。这通常是固件升级程序`sysupgrade`或  Web 后台对上传的固件文件进行了严格校验，例如：
1. 版本号检测：阻止“降级”到旧版本
2. 签名验证：只允许安装官方签名的固件
3. 文件完整性校验：检查固件头或 CRC

因此只能通过 ssh 来刷入固件，核心思路是绕过高级别的`sysupgrade`程序，使用底层的`mtd write`命令直接将固件映像写入闪存。

在路由器上执行命令查看所有分区
```shell
root@COMFAST:~# cat /proc/mtd
dev:    size   erasesize  name
mtd0: 00030000 00010000 "Bootloader"
mtd1: 00010000 00010000 "Config"
mtd2: 00010000 00010000 "factory"
mtd3: 00fb0000 00010000 "firmware"
mtd4: 001ac753 00010000 "kernel"
mtd5: 00e038ad 00010000 "rootfs"
mtd6: 00780000 00010000 "rootfs_data"
```
路由器系统固件写入 firmare 分区，而 breed 应该是写入 Bootloader 分区。下载好 [newifi D2 的 breed 固件](https://breed.hackpascal.net/breed-mt7621-newifi-d2.bin)，通过[上面提到的方式](#upload_file)把 breed 固件传到路由器的 /tmp 目录，然后在路由器中执行
```shell
root@COMFAST:~# mtd -r write /tmp/breed-mt7621-newifi-d2.bin Bootloader
Unlocking Bootloader ...

Writing from /tmp/breed-mt7621-newifi-d2.bin to Bootloader ...
Rebooting ...
```
等待路由器重启后，先将路由器断电，然后用网线连接电脑到路由器的任一 lan 口，按住 RESET 键后插入电源，等待所有 led 灯开始闪烁后松开 RESET 键，在电脑浏览器上打开 192.168.1.1，看到了熟悉的 breed 界面。
{{< img src="/img/breed_newifi_d2.png" alt="breed管理页面" class="wide" >}}

接下来只需要选一个合适的固件刷入即可，网上有很多相关固件和教程，这边不再赘述。