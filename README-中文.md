# 💰 记账本 PWA —— 新手部署教程

纯静态网页，无需安装任何软件，上传到 GitHub 即可使用。没有打包步骤，所有文件都在仓库根目录，用相对路径。

这次更新加了这些功能（手机上打开设置就能用）：

- **个人资料**：可以改昵称，上传一张照片当头像，或从自带的小头像里挑一个。照片会在手机里自动缩小，**不用开通 Firebase Storage**。同一个账本里的其他人能看到你的名字和头像。
- **货币**：每个账本可以选自己的货币（马币 MYR、人民币 CNY、美元 USD、新加坡元 SGD、欧元 EUR、墨西哥比索 MXN、巴西雷亚尔 BRL）。首页、账单和存款都会换成对应的符号。以前的账本没设过货币，仍然显示人民币 ¥。
- **语言**：设置里可以在简体中文和 English 之间切换，手机会记住。
- **分类图标**：每个分类可以选一个 emoji，列表、记账表单和图表上都会显示。旧分类没有图标也没关系，会继续显示名字的第一个字，点一下那个小方块就能补上图标。
- **三种主题**：清新、暖色、深色，在登录页或设置里点色块即可，手机会记住。

## 重要：更新程序后必须重新发布 Firestore 规则

请打开 [Firebase 控制台](https://console.firebase.google.com) → 项目 **my-expense-app-63a6d** → **Firestore Database** → **Rules（规则）**。

删掉里面的旧内容，把仓库里的 `firestore.rules` **全部**粘贴进去，点 **Publish（发布）**。

不发布的话：记账、邀请、存款都还和以前一样。昵称和头像仍会通过账本成员信息给同一个账本里的人看到。但是换一台手机登录时，头像、主题和语言可能跟不过去。

不需要开通 Storage，也不需要新建索引。

## 第一步：建立 GitHub 仓库
1. 打开 https://github.com 注册/登录。
2. 右上角 **＋ → New repository**，名字随意（如 `expense`），选 **Public**，点 **Create repository**。

## 第二步：上传文件
1. 解压 `expense-app.zip`。
2. 在仓库页面点 **Add file → Upload files**。
3. 把解压出来的**所有文件和 icons 文件夹**拖进去（注意：是文件夹里面的内容，`index.html` 要在最外层）。
4. 点底部绿色 **Commit changes**。

## 第三步：开启 GitHub Pages
1. 仓库 **Settings → Pages**。
2. Source 选 **Deploy from a branch**，Branch 选 **main**，文件夹选 **/ (root)**，点 **Save**。
3. 等 1–2 分钟，页面顶部会出现网址：`https://你的用户名.github.io/仓库名/`。

## 第四步：Firebase 控制台设置（https://console.firebase.google.com ，项目 my-expense-app-63a6d）
1. **Authentication → Sign-in method**：启用 **电子邮件/密码 (Email/Password)**。
2. **Authentication → Settings → Authorized domains（授权网域）**：点 **Add domain**，填 `你的用户名.github.io`（不要带 https 和仓库名）。
3. **Firestore Database**：如未创建，点 **创建数据库**（选离你近的区域，如 asia-southeast1，生产模式）。
4. **Firestore → Rules（规则）** 标签：删除原内容，把 `firestore.rules` 文件全部内容粘贴进去，点 **Publish（发布）**。
5. 不需要创建任何索引，也不需要开通 Storage。

## 第五步：添加到手机主屏幕
- **iPhone**：用 **Safari** 打开网址 → 点底部 **分享按钮** → **添加到主屏幕**。
- **Android**：用 **Chrome** 打开 → 右上角 **⋮ 菜单** → **添加到主屏幕 / 安装应用**。

## 使用说明
- 注册后自动生成「个人账本」。顶部点账本名称可切换或新建（情侣账本、旅行账本…）。
- 登录页可以先选语言和主题。设置页里也可以改，并且会跟着账号走（需要已经发布上面的规则）。
- 设置页顶部可以改昵称和头像。上传的照片只会存成很小的图片。
- 设置页可以改账本货币、改名、给分类选图标、增删分类和银行卡、按邮箱邀请成员。对方用该邮箱注册/登录后顶部会出现邀请，点「接受」即可。
- 首页图表可以按分类、银行卡或成员看。分类图标会出现在图例和每一笔账单上。
- 离线也能记账，联网后自动同步。

## 更新程序
修改文件后重新 Upload 覆盖即可。当前缓存版本是 `sw.js` 第一行的 `expense-v2`。如果手机上看不到更新，把它改成 `expense-v3` 再上传。

每次更新后，如果 `firestore.rules` 有变动，都要重新粘贴到 Firebase 控制台并发布。这次更新**必须**重新发布。

## 以后想做成真正的 App（Capacitor）
可以用 Capacitor 把这个网页打包成 iOS/Android 安装包：需要电脑安装 Node.js，`npm i @capacitor/core @capacitor/cli`、`npx cap init`、把这些文件放到 `www` 目录、`npx cap add android / ios`，再用 Android Studio / Xcode 打包。届时需把 `localhost` 等域名加到 Firebase 授权网域。这一步需要一定技术基础，可以以后再做。
