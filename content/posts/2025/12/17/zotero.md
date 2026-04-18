---
date: "2025-12-17T00:00:00+08:00"
title: "使用绿联 NAS 的 WebDAV 功能在公网给 iPad/iPhone 上的 Zotero 同步数据"
tags:
    - NAS
    - WebDAV
    - Zotero
    - 绿联
---
## 问题
内网环境下所有设备直接使用 http 来连接 WebDAV 服务即可，iPad/iPhone 上的 Zotero 要想使用 WebDAV 在公网同步数据，必须使用 https 协议，而绿联 NAS 的 5006 端口对应的 https 版本的 WebDAV 功能由于使用了 UGREEN 自签名证书，不被信任，无法连接成功。目前暂时没有找到在 iPad/iPhone 设备上信任自签名证书的方法，只能另想其他办法。

另外，虽然公网环境下 Mac 或者其他设备上支持以 http 协议来使用 WebDAV，但是这种方式容易暴露账号密码，非常危险。

## 方案
因为绿联 NAS 的 5005 端口自带了 http 协议的 WebDAV 服务，无需重新搭建，只要在此基础上增加一个 ssl 证书即可将其扩展成 https 协议。
### 注册域名
https 协议下不允许通过 IP 的方式直接进行登录，因此必须要申请域名，可以使用 [dynv6](https://dynv6.com/) 来注册一个免费域名。在 [keys](https://dynv6.com/keys) 页面中找到对应的 HTTP token，复制下来后面要用。
### ddns-go
为了在 IP 发生变化时自动通知 DNS 服务商，需要部署 DDNS 服务。

在 docker 中拉取 jeessy/ddns-go 镜像，然后创建容器，以 host 网络模式运行，容器启动后用浏览器打开 NAS 的 9876 端口，先设置用于登录 ddns-go 服务的账号密码，然后进行配置并保存。DNS 服务商选择 Dynv6，Token 填写上面复制的，下面的 IPv4 或者 IPv6 中（一般都没有公网 IPv4 地址，直接选 IPv6 即可）选择通过网卡获取，在 Domains 中填写自己注册的域名。
### caddy
主要用到了反向代理和 ssl 证书服务。在 docker 中拉取 caddy 镜像，然后创建容器，存储空间配置一下映射，将 NAS 中的某个可访问的文件（比如`共享文件夹/docker/caddy/Caddyfile`）映射到容器中的 `/etc/caddy/Caddyfile`，然后编辑 NAS 上的这个 Caddyfile 文件，文件内容如下：
```text
你的域名 {
    reverse_proxy localhost:5005
}
```
这样后续用 https 直接访问域名的时候会被转发到 5005 端口上的 WebDAV 服务，并且自动通过 Let's Encrypt 进行签名。
### Zotero 配置
在 NAS 的共享文件夹下新建一个 zotero 文件夹，然后在 Zotero 软件的 Settings > Account > FILE SYNCING 中选择 WebDAV，协议选择 https，地址填写你自己申请的域名，账号密码是你登录 NAS 的账号密码，点击 Verify Server 确保验证成功即可。