
<div align="center">

# 小米社区自动化脚本
<p align="center">
  一个基于 AutoJs6 的小米社区自动化脚本，旨在简化每日任务，轻松获取成长值。
  <br />
  <br />
  <a href="https://github.com/fgvsuiye/autojs6/releases">下载最新版本</a>
  ·
  <a href="#">报告 Bug</a>
  ·
  <a href="#">提出新功能</a>
</p>

[![版本](https://img.shields.io/badge/Version-v3.13-blue.svg)](https://github.com/fgvsuiye/autojs6/releases)
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

此脚本是基于 **AutoJs6**，并利用安卓的 **无障碍服务** 实现的小米社区自动化操作脚本。它通过模拟真人的点击、滑动等行为，帮助用户自动完成社区内的各种日常任务，从而解放您的双手。

**核心功能:**
*   📱 **自动解锁**: 支持密码或图案解锁，定时唤醒手机执行任务。
*   📰 **内容浏览**: 自动浏览帖子、完成阅读任务。
*   ✅ **自动签到**: 集成YOLOv11模型，实现本地化的验证码识别与自动签到。
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
- 下载并安装 **AutoJs6**。
  - [➡️ 前往下载页面](https://github.com/SuperMonster003/AutoJs6/releases)
- 授予 AutoJs6 必要的权限，如：**无障碍服务**、**悬浮窗**、**后台弹出界面**、**截图**等。建议在 AutoJs6 的侧边栏中开启所有相关权限以避免运行问题。

### 2. 下载项目
- 下载本项目的最新 ZIP 压缩包，并解压到您的 AutoJs6 工作目录。
  - [➡️ 点击下载项目](https://github.com/fgvsuiye/autojs6/releases)

### 3. 修改配置
- 使用文本编辑器打开项目中的 `tmp/config.js` 文件。
- 仔细阅读文件内的注释，并根据您的个人情况（如解锁密码、推送Token等）修改配置项。

### 4. 安装插件
- 在解压后的项目中找到 `yolov11/` 文件夹。
- 安装该文件夹下的 `Yolo-plugins.apk` 插件，这是验证码识别功能的核心。

### 5. 运行脚本
- 在 AutoJs6 中，运行项目根目录下的 `main.js` 文件。
- 首次运行请保持手机屏幕常亮，并关注脚本的运行状态，确保一切正常。

<br>

## 📂 文件结构

```
.
├── main.js              # 🚀 主程序入口
├── pushToWechat.js      # 🔔 微信推送模块
├── README.md            # 📄 项目说明文档
├── tmp/                 # ⚙️ 临时与配置目录
│   ├── config.js        #   - 配置文件 (重要)
│   ├── level.txt        #   - 成长值记录文件
│   └── pic.png          #   - 验证码截图缓存
└── yolov11/             # 🧠 YOLO 识别模块
    ├── model/           #   - 模型文件目录
    │   ├── yzm.bin
    │   └── yzm.param
    ├── Yolo-Plugins.apk #   - YOLO 插件 (必须安装)
    └── yolov11.js       #   - YOLOv11 功能模块
```

<br>

## ✨ 功能配置

### 微信消息推送

如果需要将脚本运行结果推送到微信，请按以下步骤操作：

1.  在 `config.js` 文件中找到并启用 `微信推送` 选项。
2.  注册并获取推送服务的 Token：
    *   **ServerChan**: [点击前往注册](https://sct.ftqq.com/)
    *   **PushPlus**: [点击前往注册](https://pushplus.hxtrip.com/)
3.  将获取到的 Token 填入 `config.js` 中对应的配置项。

<br>

## 💡 注意事项

*   **权限问题**: 大部分脚本运行失败都是由于 AutoJs6 权限不足。请确保 **无障碍服务**、**后台弹出界面**、**截图** 等权限已正确授予。
*   **锁屏时间**: 建议将系统的自动锁屏时间设置为 **不低于20秒**，以防脚本在执行长时间任务时因锁屏而中断。
*   **模型加载**: 如果您的设备在使用 GPU 调用 YOLO 模型时出错，脚本已默认不使用 GPU。若 YOLO 模型初始化失败，签到任务将被自动跳过。

<br>

## 📜 更新日志

<details>
<summary>点击展开查看历史更新</summary>

### V3.13 (251107)
 > 1. `优化` 优化成长值记录任务名称识别错误。
 > 2. `精简` 去除更新，精简日志。
### V3.12 (250612)
 > 1. `优化` 感恩季活动上线。
 > 2. `优化` 优化成长值记录。
### V3.11 (250602)
 > 1. `优化` 部分设备使用GPU调用YOLO模型可能会出现错误，修改为默认不适用GPU。
 > 2. `优化` YOLO模型初始化失败时，跳过签到。
### V3.10 (250531)
 > 1. `修复` 签到后控件增加导致任务数量计算错误。
### V3.9 (250529)
 > 1. `修复` 截图出错导致的签到失败。
 > 2. `优化` 更清晰的微信推送信息。
### V3.8 (250521) 
 > 1. `优化` 下载文件后添加SHA校验。
 > 2. `优化` 更新器检查本地版本时优先检查非js文件，避免误报版本。
### V3.7 (250518) 
 > 1. `新增` 支持全量更新，首次只需下载运行`main.js`运行即可下载其它文件。
 > 2. `新增` 支持将结果推送至微信
   
### V3.5 (250516) 
 > 1. `优化` 代理和版本信息只请求一次，脚本之间本地共享。
 > 2. `新增` config文件更新时，新旧文件自动合并。

### V3.4 (250515) 
 > 1. `优化` config文件更新时，保存为.bak而源文件不变。
 > 2. `优化` 首次运行时，自动下载更新脚本。
### V3.3 (250514) 
 > 1. `修复` 自动更新文件列表由云端获取。
 > 2. `修复` 社区控件信息更新导致的验证码截图及签到失败。
 > 3. `优化` 旗舰活动解锁判断。
### V3.2 (250513) 
 > 1. `新增`自动更新功能。
 > 2. `修复`部分bug。
 > 3. 本次更新文件（`main.js`）
### V3.1 (250512) 
 > 1. `新增`检查更新功能。
 > 2. `修复`验证码识别结果可能会返回错误结果。
 > 3. `优化`浏览帖子页面识别。
 > 4. `优化`小程序签到添加更多延迟以防加载缓慢。
 > 5. 本次更新文件（`main.js`、`config.js`、`yolov11.js`）
### V3.0 (250508) *重要更新*
> 1. 验证码识别本地化，不再依赖服务器。
> 2. 大量优化代码逻辑。
> 3. 修复部分bug并添加新的bug（bushi）。
### V2.2 (250419)
> 1. 修复帖子页面可能识别错误
> 2. 浏览帖子时添加滑动，防止长时间无操作熄屏
> 3. 添加服务器测试
> 4. 现在可以返回明确的错误信息
### V2.1 (250416) 
 > 1. 添加置信度。
>  2. 修改根据控件截图，不再需要手动调整截图范围

### V2.0 (250413) 
 > 1. 添加新的验证码识别。

### V1.1 (250401)
 > 1. 官方签到验证码变更，脚本不再签到，其它活动照常。


### V1.1 (250327)
 > 1. 优化部分控件查找逻辑。
 > 2. 添加部分页面错误后重试。
 > 3. 添加成长值明细日志。
 > 4. 美化日志输出。


### V1.0 (250324)
 > 1. 优化小程序签到。
 > 2. 优化成长值记录


### V0.8 (241210)
 > 1. 感恩季活动上线。

### V0.8 (241102)
 > 1. 支持新版社区浏览帖子。
 > 2. 删除感恩季活动。

### V0.8 (240720)
 > 1. 添加加入圈子活动和感恩季活动。

### V0.8 (240705)
 > 1. 添加解锁方式。

### V0.7
 > 1. 增加了滑动方式，随机选择由快至慢滑动或贝塞尔曲线滑动。

### V0.6
 > 1. 增加签到+1概率、总成长值及当日获取成长值显示并写入文件。
 > 2. 修改滑块识别流程，速度大幅提升。

### V0.5
 > 1. 增加了滑动解锁功能（根据自己解锁图案自行修改）。
 > 2. 增加了米粉节活动（官方活动已下线）。
 > 3. 增加了观看视频任务（官方活动已下线）。
 > 4. 增加了成长值查看输出。
 > 5. 增加了日志输出。
 > 6. 修改了浏览帖子正则表达式，使其能匹配（01-01至12-31）日期格式。
 > 7. 优化了代码结构。
 > 8. 优化了退出程序功能（功能执行完毕或定时器结束后都会停止脚本）。
</details>

<br>

## 🙏 致谢

*   **@PJxiaoyu** - 项目的原始作者
*   **AutoJs6** - 强大的自动化工具
*   **所有贡献者和用户** - 感谢你们的支持与反馈

```