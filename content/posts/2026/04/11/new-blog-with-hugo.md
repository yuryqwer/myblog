---
date: "2026-04-11T11:44:25+08:00"
draft: false
title: "用 Hugo 重构个人博客网站"
tags:
    - Hugo
    - 博客
---

## 前言
差不多去年这个时候我从零开始开发了自己的博客网站：[Go 语言开发个人博客网站](/posts/2025/03/08/design-my-website)，当时使用的技术栈是 golang net/http + goldmark + html/css/js，部署在本地，基于电信的公网 IPv6，使用 ddns-go 做动态域名解析，caddy 做 https + 端口转发。

一年时间过去了，写了十几篇文章，整体符合我的预期，但是也有一些痛点，下面列举几条：
- IPv6 部署还是不稳定，很多地方的网络不支持 IPv6 访问，需要切换成手机蜂窝数据才行，但是偶尔会出现蜂窝数据也无法访问的情况。
- 不具备 tag 功能，没办法根据 tag 筛选某一类别的文章。
- 没有搜索功能，不能快速找到特定的文章。
- 没有评论功能，没有办法查看其他人对文章的看法。
- 不支持分页，这个可能不算太大的问题。

几乎每一种功能都需要自己写代码来实现，同时也会出现不少 bug 要修，我逐渐感觉有点无聊了，也没那么多时间去做这些事。

当然，最关键的还是访问不稳定的问题，我前段时间尝试搭建了另一个网站，这个过程中摸索出的部署上的经验可能对新的博客网站有所帮助。另外，我发现很多我关注的作者最后都改用 Hugo 来重构自己的博客网站了，所以也想顺便尝试一下，既然都要重新部署了，不如趁机把上面的痛点都解决掉。

## 如果一切那么简单就好了
我的预期当然是安装 Hugo -> 创建一个项目 -> 选择一款主题 -> 把我以前的文章目录拷贝到新项目下 -> 运行新项目，然后就重构完成了。理想很丰满，现实很骨感。还是有不少问题需要解决。

### front matter
Hugo 项目默认用 front matter 来控制显示博客的创建时间、标题等大量的内容，而我之前的博客网站基于博客文件本身的创建时间来显示创建时间、使用博客的一级标题来生成博客显示的标题，这些都跟 Hugo 的配置不兼容，需要进行修改。

关于文件路径方面，我还是准备使用年份+月份创建目录，每个目录存放当月编写的博客文件。Hugo 本身是可以递归遍历深层嵌套的目录并根据文件路径来生成 URL 地址的，所以不用做任何调整。

最关键的问题是我以前的博客文件都没有设置 front matter，所以文件的创建时间都被设置成了 0001 年 1 月 1 日；另一个问题是博客标题也都被设置成了空字符串，页面上看起来非常奇怪。

Hugo 支持从文件名来提取日期，这要求文件名以 YYYY-MM-DD 开头，但是我是把文件保存在 YYYY/MM/DD 这样的目录下的，文件名本身不包含时间信息，最终通过脚本的方式给每篇博客添加 front matter 信息来解决。

说到脚本，当然也不是我自己写的，直接让 AI 帮忙搞定。话说一年前我还在 deepseek 官网和大模型详细描述想法，一年后已经可以用 opencode + 大模型直接分析项目并且帮忙解决问题了，世界（主要是 AI）的变化发展真快 :)

### 图片、数学公式、表格、代码
我的图片主要是两种格式：
1. 单纯的图片，用`<img>`标签，使用`class="wide-image"`表示所有浏览器都拉伸到和文字一样的宽度，使用`class="narrow-image"`表示桌面浏览器环境下图片宽度只占文字宽度的一定比例（一般是手机截图，在桌面浏览器拉伸到文字宽度太难看）
2. 下方带文字描述的图片，用`<figure>`标签，内部的`<img>`标签放图片，`<figcaption>`标签放描述文本

由于 Hugo 默认禁用原始 HTML 渲染，虽然开启这个选项可以让我的修改最小化，但为了安全起见，最终还是决定使用 [Shortcode](https://gohugo.io/templates/types/#shortcode) 的方式解决。

我原来的数学公式使用 MathJax 进行渲染，Hugo 对此也是支持的，只需要在 Hugo.toml 配置文件中启用就行，不过还是有个小问题，美元符号一直会被误识别为数学公式，哪怕用反斜杠转义也不行，最后把以前文章中所有的`\\$`都改成了💲。

很多时候表格会过宽，超过文本宽度之后会把页面撑开来，出现水平滚动条，非常难看。我以前也是通过 raw html 解决的，把表格嵌在一个`<div class="scroll-container">`的标签中，然后通过 css 配置实现过宽表格滚动显示的效果。现在取消了标签，直接在 css 文件中设置`.content table`的属性即可。

代码高亮也都是原生支持的，配置一下 hugo.toml 文件就行，不过体验上稍微有点问题，一个是显示行数的时候如果用 table 模式，超出代码框的文本就不显示了，所以没有设置 table 模式，这样的话水平滚动时行数也会跟着滚动，不会固定住；另一个是如果选用浅色主题，选中代码时背景色也是浅色，完全看不清楚，最后通过自定义 css 背景色来解决的；然后因为我开启了明暗模式，代码高亮也需要明暗两种配色，通过在 hugo.toml 中给`[markup.highlight]`字段设置`noClasses = false`禁用内联样式，使用 CSS 类来控制代码高亮的样式，将颜色方案抽取为变量，并且定义明暗两种配色的颜色方案，就可以实现用 js 切换代码高亮配色了；最后，右上角的代码标记在苹果手机的浏览器上稍微有点问题，也通过修改 css 解决了。

### 主题修改
我选的主题是 [Archie](https://github.com/athul/archie)，不过有些地方需要调整，比如很多地方我都要改成中文，又或者是默认的样式我不是很喜欢。这些都是通过 [unified file system](https://gohugo.io/quick-reference/glossary/#unified-file-system) 实现的，简单来说就是在项目根目录创建主题的同名文件来将其覆盖掉，html 文件放在 layouts 目录下，css 文件放在 assets/css 目录下。

## 标签
Tag 功能也是通过 front matter 实现的，在每篇文章的 front matter 中设置好标签就行，非常方便。当然，同时还需要在配置文件中开启一下，然后样式之类的也需要自己通过 html 和 css 来调整。

## 评论
主题默认使用 Disqus，国内无法访问，我改用了 [giscus](https://github.com/giscus/giscus)，这是一个基于 Github Discussions 实现的评论系统，按照教程一步步操作，然后把生成的`<script>`标签放在`layouts/partials/giscus.html`文件中，然后在`layouts/_default/single.html`最后的位置使用`{{ partial "giscus.html" . }}`引入这个模板文件即可。还可以设置 front matter 的`comments`字段，模板中读取时如果检测到字段是`false`就不开启评论，做到精细化控制每篇文章是否允许评论。
> 实现计划
> 1. 准备工作（GitHub端）
>     - 确保你的GitHub仓库是公开的
>     - 安装 Giscus App：https://github.com/apps/giscus
>     - 在仓库设置中启用 Discussions（Settings → General → Features）
> 2. 生成Giscus配置
>     - 访问 https://giscus.app/ 配置并获取嵌入代码
>     - 填入你的仓库、选择Discussion category、mapping选 pathname
> 3. Hugo修改
>     - 移除 hugo.toml 中的 disqusShortname
>     - 创建 layouts/partials/giscus.html，放入giscus脚本
>     - 修改 layouts/_default/single.html，将第50行的 {{ partial "disqus.html" . }} 改为 {{ partial "giscus.html" . }}
> 4. 可选增强
>     - 在 hugo.toml 添加 comments = true 参数控制是否启用评论
>     - 支持文章级开关：在Front matter中设置 comments: false 可单独禁用

## 搜索
搜索功能也是主题自带的，在配置文件中设置`params.mainSections`来确定想要被搜索的范围，然后在配置文件中增加一个`menu.main`字段来把搜索显示出来。当然，样式的修改也可以通过上面提到的 unified file system 来实现。以下内容选自 Archie 的官方 README：
> ### Search
> 
> Archie ships with an opt-in search page backed by a Hugo-generated JSON index.
> 
> 1. Create a search page:
> 
> ```yaml
> ---
> title: "Search"
> layout: "search"
> outputs:
>   - html
>   - json
> ---
> ```
> 
> 2. Add the page to your main menu if you want it linked in the header:
> 
> ```toml
> [[menu.main]]
> name = "Search"
> url = "/search/"
> weight = 5
> ```
> 
> The generated search page indexes the same content surface as the home page when
> `params.mainSections` is set. Otherwise it falls back to all regular pages,
> excluding hidden content and the search page itself.

## 部署
基于我[另一个网站](https://golanguide.cn)的部署经验，我最终还是选择部署在 Cloudflare 上，Hugo 官方提供了非常详细的[教程](https://gohugo.io/host-and-deploy/host-on-cloudflare/)，这里不再赘述，不过要注意其实不用创建 wrangler.toml 和 build.sh 文件，直接使用 cloudflare pages 就行了。另外如果有自己的域名也可以配置一下，让网站的地址更容易记忆。