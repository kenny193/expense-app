# 💰 记账本 PWA —— 新手部署教程

纯静态网页，无需安装任何软件，上传到 GitHub 即可使用。

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
5. 不需要创建任何索引。

## 第五步：添加到手机主屏幕
- **iPhone**：用 **Safari** 打开网址 → 点底部 **分享按钮** → **添加到主屏幕**。
- **Android**：用 **Chrome** 打开 → 右上角 **⋮ 菜单** → **添加到主屏幕 / 安装应用**。

## 使用说明
- 注册后自动生成「个人账本」。顶部点账本名称可切换或新建（情侣账本、旅行账本…）。
- 设置页可改名、增删分类和银行卡、按邮箱邀请成员。对方用该邮箱注册/登录后顶部会出现邀请，点「接受」即可。
- 离线也能记账，联网后自动同步。

## 更新程序
修改文件后重新 Upload 覆盖即可。如果手机上看不到更新，把 `sw.js` 第一行的 `expense-v1` 改成 `expense-v2` 再上传。

## 以后想做成真正的 App（Capacitor）
可以用 Capacitor 把这个网页打包成 iOS/Android 安装包：需要电脑安装 Node.js，`npm i @capacitor/core @capacitor/cli`、`npx cap init`、把这些文件放到 `www` 目录、`npx cap add android / ios`，再用 Android Studio / Xcode 打包。届时需把 `localhost` 等域名加到 Firebase 授权网域。这一步需要一定技术基础，可以以后再做。
