---
date: "2025-03-08T00:00:00+08:00"
title: "Go 语言开发个人博客网站"
tags:
    - Golang
    - 博客
---
## 前言
一直想开发自己的个人博客网站。之前学过一些 Golang 在 web 开发方面的知识，为了锻炼自己的开发能力，决定基于 Golang，不使用任何框架（包括 web 框架以及 blog 框架）进行开发。

想法是好的，但我对怎么开始、需要实现哪些功能、过程中需要用到哪些库还没有一个清晰的认识。我把问题扔给了 deepseek，看看它是怎么思考的：
> 我: 怎么用 golang 开发像 https://www.alexedwards.net 这样的个人博客网站，并且不依赖第三方框架

> deepseek 思考过程: 嗯，用户想用 Golang 开发一个像 Alex Edwards 的个人博客网站，而且不依赖第三方框架。首先，我需要回想一下 Golang 的标准库，特别是 net/http 包，因为用户要求不依赖第三方框架。我记得有几个网页提到了使用原生库的方法，比如网页7、网页9和网页10，这些可能有用。
>
> 首先，用户需要一个基本的 HTTP 服务器，网页7和网页9都有例子，用 http.HandleFunc 处理路由，这样就能实现简单的路由功能。不过，像 Alex Edwards 的博客可能更复杂，需要动态路由或者更灵活的处理，但用户不想要第三方框架，所以得用标准库的方法。可能得用 ServeMux 自定义路由，或者用更基础的方式处理。
>
> 接下来，模板引擎。Golang有 html/template，网页9提到了使用模板来渲染页面，这样用户可以用模板来生成动态内容，比如博客文章列表和详情页。需要确保模板的结构正确，支持布局和部分模板，避免重复代码。
>
> 然后是内容管理。用户可能需要用 Markdown 来写文章，然后转换成 HTML。网页1提到的 ForestBlog 就是基于 Markdown 的，但需要自动拉取和更新。这里可能需要读取 Markdown 文件，解析元数据，比如标题、日期，然后用 blackfriday 或者 goldmark 这样的库转换。不过用户不依赖第三方库，但标准库可能没有 Markdown 解析，所以可能需要用第三方，但用户要求不依赖框架，但可能允许使用必要的库？或者有没有其他方法?可能需要明确，用户是否允许使用非框架的第三方库，比如仅用于 Markdown 解析？
>
> 不过用户的问题是不依赖第三方框架，可能允许使用第三方库，只要不是框架。比如 blackfriday 是 Markdown 解析库，不属于框架，所以应该可以。需要确认这一点，但根据搜索结果，网页1的 ForestBlog 可能也用了类似的方法，因为它不依赖第三方框架，但可能用了 Markdown 库？
>
> 另外，静态文件服务，比如 CSS 和 JS，可以用 http.FileServer 来处理，这在网页7和网页9的例子中有提到，设置静态目录。
>
> 数据库方面，用户可能想用 SQLite 或者 MySQL，但如果是静态博客，可能不需要数据库，直接读取文件系统。比如 ForestBlog 在网页1中就是基于文件系统的，通过 git pull 更新内容。所以可能不需要数据库，直接用文件存储文章，这样更简单。
>
> 关于中间件，比如日志、压缩、缓存，可能需要自己实现。例如，日志中间件可以包装 handler，记录请求信息。网页7提到中间件功能是第三方框架的优势，但用户不用框架，所以得自己写。
>
> 还有路由参数的问题，比如 /post/{slug}，标准库的 ServeMux 不支持，但可以通过解析 URL 路径来实现，比如分割路径，或者用正则表达式匹配。例如，网页9中的例子可能没有处理动态路由，所以需要自己处理。例如，在 handler 中解析请求的 URL.Path，提取 slug，然后加载对应的 Markdown 文件。
>
> 还有分页功能，比如文章列表分页，需要计算偏移量和限制，从文件系统中读取并按日期排序，分页显示。
>
> 部署方面，可能需要用 Nginx 做反向代理，或者直接运行 Go 二进制文件。网页4提到使用 Nginx 实现动静分离，可以作为参考。
>
> 综合这些点，步骤可能包括：
>
> 1. 设置 HTTP 服务器，使用 net/http。
> 2. 处理路由，包括静态路由和动态路由（如文章详情）。
> 3. 使用 html/template 渲染页面。
> 4. 读取和解析 Markdown 文件，生成文章内容。
> 5. 实现中间件，如日志、恢复等。
> 6. 处理静态文件服务。
> 7. 分页和文章列表展示。
> 8. 部署配置，如使用 Nginx。
>
> 需要参考多个网页的内容，比如网页1的结构，网页7和9的原生 HTTP 处理，网页10的基础语法等。确保每个步骤都有相应的引用支持，比如路由处理引用网页7和9，模板引用网页9，内容管理引用网页1和可能的其他资源。

可以发现 deepseek 思考的过程非常全面，甚至在 Markdown 解析的部分对第三方框架和第三方库这样的概念进行了区分，同时也让我更加明确了自己的需求：不用框架，但是可以使用第三方库，不过尽可能减少对第三方库的依赖，只使用必要的。

顺着 deepseek 给出的思路，开始一步步实现吧！

## 项目结构
对于本项目，我们采用一种[流行的结构](https://go.dev/doc/modules/layout#server-project)，创建项目根目录，初始化模块，创建必要的子目录：
```shell
$ mkdir -p $HOME/my_website
$ cd $HOME/my_website
$ go mod init yuryqwer.website
$ mkdir -p cmd/web internal blog ui/html ui/static
```
项目结构如下：
```
├── blog        // blog files (markdown format)
├── cmd         // application-specific code
|   └── web
├── internal    // code used by cmd
├── ui          // user-interface assets
|   ├── html    // HTML templates
|   └── static  // static files (like CSS and images)
└── go.mod
```

## 路由设计
核心的两个页面是博客的列表页和详情页，分别对应如下的路由：
<div class="scroll-container">

| Route pattern | Handler | Action |
| ----------- | ----------- | ----------- |
| GET / | blogList | Display a page containing all the blogs' titles |
| GET /blog/{blogname} | blogContent | Display the content of the given blog |
</div>

对于 /blog/{blogname} 这样的动态路由，可以在 handler 中使用 r.PathValue("blogname")来获取路由参数的值。

## HTML 模板
使用 html/template 实现动态页面渲染。通过定义基础布局模板并嵌套其他子模板来实现页面结构复用。

通过在模板中使用`{{template "template_name" .}}`来引用其他模板文件；通过在模板中使用`{{.FieldName}}`来引用 Golang 代码中的数据（以结构体方式给模板提供数据）。

基本的模板结构如下所示：
```html
{{define "base"}}
<!doctype html>
<html lang='zh'>
    <head>
        <meta charset='utf-8'>
        <title>{{template "title" .}} - 呓语成谶</title>
        <link rel='stylesheet' href='/static/css/main.css'>
        <link rel="apple-touch-icon" sizes="180x180" href="/static/img/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/static/img/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/static/img/favicon-16x16.png">
        <link rel="manifest" href="/static/img/site.webmanifest">
    </head>
    <body>
        <header>
            {{template "nav" .}}
        </header>
        <main>
            {{template "main" .}}
        </main>
        <script src='/static/js/main.js' type='text/javascript'></script>
        <script src="/static/js/check-for-tex.js" defer></script>
    </body>
</html>
{{end}}
```

## 静态文件服务
为了让网站的界面看起来更漂亮，需要添加一些图片、CSS 文件以及 JavaScript 文件并用 http.FileServer 来提供静态文件服务。我们新增一条路由：
<div class="scroll-container">

| Route pattern | Handler | Action |
| ----------- | ----------- | ----------- |
| GET /static/ | http.FileServer | Serve a specific static file |
</div>

并且用下面的代码定义一个 handler，用来提供静态文件服务：
```go
fileServer := http.FileServer(http.Dir("./ui/static/"))
mux.Handle("GET /static/", http.StripPrefix("/static", fileServer))
```
在模板文件的`<head>`标签下增加对 CSS 和网站图标文件的引用，在`<body>`标签下增加对 JavaScript 文件的引用。

## 内容管理
博客文章主要以 Markdown 格式存储在本地目录，所有的文章放在一个单独的目录中，文章引用的本地图片文件存放在静态文件服务的目录下，在博客 markdown 文件中使用`<img src="/static/img/xxx">`就可以插入图片。

列表页 handler 会遍历存放博客文件的根目录，获取路径并将数据传给对应的模板文件。详情页 handler 会读取 Markdown 文件，渲染成 HTML，并将数据传给对应的模板文件。

## Markdown 解析
在这方面我其实没有任何经验，既然 deepseek 提到了 blackfriday 和 goldmark 这两个库，我继续提问：
> 我: 对比一下能将 Markdown 转换为 HTML 的第三方库，说明这些库的优缺点。考虑到我可能需要在 Markdown 文件中编写数学公式以及不同编程语言的代码，你最推荐哪个库？

> deepseek 回答: 在 Go 语言生态中，多个第三方库支持将 Markdown 转换为 HTML，但各库在功能、性能和扩展性上有显著差异。以下是主流库的对比及推荐：
> #### 1. **Blackfriday**
> - **优点**：
>   - **成熟稳定**：历史悠久，社区广泛使用，稳定性高。
>   - **高性能**：解析速度快，适合处理大规模文档。
>   - **安全性**：支持通过`bluemonday`过滤不安全内容，防止XSS攻击。
> - **缺点**：
>   - **扩展性差**：原生不支持数学公式和复杂语法（如表格、任务列表），需手动扩展。
>   - **标准兼容性**：未完全遵循CommonMark标准，部分语法解析与主流工具不一致。
> #### 2. **goldmark**
> - **优点**：
>   - **标准兼容**：严格遵循CommonMark规范，支持Github Flavored Markdown（GFM）等扩展语法。
>   - **高扩展性**：通过插件轻松扩展，如添加数学公式（需集成`goldmark-mathjax`）、代码高亮等。
>   - **性能与鲁棒性**：解析速度快，通过模糊测试保障稳定性。
> - **缺点**：
>   - **学习成本**：自定义扩展需熟悉AST（抽象语法树）操作，对新手有一定门槛。
> #### 3. **gomarkdown/markdown**
> - **优点**：
>   - **灵活性**：支持自定义渲染钩子，例如可覆盖代码块、标题等节点的渲染逻辑。
>   - **轻量级**：依赖较少，适合需要高度定制的场景。
> - **缺点**：
>   - **功能有限**：原生不支持数学公式，需依赖其他库（如`KaTeX`或`MathJax`）实现公式渲染。
>   - **维护性**：社区活跃度较低，长期维护风险较高。
> #### 4. **其他库（如`markdown-it`）**
> - **非Go生态补充**：若使用前端框架（如Angular），`markdown-it`+`highlight.js`+`KaTeX`组合可完美支持代码高亮和数学公式，但需前后端分离部署。
> ---
> #### **推荐库：goldmark**
>
> 若需在Go中实现**数学公式**和**代码高亮**，**goldmark**是最优选择：
> 1. **数学公式支持**：通过`goldmark-mathjax`插件直接解析`$$...$$`或`$...$`语法为HTML公式，兼容LaTeX表达式。
> 2. **代码高亮**：可结合`chroma`或`prism`等语法高亮库，通过自定义渲染器实现代码块着色。
> 3. **扩展生态**：内置表格、任务列表等扩展，减少开发成本。
>
> ##### 示例代码（goldmark + 数学公式扩展）：
> ```go
> import (
>     "bytes"
>     "github.com/yuin/goldmark"
>     "github.com/yuin/goldmark/extension"
>     "github.com/yuin/goldmark/parser"
>     "github.com/yuin/goldmark/renderer/html"
> )
> 
> func markdownToHTML(mdContent string) string {
>     md := goldmark.New(goldmark.WithExtensions(extension.GFM, extension.NewMathJax()), // 启用GFM和数学公式
> goldmark.WithParserOptions(html.WithUnsafe()))
>     var buf bytes.Buffer
>     md.Convert([]byte(mdContent), &buf)
>     return buf.String()
> }
> ```
> ---
> #### **总结建议**
> - **优先场景**：若项目要求高扩展性、标准兼容性，且需支持数学公式，选择**goldmark**。
> - **替代方案**：若需快速实现基础功能且无需复杂语法，可考虑**Blackfriday**，但需自行处理公式和代码高亮。
> - **混合方案**：前后端分离场景下，前端使用`markdown-it`+`KaTeX`，后端仅做存储。

看来最符合要求的是`goldmark`，我们在 internal 目录下创建 markdown 的解析功能供 handler 调用。

关于数学公式的渲染，上面的示例代码中的`extension.NewMathJax()`实际上是不对的，没有这个定义。另外提到了可以使用`goldmark-mathjax`库，不过实际用下来发现渲染效果比较差，基本不可用。最终的方案是直接调用 [mathjax](https://www.osgeo.cn/mathjax/web/typeset.html#load-for-math) 库的 javascript 代码，具体做法是在 html 模板中引用一个自定义的`check-for-tex.js`文件，其中的 javascript 函数会在检测到文档出现数学公式时给文档新增一条`mathjax`库的引用，`mathjax`库的 javascript 代码会执行数学公式的渲染工作。

对于代码高亮只提到可结合`chroma`或`prism`等语法高亮库，通过自定义渲染器实现代码块着色，具体实现还需要进一步提问，deepseek 给出的思路总结如下：
> 1. 安装必要的库（goldmark 和 chroma）。
> 2. 创建自定义渲染器，覆盖代码块的处理。
> 3. 使用 Chroma 生成高亮的 HTML。
> 4. 配置 goldmark 使用自定义渲染器。
> 5. 在 HTML 模板中包含 Chroma 的 CSS 样式。

不过这次 deepseek 的回答看似有理有据，实际上给出的代码有一个小地方会报错，估计是 api 过时了，后面发现直接用`goldmark-highlighting`这个库就可以解决问题。

最终实现的 Markdown 渲染函数如下：
```go
func MarkdownToHTML(mdContent string) (string, error) {
	md := goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			extension.Footnote,
			highlighting.NewHighlighting(
				// See https://github.com/alecthomas/chroma/tree/master/styles for more styles
				highlighting.WithStyle("trac"),
				highlighting.WithFormatOptions(
					chromahtml.WithLineNumbers(true),
				),
			),
		),
		goldmark.WithRendererOptions(
			html.WithUnsafe(), // Allow including html segments in markdown files
		),
	)

	var buf bytes.Buffer
	if err := md.Convert([]byte(mdContent), &buf); err != nil {
		return "", err
	}

	return buf.String(), nil
}
```

## 中间件
> “You can think of a Go web application as a chain of ServeHTTP() methods being called  one after another.”
> <div style="text-align: right;">——Alex Edwards</div>

中间件就是插在调用链中用来实现特定功能的函数，一般的模式为：
```go
func myMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Any code here will execute on the way down the chain.
        next.ServeHTTP(w, r)
        // Any code here will execute on the way back up the chain.
    })
}
```
当自定义中间件放在 servemux 前面时，整个调用链如图所示：
```
(code before next.ServeHttp)
myMiddleware ─┐
              └──────> servemux ─┐
                                 └──> application handler ─┐
                                                           |
                    ┌─ servemux <──────────────────────────┘
                    |
myMiddleware  <─────┘
(code after next.ServeHttp)
```
deepseek 主要提到了日志和恢复的中间件，日志中间件一般放在 servemux 前面，这样可以作用在所有的请求上；恢复中间件放在所有 handler 的前面，保证用户在 application handler 出现 panic 时能收到 500 Internal Server Error。

需要注意的一点是，如果 application handler 中另外启动了 goroutine，这个 goroutine 如果 panic 会导致整个服务器退出，因此在启动 goroutine 的代码中也要做好 recover。

[justinas/alice](https://github.com/justinas/alice)包配合中间件使用，可以把下面这样的 handler 链：
```go
return myMiddleware1(myMiddleware2(myMiddleware3(myHandler)))
```
改写成
```go
return alice.New(myMiddleware1, myMiddleware2, myMiddleware3).Then(myHandler)
```
并且可以创建可复用的中间件链，更方便管理。
```go
myChain := alice.New(myMiddlewareOne, myMiddlewareTwo)
myOtherChain := myChain.Append(myMiddleware3)
return myOtherChain.Then(myHandler)
```

## 分页与文章列表
分页功能暂时没做，文章列表根据 markdown 文件的创建日期倒序排列，这边有一个很重要的问题是多平台兼容。

因为代码可能部署在不同的平台上，而不同系统对文件创建时间的支持可能不同，不光调用的 api 可能不同，甚至在 Linux 系统的某些文件系统中无法获取文件创建时间，因此需要使用条件编译为不同的平台编写对应的实现。

## 样式
### 字体
导航栏用到了[得意黑](https://atelier-anchor.com/typefaces/smiley-sans)字体，其他地方的字体设置比较乱，相关 CSS 如下：
```css
@font-face {
    font-family: "smiley-sans";
    src: url(/static/font/smiley-sans-v2.0.1/SmileySans-Oblique.otf.woff2) format("woff2"),
        url(/static/font/smiley-sans-v2.0.1/SmileySans-Oblique.ttf) format("truetype");
}

@font-face {
    font-family: "TextFontChinese";
    src: local("Hiragino Sans GB"), local("Microsoft YaHei"), local("WenQuanYi Micro Hei"), local(sans-serif);
    unicode-range: U+4E00-9FFF;
    /* 仅应用于中文字符 */
}

@font-face {
    font-family: "TextFontEnglish";
    src: local("lucida grande"), local("lucida sans unicode"), local(lucida), local(helvetica), local(sans-serif);
    unicode-range: U+0020-007F;
    /* 仅应用于基本拉丁字符（英文） */
}

:root {
    --art-font: "smiley-sans", "Microsoft YaHei", "Songti SC", SimSun, Heiti, sans-serif;
    --code-font: Menlo, Monaco, Consolas, "Andale Mono", "lucida console", "Courier New", monospace;
    --header-font: Palatino, Helvetica, STKaiti, SimSun, serif;
    --item-font: STFangSong, Helvetica, Arial, Vernada, Tahoma, STXihei, "Microsoft YaHei", "Songti SC", SimSun, Heiti, sans-serif;
}
```

### 颜色
使用了[uchu](https://uchu.style/)颜色主题，这个主题使用 [OKLCH 色彩空间](https://oklch.org/zh/posts/ultimate-oklch-guide)。网站整体以黑白灰为主，大量使用不同程度的灰色来标识标题、引用、表格等。少量元素如超链接、代码等会用到彩色。

### 布局
页面布局很大程度上参考了[王垠的博客](https://www.yinwang.org/)。左上角图标的旋转效果模仿的[Alex Edwards的博客](https://www.alexedwards.net/)，不过他现在已经不再使用了。

### 多平台支持
手机平台分辨率高但是屏幕小，在样式方面应当和电脑端做区分，否则会看不清文字。目前的方案是通过 js 给 html 增加一个`mobile`类：
```javascript
(function addMobile() {
	if (/mobile/i.test(navigator.userAgent) || /android/i.test(navigator.userAgent)) {
        // 需要在css之前执行，所以要放在<head>中，这时候<body>还没生成，所以只能给<html>增加类
		document.documentElement.classList.add('mobile');
	}
})();
```
为了避免“闪屏”问题（用手机端打开时页面先以电脑端样式渲染，然后在很短的时间内切换成手机端样式），上面的 js 代码需要在 CSS 加载之前执行，提前给 html 加上`mobile`类。也就是说需要把 js 代码放在`<head>`标签中，这时候`<body>`体还没有生成，因此只能给`<html>`增加`mobile`类。

把上述代码保存为`detect-mobile.js`，然后放在 html 文件中：
```html
{{define "base"}}
<!doctype html>
<html lang='zh'>
    <head>
        <meta charset='utf-8'>
        <title>{{template "title" .}} - 呓语成谶</title>
        <script src="/static/js/detect-mobile.js"></script>
        <link rel='stylesheet' href='/static/css/main.css'>
        ...
    </head>
    <body>
        ...
    </body>
</html>
{{end}}
```
CSS 文件中针对手机端的样式可以在最前面用`html.mobile`来进行标记：
```css
html.mobile body {
    font-size: 36px;
}
```

## 部署与优化
### 部署
部署方面有几个比较重要的地方：
- 容器化：Go 代码本身支持多平台编译，但还是需要借助容器化工具才能让部署变得更简单。我使用 Docker 进行整个服务的部署（包括博客后端、ddns-go以及caddy），关于博客后端的部分只需要编写一个很贱的 Dockerfile 文件
- 域名申请：自己上网搜索方法，我用的免费的 [dynv6](https://dynv6.com/)，不过国内访问不太稳定，后面又在阿里云的万网购买了域名
- DDNS：与 web 服务部署在同样的机器上，当检测到 IP 发生变化时会将信息同步给域名提供商，保证 DNS 服务能正确解析域名，我用的 [ddns-go](https://github.com/jeessy2/ddns-go)
- 端口转发：当 web 服务不是标准的 80/443 端口的时候，网页输入地址时需要在最后加上 web 服务的端口号，用端口转发可以把 80/443 端口的流量转发给 web 服务，这样访问网站就不用带端口号了，http 协议默认端口号是 80，https 是 443
- https/SSL证书：一般用 golang 编写的 web 服务只支持 http，当然想支持 https 也是可以的，只不过代码比较繁琐。我直接用的 [caddy](https://caddy2.dengxiaolong.com/docs/) 完成端口转发和 https 的支持，只需要一个配置文件即可，非常方便

### 优化
后期优化可以考虑以下几个方面：
- [ ] 引入缓存：目前每次访问一篇博客文章都需要经历 markdown 文件读取、markdown 渲染成 html 页面并返回的过程，可以考虑缓存 html 页面加快响应速度
- [ ] 分页：当博客文章越来越多之后可以考虑分页来让列表页始终保持合适的高度，不用一直下滑
- [ ] 访问量统计：博客文章标题下方显示该博文的访问次数，主页最下方显示网站的总访问次数，需要引入数据库
- [ ] 返回顶部按钮：在阅读博客文章的时候当下滑了比较多的页面高度后出现返回顶部按钮，点击即可跳转到页面最上方
- [ ] 博客分类：支持按时间分类和按博客 tag 分类，方便快速找到自己需要的内容
- [ ] 博客搜索：方便根据标题或正文关键词搜索相关博文，可能需要使用 Elasticsearch
- [ ] 评论区：增加用户评论功能，需要引入数据库
- [ ] 页脚：显示使用的技术、联系方式等
- [x] SEO：搜索引擎优化，被搜索引擎收录并提升网页排名，增加曝光度（目前做了 Google，百度和必应的貌似需要做 ICP 备案才能被收录，这个钱就不花了）

## 问题解决 & 功能实现记录
### 问题：过宽的表格无法滑动查看（2025-09-14）
问题描述：当 markdown 文件中表格的列数过多时表格的宽度会超过页面的显示范围，最终整个页面为了完整显示表格，导致其他内容被缩小得看不清了。

解决办法：表格文件周围包一个 html 的元素，然后在 CSS 文件中设置其属性，主要是`overflow-x: auto;`这个属性可以处理表格的溢出。
```markdown
<div class="scroll-container">

| A | B | C | D | E | F | G |
| -- | -- | -- | -- | -- | -- | -- |
| 0 | 0 | 0 | 0 | 0 | 0 | 0 |
</div>
```
```css
.scroll-container {
    width: 100%;
    overflow-x: auto;
    margin: 1em 0;
    -webkit-overflow-scrolling: touch; /* 支持 iOS 平滑滚动 */
}
```
同理，有些过长的数学公式也可以用这个方式解决。

### 问题：页面内锚点跳转被遮挡（2025-09-16）
问题描述：当使用锚点跳转功能时，因为当前的header有一个`position: sticky;`的 css 属性，在浏览页面时header是固定不动的，而跳转之后的目标会出现在页面的最上方，正好被header挡住。

解决方法：在 CSS 文件中给需要被锚点跳转的类型（主要是标题和脚注）增加一个`scroll-margin-top`属性，将值设置为 header 的高度。
```css
h1,
h2,
h3,
h4,
sup {
    scroll-margin-top: 90px;
}
```
需要注意的是手机端和电脑端的 header 高度可能不一样，在电脑上不遮挡的在手机上可能还是会遮挡一部分，这时候可以考虑把属性值设置得大一点或者针对两种情况单独设置。

### 功能：显示博客更新时间（2025-09-18）
功能描述：在每篇博客文章的标题下方显示文件的最近更新时间，方便判断博客中内容的时效性。

实现方法：实际要做的是在 Goldmark 将 Markdown 文件渲染成的 HTML 页面的`<h1>`标签后面插入一个元素，显示当前 Markdown 文件的更新时间。一共有两种方法可以实现，一种是对 Goldmark 进行扩展，在 AST 中精确找到 H1 节点并操作，比较复杂，需要理解 Goldmark 抽象语法树和扩展机制，适合需要将元信息深度集成到 Markdown 解析流程或者开发通用组件的场景；另一种是在 Golang 代码中对渲染后的 HTML 进行操作，这种方案更简单也更灵活，适合绝大多数需要添加元信息（如时间、阅读量、标签）的场景。我选择了第二种方案。

先在 Internal 包中添加获取文件修改时间的工具函数：
```go
func ModifiedTime(fi os.FileInfo) time.Time {
	return fi.ModTime()
}
```
然后在显示博客文章内容的 handler 中先获取修改时间再插入到 Goldmark 渲染后的 HTML 中：
```go
modifiedTime := timeutil.ModifiedTime(fi)
timeString := modifiedTime.Format("2006-01-02 15:04")
timeHTML := fmt.Sprintf(`<p class="post-mod-time">最后更新: %s</p>`, timeString)
insertionPoint := "</h1>"
updatedHTML := strings.Replace(s, insertionPoint, insertionPoint+timeHTML, 1)
```
最后在 CSS 文件中更新一下样式即可：
```css
p.post-mod-time {
    text-align: center;
    color: var(--uchu-gray-9);
    font-size: 0.9em;
    margin: -0.8em 0 1.5em 0;
    font-style: italic;
}
```

### 功能：博客更新时间由UTC时间改为UTC+8时间（2025-09-19）
功能描述：博客更新时间显示的是UTC时间，需要改成东八区时间更符合个人习惯。

实现方法：在格式化时间的时候使用UTC+8时区。
```go
loc, err := time.LoadLocation("Asia/Shanghai")
if err != nil {
    app.serverError(w, r, err)
    return
}

modifiedTime := timeutil.ModifiedTime(fi)
timeString := modifiedTime.In(loc).Format("2006-01-02 15:04")
```
在本地运行没问题后，部署到服务器出现了`unknown time zone Asia/Shanghai`的报错，让deepseek分析了一下应该是我基于 Alpine Linux 构建的 Docker 镜像缺少完整的时区数据库（tzdata）导致的。一种解决方案是在构建 Docker 镜像的时候安装`tzdata`包，在 Dockerfile 中添加一行
```dockerfile
RUN apk add --no-cache tzdata
```
另一种解决方案是在 Go 代码中导入嵌入式时区包，适合任何环境，尤其是无法控制系统配置时，这也是我选择的方案。只需要在包含获取时区信息的代码文件中添加一行导入即可。
```go
import (
    "time"
    _ "time/tzdata" // 导入嵌入式时区数据库，解决 unknown time zone 问题
)

...
loc, err := time.LoadLocation("Asia/Shanghai")
...
```

### 问题：Dockerfile文件无法使用环境变量（2025-09-19）
问题描述：我之前在 Dockerfile 文件的最后是这样写的
```dockerfile
ENV ADDR=4000
ENTRYPOINT ["./website", "-addr=:${ADDR}"]
```
成功构建镜像并创建容器后运行报错，查看日志发现提示
```txt
starting server" addr=:${ADDR}
listen tcp: lookup tcp/${ADDR}: unknown port
```
主要是因为在`ENTRYPOINT`指令中使用 JSON 数组格式（Exec 形式）时，环境变量不会自动扩展。`${ADDR}`没有被替换为环境变量`ADDR`的值，而是被当作字符串直接传递给了 Go 程序。

解决方法：一种方案是改成 Shell 形式：
```dockerfile
ENV ADDR=4000
ENTRYPOINT ./website -addr=:$ADDR
```
如果坚持要用 JSON 数组格式，也可以使用包装器：
```dockerfile
ENV ADDR=4000
ENTRYPOINT ["/bin/sh", "-c", "./website -addr=:$ADDR"]
```
我选择了第一种方案。

### 功能：更稳定的锚点跳转（2025-09-25）
功能描述：之前跳转到本篇博文的某个标题或者另一篇博文的某个标题依赖于goldmark自动给标题加id的功能：
```go
goldmark.New(
    goldmark.WithParserOptions(
    	parser.WithAutoHeadingID(),
    ),
)
```
效果是把标题中包含的所有英文字母取出来拼成id，如果标题没有英文字母就会被按顺序设置成`heading-1`、`heading-2`这样的格式。对于中文博客来说，假如我有一个锚点跳转到了`heading-2`标题，然后我在`heading-1`与`heading-2`标题中间插入了一个新标题，如果不修改锚点跳转的链接，它就会跳转到新标题上面，不够稳定。

实现方法：换成另一个支持自己添加属性的选项：
```go
goldmark.New(
    goldmark.WithParserOptions(
    	parser.WithAttribute(),
    ),
)
```
然后直接在想要被跳转到的标题上用下面的语法来写即可：
```markdown
## heading ## {#id .className attrName=attrValue class="class1 class2"}

## heading {#id .className attrName=attrValue class="class1 class2"}
```
```markdown
heading {#id .className attrName=attrValue}
============
```