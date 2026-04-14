---
date: "2025-11-27T00:00:00+08:00"
title: "树莓派 5 搭建容器环境"
---
# 树莓派 5 搭建容器环境

本文的所有操作均基于官方 Raspberry Pi OS 完成。

## 让当前用户在使用 sudo 时免除密码验证
默认情况下，我们执行 sudo 命令时总需要输入密码。只需要执行一条命令，就能让当前用户在使用 sudo 时免除密码验证，大大提升操作效率。
```shell
echo "`whoami` ALL=(ALL) NOPASSWD:ALL" | sudo tee "/etc/sudoers.d/dont-prompt-$USER-for-sudo-password"
```

## 使用国内源对 apt 进行加速
### 备份 apt 源配置文件
```shell
sudo cp /etc/apt/sources.list.d/debian.sources /etc/apt/sources.list.d/debian.sources.bak

sudo cp /etc/apt/sources.list.d/raspi.sources /etc/apt/sources.list.d/raspi.sources.bak
```
### 修改 Debian 安全更新源
```shell
sudo nano /etc/apt/sources.list.d/debian.sources
```
在打开的文件中，将原始的apt源地址替换为公有云的源地址。以下是阿里云的源地址示例，你可以根据自己的地理位置选择合适的源地址:
```text
Types: deb
URIs: http://mirrors.aliyun.com/debian/
Suites: trixie trixie-updates
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp

Types: deb
URIs: http://mirrors.aliyun.com/debian-security/
Suites: trixie-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.pgp
```
保存并关闭文件。在nano编辑器中，按下Ctrl + X，然后按下Y确认保存，最后按下Enter退出编辑器。

### 修改树莓派官方源
```shell
sudo nano /etc/apt/sources.list.d/raspi.sources
```
修改为
```text
Types: deb
URIs: http://mirrors.aliyun.com/raspberrypi/
Suites: trixie
Components: main
Signed-By: /usr/share/keyrings/raspberrypi-archive-keyring.pgp
```

### 更新 apt 源列表
```shell
sudo apt update
```
运行命令以使更改生效。

## 安装 Docker
### 设置下载 Docker 的国内 apt 源
> 由于国内访问 [Docker 官方源](https://download.docker.com)存在着被屏蔽或访问速度慢等问题，推荐使用阿里云或腾讯云作为 Docker apt 源。尽量避免直接使用 Docker 官方的 Docker apt 源。

```shell
# 卸载旧版本（如果有）:
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done

# 添加 Docker 官方 GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings # 创建一个目录来保存下面要下载的 GPG key 文件，这个文件用于校验下载的软件包
# 从腾讯云下载 gpg 文件，只是为了加快下载速度，内容和官方发布的 gpg 文件相同
sudo curl -fsSL http://mirrors.tencent.com/docker-ce/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# 添加仓库到 Apt 源:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] http://mirrors.tencent.com/docker-ce/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker_tencentyun.list > /dev/null

sudo apt-get update # 更新apt源列表，以使更改生效
```
这边选择腾讯云是因为阿里云的更新稍微慢一点，安装时会报错。

### 安装 Docker 软件包
```shell
sudo apt-get install docker-ce
```

### 避免每次运行 docker 的 sudo 前缀
> 我们通常在使用 docker 命令时，如果不加 sudo，会报权限错误。这是因为 docker 服务使用的是 Unix socket，而默认情况下，Unix socket 属于 root 用户，只有 root 用户和 docker 组的成员才可以访问。所以，我们需要将当前用户添加到 docker 组中，从而使得该用户可以直接访问 docker 的 Unix socket，而不需要 sudo 权限。
```shell
sudo groupadd docker # 安装完 Docker 之后会自动创建这个组，这一步可以省略
sudo usermod -aG docker $USER # 将当前用户添加进 docker 组
newgrp docker # 切换当前会话的组到 docker 组
```
因为使用 usermod 更改用户组时不会立即生效，需要重新登录或者不重新登录的情况下使用 newgrp 命令来临时切换组。

### 配置国内加速镜像
创建或修改`/etc/docker/daemon.json`文件，并重启 docker 服务。
```shell
sudo mkdir -p /etc/docker

sudo tee /etc/docker/daemon.json <<-'EOF'
{
    "registry-mirrors": ["https://docker.1ms.run"]
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 卸载 Docker 引擎
卸载 Docker Engine、CLI、containerd 和 Docker Compose 软件包：
```shell
sudo apt-get purge docker-ce docker-ce-cli containerd.io docker-compose-plugin
```
删除镜像、容器、卷和配置文件：
```shell
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```

## 安装 k3s
### 开启 cgroups
打开`/boot/firmware/cmdline.txt`文件，将下面的内容添加到文件末尾：
```text
cgroup_enable=memory
```
然后重启树莓派：
```sh
sudo reboot
```

### 获取安装脚本
```shell
curl -sfL https://get.k3s.io > k3s.sh
```
将其中的
```
GITHUB_URL=${GITHUB_URL:-https://github.com/k3s-io/k3s/releases}
```
修改为
```
GITHUB_URL=${GITHUB_URL:-https://gh.llkk.cc/https://github.com/k3s-io/k3s/releases}
```
达到加速下载的效果，其中修改的部分可以使用任何一个可用的加速站点。

### 下载安装 k3s
```shell
cat k3s.sh | sh -
```

### 卸载 k3s
通过 shell 脚本方式安装 k3s 会在安装过程中生成卸载脚本。

运行
```shell
/usr/local/bin/k3s-uninstall.sh
```
或者
```shell
/usr/local/bin/k3s-agent-uninstall.sh
```
可以卸载 Server 或者 Agent。