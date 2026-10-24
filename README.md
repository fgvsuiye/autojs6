<div align="center">

# 小米社区自动化脚本
<p align="center">
  一个支持 Auto.js 7 / AutoX.js 及 AutoJs6 的小米社区自动化脚本，旨在简化每日任务，轻松获取成长值。
  <br />
  <br />
  <a href="https://github.com/fgvsuiye/autojs6/releases">下载最新版本</a>
  ·
  <a href="https://github.com/fgvsuiye/autojs6/issues">报告 Bug</a>
  ·
  <a href="https://github.com/fgvsuiye/autojs6/issues/new">提出新功能</a>
</p>

[![版本](https://img.shields.io/badge/Version-v4.1.2-blue.svg)](https://github.com/fgvsuiye/autojs6/releases)
[![兼容性](https://img.shields.io/badge/AutoX_v7-兼容-brightgreen.svg)](https://github.com/aiselp/AutoX)
[![兼容性](https://img.shields.io/badge/AutoJs6-兼容-brightgreen.svg)](https://github.com/SuperMonster003/AutoJs6/releases)
[![原作者](https://img.shields.io/badge/原作者-@PJxiaoyu-orange.svg)](#)
[![修改者](https://img.shields.io/badge/修改者-风中拾叶-light.svg)](#)

<!-- GitHub 交互徽章 -->
[![GitHub Stars](https://img.shields.io/github/stars/fgvsuiye/autojs6?style=social)](https://github.com/fgvsuiye/autojs6/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/fgvsuiye/autojs6?style=social)](https://github.com/fgvsuiye/autojs6/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/fgvsuiye/autojs6)](https://github.com/fgvsuiye/autojs6/issues)

<!-- 项目状态徽章 -->
[![GitHub last commit](https://img.shields.io/github/last-commit/fgvsuiye/autojs6)](https://github.com/fgvsuiye/autojs6/commits/main)
[![GitHub contributors](https://img.shields.io/github/contributors/fgvsuiye/autojs6)](https://github.com/fgvsuiye/autojs6/graphs/contributors)
[![GitHub Release Downloads](https://img.shields.io/github/downloads/fgvsuiye/autojs6/total)](https://github.com/fgvsuiye/autojs6/releases)

</div>

---

## 📖 项目介绍

此脚本支持 **Auto.js 7 / AutoX.js** 及 **AutoJs6**，并利用安卓的 **无障碍服务** 实现的小米社区自动化操作脚本。它通过模拟真人的点击、滑动等行为，帮助用户自动完成社区内的各种日常任务，从而解放您的双手。

**核心功能:**
*   📱 **自动解锁**: 支持密码或图案解锁，定时唤醒手机执行任务。
*   📰 **内容浏览**: 自动循环浏览帖子（支持自定义篇数，如 10+ 篇）、模拟真人滑动停留。
*   ✅ **自动签到**: 集成云端打码平台点选验证码识别与仿真按压点击。
*   🚀 **任务中心**: 全面覆盖社区内的各种成长值任务。
*   ✍️ **数据记录**: 自动记录每日成长值的获取情况。
*   🔔 **消息推送**: 支持通过 `ServerChan` 和 `PushPlus` 将运行结果推送到微信。

<br>

## ⚠️ 重要声明

> **小米社区解锁资格审查已添加以下内容：**
>
> > $\color{red}{是否有使用脚本或其他不当手段在小米社区获取成长值的行为}$
>
> 尽管此脚本通过模拟真人操作来降低风险，但任何自动化行为都存在被平台检测到的可能性。
>
> **使用此脚本可能会导致您的账户被列入黑名单。请您充分了解相关风险后，自行决定是否使用。您需要自行承担使用本脚本可能带来的一切后果。**

<br>

## 🚀 快速开始

请按照以下步骤完成安装和配置，即可开始您的自动化之旅。

### 1. 环境准备
- 下载并安装 **AutoX.js v7**（推荐）或 **AutoJs6**。
  - [➡️ 前往 AutoX.js 仓库 (aiselp/AutoX)](https://github.com/aiselp/AutoX)
  - [➡️ 前往 AutoJs6 仓库 (SuperMonster003/AutoJs6)](https://github.com/SuperMonster003/AutoJs6)
- 授予应用必要的权限，如：**无障碍服务**、**后台弹出界面**、**修改系统设置**、**shizuku** 等。

### 2. 下载项目
- 将本项目克隆到 Auto.js 工作目录，并在之后通过 Git 拉取更新。请保留同一个项目目录；若删除并重新下载整个目录，请先备份 `config/config.local.js`。

### 3. 修改配置
- 首次配置时，将 `config/config.local.example.js` 复制为 `config/config.local.js`，之后可直接修改任意选项。
- 在 `config/config.local.js` 中填写个人设置，如解锁密码和 Token。
- `config/config.js` 是项目默认配置，请勿在其中填写个人信息或 Token。

### 4. 给予权限
- 在 Auto.js 中，确保脚本所需的权限（无障碍、截屏权限）已正常授权。

### 5. 运行脚本
- 在 Auto.js 中，运行项目根目录下的 `main.js` 文件。

<br>

## ✨ 功能配置

### 帖子浏览篇数配置
在 `config/config.local.js` 的 `任务.浏览帖子` 中配置目标篇数（例如 `10` 篇），脚本会自动滑动轮巡：
单次浏览用时11-15秒，建议设置1-2次。
```javascript
module.exports = {
    任务: {
        浏览帖子: 3 // 自定义浏览篇数，为 0 时跳过
    }
};
```

### 微信消息推送
如果需要将脚本运行结果推送到微信：
1. 在 `config/config.local.js` 中启用 `推送` 选项（方式 1 为 ServerChan，方式 2 为 PushPlus）。
2. 获取推送服务的 Token：
   * **ServerChan**: [点击前往注册](https://sct.ftqq.com/)
   * **PushPlus**: [点击前往注册](https://pushplus.hxtrip.com/)
3. 将获取到的 Token 填入 `config/config.local.js` 中对应的配置项。

### 验证码识别
签到功能依赖第三方验证码识别服务，目前适配 **云码** 平台：
1. 注册并获取 Token：
   * **云码**: [点击前往注册](https://www.jfbym.com/)
2. 进入个人中心获取我的账号 Token。
3. 将获取到的 Token 填入 `config/config.local.js` 的 `验证码.token` 字段。

<br>

## 💡 注意事项

* **权限设置**: 请确保系统设置中为 Auto.js 授予了 **无障碍服务** 和 **媒体投影权限** 。
* **屏幕遮挡**: 建议不要开启 Auto.js 悬浮窗或控制台悬浮遮罩，以免遮挡验证码弹窗。
* **锁屏时间**: 建议将系统的自动锁屏时间设置为不低于 30 秒，防止执行长任务时灭屏。

<br>

## 📜 更新日志

<details>
<summary>点击展开查看历史更新</summary>

### V4.1.2 (261024)
> 1. `修复` 浏览帖子中多个帖子浏览时长并不会累计，修复单次浏览时长小于10秒导致任务失败的问题。
> 2. `优化` 新增模板配置文件，可自动合并本地配置与默认配置，无需手动复制配置。    
> 
> 首次下载 --> 将`config/config.local.example.js` 复制为 `config.local.js`      
> 
> 更新至此版本 --> 请将你的`config/config.js` 重命名为 `config.local.js`。            
>     
> ***config.local.js 为最终配置文件，需要修改配置请修改此配置，此配置不会随更新而被覆盖。***
### V4.1 (261023)
> 1. `优化` 浏览帖子支持自定义循环篇数（默认浏览 3 篇），自动滑动翻页防重。
> 2. `修复` 解决截屏权限申请时跳转 AutoX.js 导致社区验证码弹窗丢失焦点的问题。
> 3. `优化` 移除前台悬浮窗遮挡，避免干扰打码图片截取与阻断点击事件。
> 4. `优化` 验证码点击改用仿真按压与随机微偏移，提升点选验证码连续点击成功率。
> 5. `优化` 优化退出与重启应用逻辑，无需 Root 亦可安全终止社区后台。

### V4.0 (261004)
> 1. `优化` 优化了整体逻辑，代码结构。运行更加稳定。
> 2. `优化` 现在日志更加清晰，且可选输出等级。
> 3. `优化` 更改验证码接口类型，积分消耗更少。

### V3.14 (260924)
> 1. `修改` 由于验证码识别难度增加，训练模型变得异常复杂，因此替换为付费第三方验证码识别服务。
> 2. `修改` 删除更新及本地模型文件。

### V3.13 (251107)
> 1. `优化` 优化成长值记录任务名称识别错误。
> 2. `精简` 去除更新，精简日志。
</details>

<br>

## 🙏 致谢

* **@PJxiaoyu** - 项目的原始作者
* **[@ChiamZhang](https://github.com/ChiamZhang)** - 提交了 PR #17，适配多款 AutoJS/AutoX 软件，优化了验证码仿真按压防漏点机制，并支持自定义连续浏览帖子等。
* **AutoJs6** - 强大的自动化工具
* **所有贡献者和用户** - 感谢你们的支持与反馈
