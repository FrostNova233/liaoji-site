# 料记 · LiaoJi

料记 Android App 的静态产品官网。浅蓝与白色工作台，支持示例材料录量、同步料单预览和真实 App 界面切换。

- 官网：https://frostnova233.github.io/liaoji-site/
- Android 直链下载：https://github.com/FrostNova233/liaoji-releases/releases/latest/download/liaoji.apk
- 备用下载（蒲公英）：https://www.pgyer.com/liaoji-android
- 仓库：https://github.com/FrostNova233/liaoji-site

## 本地预览

需要 Node.js 18 或更新版本，无第三方依赖、无需安装依赖或构建。

```sh
node tools/serve.mjs
```

打开 http://127.0.0.1:4173/liaoji-site/ 。服务仅监听本机，并模拟 Pages 项目子路径；可通过 PORT 环境变量更换端口。

```sh
node --check app.js
node --check tools/serve.mjs
```

## 维护

- `index.html`：页面结构、SEO、FAQ 及无 JavaScript 时可用的下载入口。
- `style.css`：响应式布局、轻透导航、高对比度与减少动画支持。
- `app.js`：`SITE_CONFIG.downloadUrl` 统一控制主按钮的 GitHub Release APK 直链，`backupDownloadUrl` 控制蒲公英备用入口；主按钮不打开中间页面。更换渠道时同时更新 HTML 回退链接及本 README。
- 示例用量按整数千分位保存，最多三位小数，范围 0–999999.999。无效输入保留上次有效预览，Escape 恢复有效值；切换分类/搜索时放弃无效输入草稿。所有示例数据只在内存中，刷新和重置可恢复。
- 搜索作用于当前分类的名称及规格；分类切换保留搜索词。预览汇总所有分类已选材料，只统计项数，不合计不同单位。

## 素材来源与隐私

App 图标与施工线稿直接来自 `liaoji/assets/branding/`，保留原稿；下载区通过 CSS 遮罩让线稿边缘渐隐。三个 App 页面来自 Flutter 视觉测试产物，只有虚构住宅/联系人，没有客户电话号码；非生产客户数据。首页使用四张匿名示例料单，避免空列表使展示画面下方留白过多。四个 Tab 统一使用 390:844（约 9:19.5）的手机展示比例，真实 App 内容按 390×760 生成，完整显示，不拉伸或裁掉底部操作。顶部时间为 9:21，状态栏与底部指示条为参考 iOS 风格的网页示意，不代表已有 iOS 版本。PDF 在相同手机框内展示原始导出图，并提供打开原文件的链接。

页脚公开的作者联系方式由作者提供：QQ 864729555 及 864729555@qq.com，使用作者提供的 `assets/contact-icons.png` 原图，通过 CSS 分别显示企鹅与邮箱，同排标注。QQ 与邮箱均为复制控件，成功时在对应账号文字正上方轻显“已复制”，约 1.2 秒后淡出；失败时短暂提示手动复制。页脚最大宽度 760px，并压缩上下留白。无 JavaScript 时号码和邮箱均显示为可手动复制的文字，不提供邮件跳转。手机示意不使用灵动岛，PDF 阅读区沿用 App 的淡蓝至浅灰渐变。右下角返回顶部沿用页眉透明磨砂效果，向下滚动隐藏，向上滚动出现，接近顶部隐藏；支持键盘、减少动画与安全区避让。换机和版本更新前均建议先备份本机数据。

`assets/app-example.pdf` 使用 App 当前 `PdfService` 导出，输入为匿名工地与演示材料，显式清空联系人电话和施工联系人。`assets/app-pdf.png` 为其渲染图。网页同步预览是 HTML 示例，不代替实际 App 导出文件。

## 发布

沿用 GitHub Pages，从 `main` 分支根目录发布静态文件。根目录 `.nojekyll` 禁用 Jekyll 处理，资源均使用相对地址。仓库由 `NoteMaterialWeb` 更名为 `liaoji-site`，更新仓库主页、remote、canonical 和社交图片地址后发布。旧 Pages 项目地址不会自动跳转。

## 验证

在实际浏览器覆盖 320、390、430、768、1440px：检查横向溢出、44px 控件、分类和搜索、连续加减、三位小数、无效输入、零数量、重置、键盘标签切换、真实截图和 FAQ。检查控制台及 Pages 子路径资源；发布后再次验证新网址和下载入口。

本机截图及运行记录保存在忽略的 `artifacts/` 目录。浏览器响应式验证不等同于 Android/iOS 真机验收。
