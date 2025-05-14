/*
 * 小米社区签到脚本
 * 原作者：  @PJxiaoyu
 * 修改：    风中拾叶
 * 更新日期：2025-05-14
 * 版本：    v3.3
 * 更新内容:
    > 1. `修复` 自动更新文件列表由云端获取。
    > 2. `修复` 社区控件信息更新导致的验证码截图及签到失败。
    > 3. `优化` 旗舰活动解锁判断。
    
*/
// 更新参数
const CURRENT_SCRIPT_VERSION = 20250514;          // 当前脚本版本号

var config = require("./tmp/config.js"); // 引入配置文件
importClass(android.content.Context);
importClass(android.app.NotificationManager);
importClass(android.app.PendingIntent);
importClass(android.content.Intent);
importClass(android.net.Uri);
importClass(androidx.core.app.NotificationCompat);
importClass(android.os.Build);

// --- 常量定义 ---
const APP_PACKAGE_NAME = config.packageName;      // 小米社区包名
const YOLO_MODULE_PATH = config.yoloModelPath;    // YOLOv11 模块路径
const CAPTURE_PIC_PATH = config.capturePicPath;   // 验证码截图路径
const LEVEL_RECORD_PATH = config.levelRecordPath; // 成长值记录路径 
const DEFAULT_TIMEOUT = config.defaultTimeout;    // 默认查找超时时间 (ms)
const SHORT_TIMEOUT = config.shortTimeout;        // 较短超时时间
const RETRY_TIMES = config.retryTimes;            // 主要操作的重试次数

const NOTIFICATION_CHANNEL_ID = "AutoJsUpdateChannel";// 通知渠道 ID
const NOTIFICATION_CHANNEL_NAME = "脚本更新通知"; // 显示在系统设置中的渠道名称

// --- 全局变量 ---
var dwidth = device.width;
var dheight = device.height;
var todayDate = formatDate(new Date());
var startTime = new Date().getTime(); // 用于脚本总超时计时
var yoloProcessor = null; // 初始化为 null
var lx, ly
var needUpdate = false; // 是否需要更新
var downloadList, updateList; // 下载列表和更新日期
var updateDate = storages.create("updateDate");
let today = parseInt(todayDate.replace(/-/g, ''));


console.setSize(dwidth, dheight * 0.25)
console.setPosition(0, 0)
console.show()
console.warn(">>>>>>>---| 脚本启动 |---<<<<<<<");
console.log(`今天是：${todayDate}`);
console.log(`设备分辨率：${dwidth}x${dheight}`);
setScaleBases(1080, 2400); // 设置缩放基准
device.keepScreenOn(180 * 1000); // 保持屏幕常亮
// --- 初始化 ---
try {
    // 加载 YOLO 模块
    console.info(">>>>>>>---| 加载模块 |---<<<<<<<");
    yoloProcessor = require(YOLO_MODULE_PATH);
    if (typeof yoloProcessor !== 'function') {
        throw new Error(`模块 ${YOLO_MODULE_PATH} 未导出函数`);
    }
    log("YOLO 处理模块加载成功");
} catch (e) {
    console.error(`加载 YOLO 处理模块失败: ${e}`);
    toastLog(`加载 YOLO 模块失败，签到功能可能无法使用！`);
}

// --- 启动脚本运行超时监控 ---
startTimeoutMonitor(config.totaltime * 1000); // totaltime 单位是秒，转为毫秒

// --- 主程序入口 ---
main();

// ========================
// === 辅助函数区域 ===
// ========================

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} dateObj - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(dateObj) {
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    let day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 启动脚本总运行时间监控
 * @param {number} maxRuntimeMs - 最大允许运行时间 (毫秒)
 */
function startTimeoutMonitor(maxRuntimeMs) {
    threads.start(function() {
        setInterval(function() {
            let currentTime = new Date().getTime();
            if (currentTime - startTime > maxRuntimeMs) {
                log(`脚本运行超过设定的 ${maxRuntimeMs / 1000} 秒，强制退出`);
                exit();
            }
        }, 10000); // 每 10 秒检查一次
    });
}

/**
 * 安全地点击控件，如果控件存在
 * @param {UiObject} control - UI 控件
 * @param {string} logMsg - 点击成功时记录的消息
 * @returns {boolean} 是否成功点击
 */
function safeClick(control, logMsg) {
    if (control) {
        try {
            control.click();
            if (logMsg) log(logMsg);
            sleep(500); // 点击后短暂延时
            return true;
        } catch (e) {
            console.error(`点击控件时出错: ${e}`);
            return false;
        }
    }
    return false;
}

/**
 * 点击控件的中心位置
 * @param {UiObject} obj - UI 控件
 */
function clickCenter(obj) {
    try {
        if (obj instanceof UiObject === false) {
            return;
        }
        let x = obj.bounds().centerX();
        let y = obj.bounds().centerY();
        console.log('点击中心坐标', x, y)
        click(x, y);
    } catch (e) {
        console.error(`点击控件时出错: ${e}`);
    }
}

/**
 * 封装的 wait 函数，带日志和清晰的返回
 * @param {Function} conditionFunc - 返回 boolean 的条件函数
 * @param {number} maxRetries - 最大尝试次数
 * @param {number} intervalMs - 每次尝试间隔 (ms)
 * @param {string} description - 等待描述，用于日志输出
 * @returns {boolean} 条件是否在指定次数内达成
 */
function waitFor(conditionFunc, maxRetries, intervalMs, description) {
    log(`等待条件: ${description}`);
    for (let i = 0; i < maxRetries; i++) {
        if (conditionFunc()) {
            log(`条件达成: ${description}`);
            return true;
        }
        if (i < maxRetries - 1) sleep(intervalMs);
    }
    log(`等待超时: ${description}`);
    return false;
}

// ========================
// === 核心功能函数区域 ===
// ========================


/**
 * 执行一次解锁操作
 * @returns {boolean} 返回操作是否按预期执行完成
 */
function attemptSingleUnlock() {
    let unlockMethod = config.解锁方式;
    let randomOffsetY = random(-150, 150); // 随机偏移量，增加滑动鲁棒性

    // 1. 确保屏幕亮起
    if (!device.isScreenOn()) {
        log("屏幕未点亮，尝试唤醒...");
        device.wakeUp();
        sleep(SHORT_TIMEOUT); // 等待屏幕亮起稳定
        if (!device.isScreenOn()) {
            log("唤醒屏幕失败。");
            return false; // 唤醒失败，本次尝试中止
        }
        log("屏幕已成功唤醒。");
    } else {
        log("屏幕已点亮。");
    }
    if (unlockMethod != 1 && unlockMethod != 2 ) {
        log("上滑解锁");
        swipe(dwidth / 2, dheight * 0.7 + randomOffsetY, dwidth / 2, dheight * 0.3 + randomOffsetY, 200); // 上滑
        sleep(500); // 等待滑动动画
        return true; // 
    }
    // 2. 尝试上滑进入解锁界面 
    log("上滑以显示解锁界面...");
    let unlockInterfaceVisible = false;
    for (let i = 0; i < 3; i++) { // 最多尝试3次上滑
        if (waitFor(() => {
            swipe(dwidth / 2, dheight * 0.7 + randomOffsetY, dwidth / 2, dheight * 0.3 + randomOffsetY, 200); // 上滑
            sleep(500); // 等待滑动动画
            return textMatches(/(紧急呼叫|Emergency call)/).exists(); // 检查解锁界面标志
        }, 5, 1000, "上滑进入解锁界面")){
            unlockInterfaceVisible = true;
            break; // 成功找到解锁界面，退出循环
        } else {
            log("解锁界面未出现，尝试再次上滑");
            sleep(1000); // 失败后等待一下再重试
        }
    }

    if (!unlockInterfaceVisible && (unlockMethod == 1 || unlockMethod == 2)) {
        log("多次尝试后仍未进入解锁界面，本次解锁尝试中止。");
        return false; // 表示本次解锁尝试因找不到解锁界面而失败
    }

    sleep(1000); // 等待解锁界面稳定

    // 3. 执行具体的解锁方法
    try {
        if (unlockMethod == 1) {
            log("执行图案解锁...");
            if (!config || !config.锁屏图案坐标 || !Array.isArray(config.锁屏图案坐标) || config.锁屏图案坐标.length === 0) {
                log("错误：锁屏图案坐标未配置或格式不正确。");
                return false; // 配置错误，无法继续
            }
            gesture(800, config.锁屏图案坐标); // 增加手势时间
        } else if (unlockMethod == 2) {
            log("执行数字密码解锁...");
            if (!config || typeof config.锁屏数字密码 === 'undefined') {
                log("错误：锁屏数字密码未配置。");
                return false; // 配置错误
            }
            let password = String(config.锁屏数字密码); 
            for (let digit of password) {
                let btn = desc(digit).findOne(SHORT_TIMEOUT);
                if (!safeClick(btn)) {
                    log(`未找到数字 '${digit}' 按钮`);
                    console.error("数字密码解锁失败");
                    return false; 
                }
                sleep(100); // 按键间隔
            }
        } else {
            log("未知的解锁方式配置：" + unlockMethod);
            return false; // 无效配置
        }

        log("解锁操作序列执行完成，等待系统响应...");
        sleep(2000); // 等待解锁动画和状态更新
        return true; // 表示解锁动作序列已成功执行

    } catch (e) {
        console.error(`解锁操作过程中发生异常: ${e}`);
        return false; // 执行出错
    }
}

/**
 * 检查设备解锁状态
 * @param {number} maxRetries - 最大解锁尝试次数，默认为 3。
 * @returns {boolean} - 设备成功解锁则返回 true，否则返回 false。
 */
function ensureDeviceUnlocked(maxRetries = RETRY_TIMES) {
    console.info(">>>>>>>---| 解锁设备 |---<<<<<<<");
    let km = context.getSystemService(Context.KEYGUARD_SERVICE);
    let retryCount = 0;
    // 初始检查：如果设备未锁定，直接返回成功
    if (!km.inKeyguardRestrictedInputMode()) {
        log("设备当前状态：未锁定。");

        return true;
    }

    log("设备当前状态：已锁定。");

    // 主循环：尝试解锁直到成功或达到最大次数
    while (retryCount < maxRetries) {
        retryCount++;
        log(`--- 第 ${retryCount} / ${maxRetries} 次尝试解锁 ---`);

        // 获取当前屏幕状态
        let isScreenOnInitially = device.isScreenOn();
        log(`当前屏幕状态：${isScreenOnInitially ? '亮屏' : '息屏'}`);

        let attemptSuccess = attemptSingleUnlock();

        if (!attemptSuccess) {
            log(`第 ${retryCount} 次解锁尝试中操作执行失败或中断。`);
            sleep(SHORT_TIMEOUT); // 失败后等待一下再重试
            continue; // 继续下一次循环尝试
        }

        // 解锁操作执行后，再次检查锁定状态
        km = context.getSystemService(Context.KEYGUARD_SERVICE); // 重新获取服务以获得最新状态
        if (!km.inKeyguardRestrictedInputMode()) {
            log(`第 ${retryCount} 次解锁成功：设备已解锁！`);
            return true;
        } else {
            log(`第 ${retryCount} 次解锁尝试后，设备仍处于锁定状态。`);
            // 可能原因：密码/图案错误、解锁界面未按预期消失、系统延迟等
            KeyCode(26)
            log("准备进行下一次重试...");
            sleep(SHORT_TIMEOUT); // 重试前等待
        }
    }

    // 如果循环结束仍未解锁
    log(`已达到最大尝试次数 (${maxRetries}次)，设备仍未解锁。`);
    console.error("解锁失败！请检查配置（解锁方式、密码/图案）、设备状态或增加等待时间。");
    return false; // 所有尝试均失败，函数返回 false
}


/**
 * 强制停止应用
 * @param {string} packageName - 应用包名
 */
function killApp(packageName) {
    log(`尝试结束应用: ${packageName}`);
    try {
        app.openAppSetting(packageName);
        sleep(1500); // 等待设置页面加载
        // 查找“结束运行”或“强制停止”按钮
        let stopButton = textMatches(/(结束运行|强行停止|FORCE STOP)/).findOne(DEFAULT_TIMEOUT);
        if (stopButton && stopButton.enabled()) {
            if (click("结束运行"||"强行停止")) {
                // 查找并点击确认对话框的 "确定" 按钮
                if (textContains("确定").findOne(SHORT_TIMEOUT)) {
                    click("确定");
                    log("结束小米社区");
                }else{
                    log("程序未运行");
                }
            } else {
                 log("无法点击 '结束运行/强行停止' 按钮");
            }
        } else {
            log("未找到或无法点击结束按钮，可能应用未运行");
        }
    } catch (e) {
        console.error(`结束应用 ${packageName} 时出错: ${e}`);
    }
    sleep(1000); // 等待结束动画
}

/**
 * 重启小米社区应用
 * @param {boolean} firstOpen - 是否是首次启动(浏览帖子)
 */
function restartApp(firstOpen = false) {
    killApp(APP_PACKAGE_NAME);
    log("启动小米社区应用");
    if (app.launch(APP_PACKAGE_NAME)) {
         // 等待应用启动加载完成，检查首页特征元素
         waitFor(() => desc('签到').findOne(DEFAULT_TIMEOUT), 2, SHORT_TIMEOUT, "应用首页加载");
    } else {
        log("启动应用失败");
    }
    // 处理可能的权限请求弹窗
    let allowBtn = textMatches(/(允许|允许使用|Allow)/).findOne(1000);
    if (allowBtn) safeClick(allowBtn);
    if (!firstOpen) {
        // 非首次启动
        let signBtn = desc("签到").findOne(SHORT_TIMEOUT);
        safeClick(signBtn, "点击 '签到' 按钮")
    }
}

/**
 * 浏览帖子任务
 */
function browsePosts() {
    console.info(">>>>>>>---| 浏览帖子 |---<<<<<<<");
    try {
        if (waitFor(() => {
            let regex = /((0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9]))|(0[0-9]|1[0-9]|2[0-3])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/;
            var targetSelectors = [
                textMatches(regex),
                desc("评论"), 
                id('img_tri_fst')
            ];
            for (let selector of targetSelectors) {
                let target = selector.findOne(SHORT_TIMEOUT);
                if (target) {
                    log("找到帖子页面");
                    target.clickable() ? safeClick(target, "点击帖子") : clickCenter(target); // 点击帖子
                    return true;
                }
                swipe(dwidth * 0.5, dheight * 0.8, dwidth * 0.5, dheight * 0.5, random(400, 600)); 
            }
            log("未找到帖子页面,尝试重启应用");
            restartApp(true);
            return false;
        }, 2, 1000, "帖子详情页加载")) {
            log("打开帖子成功, 开始浏览");
            sleep(random(6000, 7000)); // 随机浏览时间
            swipe(dwidth * 0.5, dheight * 0.8, dwidth * 0.5, dheight * 0.2, random(400, 600)); // 向下滚动
            sleep(random(6000, 7000)); // 再浏览一会儿
            log("浏览完成");
        } else {
             log("打开帖子失败或超时");
        }
        back(); // 返回列表页
    } catch (e) {
        console.error(`浏览帖子任务出错: ${e}`);
        back(); // 尝试返回
    }
}

/**
 * 处理新的验证码签到
 */
function handleNewSign() {
    if (!yoloProcessor) {
        log("YOLO 模块未加载，无法进行验证码识别签到");
        return false; // 表示签到失败
    }

    let signSuccess = false;
    for (let i = 0; i < RETRY_TIMES; i++) {
        log(`开始第 ${i + 1} 次签到尝试`);

        // 1. 截图
        let capturedImage = captureVerificationCodeImage();
        if (!capturedImage) {
            log("截图失败，跳过此次尝试");
            // 尝试刷新验证码
            let refreshBtn = textContains("刷新验证").findOne(SHORT_TIMEOUT);
            safeClick(refreshBtn);
            sleep(1000);
            continue;
        }

        // 2. 调用 YOLO 识别
        log("调用 YOLO 模型识别...");
        let detectionResult = null;
        try {
            detectionResult = yoloProcessor(CAPTURE_PIC_PATH); // 模型路径
        } catch (e) {
             console.error(`YOLO 识别调用出错: ${e}`);
        } finally {
             capturedImage.recycle(); // 回收截图资源
        }

        // 3. 处理识别结果并点击
        if (detectionResult && detectionResult.length > 0) {
            log(`识别成功 ${detectionResult.length} 个目标`);
            clickDetectedItems(detectionResult); // 点击识别出的图标
            // 检查签到结果
            if (waitFor(() => textContains("已签到").findOne(5000), 2, 1000, "已签到")) {
                log("签到成功！");
                signSuccess = true;
                break; // 成功则跳出循环
            } else {
                log("提交后未检测到 '已签到'，可能失败，尝试刷新");
                click("刷新验证")
             .  sleep(1500); // 等待刷新
            }
        } else {
            log("YOLO 未识别到目标或识别失败，尝试刷新验证码");
            click("刷新验证")
            sleep(1500); // 等待验证码刷新
        }
    }
    return signSuccess;
}

/**
 * 截取验证码区域图像
 * @returns {Image | null} 截图对象或 null
 */
function captureVerificationCodeImage() {
    log("尝试截取验证码区域");
    sleep(2000); // 等待界面稳定
    let image = null;
    try {
        // 定位验证码区域的边界元素
        let topBoundaryParent = textContains("请在下图依次").findOne(DEFAULT_TIMEOUT)?.parent()?.parent();
        let bottomBoundary = text("确认").findOne(DEFAULT_TIMEOUT);
        if (topBoundaryParent && bottomBoundary) {
            let bounds = topBoundaryParent.bounds();
            let bottomBounds = bottomBoundary.bounds();
            lx = bounds.left;
            ly = bounds.top;
            let wid = bottomBounds.right - lx; // 使用提交按钮右侧作为宽度
            let hei = bottomBounds.top - ly; // 使用提交按钮顶部作为高度

            if (wid > 0 && hei > 0 && lx >= 0 && ly >= 0 && (lx + wid) <= dwidth && (ly + hei) <= dheight) {
                console.hide();
                sleep(100)
                let screen = captureScreen();
                if (!screen) {
                     log("获取屏幕截图失败");
                     return null;
                }
                image = images.clip(screen, lx, ly, wid, hei);
                console.show()
                if (image) {
                    files.ensureDir(CAPTURE_PIC_PATH); // 确保目录存在
                    images.save(image, CAPTURE_PIC_PATH, "png", 90); // 保存截图用于模型输入
                    log(`验证码区域截图成功: (${lx},${ly},${wid},${hei})`);
                    return image;
                } else {
                    log("裁剪截图失败");
                }
            } else {
                log("计算出的截图区域无效");
            }
        } else {
            log("未能定位到验证码区域边界元素");
        }
    } catch (e) {
        console.error(`截图验证码时出错: ${e}`);
    }
    return null; // 失败返回 null
}

/**
 * 根据识别结果点击图标
 * @param {Array<object>} list - YOLO 返回的结果列表 [{centerX, centerY, prob, label}, ...]
 */

function clickDetectedItems(list) {
    log("开始按顺序点击识别出的图标");
    list.forEach(({ centerX, centerY, prob, label }, index) => {
        let finalX = centerX + lx;
        let finalY = centerY + ly;
        log(`点击第 ${index + 1} 个: ${label} (置信度: ${prob.toFixed(2)}) @ (${finalX}, ${finalY})`);
        // 使用 click 精确点击中心点
        if (!click(finalX, finalY)) {
            console.warn(`点击坐标 (${finalX}, ${finalY}) 可能失败`);
        }
        sleep(random(500, 800)); // 模拟点击间隔 
    });
    click("确认"); // 点击提交按钮
    log("图标点击完成");
}

/**
 * 执行签到流程
 */
function performSign() {
    console.info(">>>>>>>---| 开始签到 |---<<<<<<<");
    try {
        let alreadySigned = textContains("已签到").findOne(SHORT_TIMEOUT);
        if (alreadySigned) {
            log("今日已签到");
            return true; // 返回签到状态
        }

        let signInButton = text("立即签到").findOne(DEFAULT_TIMEOUT);
        if (!signInButton) {
             log("未找到 '立即签到' 按钮");
             return false;
        }

        if (safeClick(signInButton, "点击 '立即签到'")) {
             sleep(1000); // 等待验证码界面加载
            return handleNewSign(); // 处理带验证码的签到
        } else {
            log("点击 '立即签到' 失败");
            return false;
        }
    } catch (e) {
        console.error(`执行签到流程时出错: ${e}`);
        return false;
    }
}

/**
 * 检查是否在签到主页面
 * @returns {boolean} 是否在签到页面
 */
function isInSignPage() {
     // 签到图标
    sleep(SHORT_TIMEOUT); 
    let feature1 = textContains("社区勋章").exists();
    let feature2 = textContains("社区成长等级").exists();
    // 要求两个特征满足
    let inPage = feature1 && feature2;
    if (inPage) {
         log("当前在签到页面");
    } else {
        log("当前不在签到页面");
    }
    return inPage;
    
}

/**
 * 拔萝卜活动
 */
function carrotActivity() {
    console.info(">>>>>>>---| 萝卜活动 |---<<<<<<<");
    try {
        swipe(dwidth * 0.5, dheight * 0.8, dwidth * 0.5, dheight * 0.4, 500); // 向下滚动查找
        sleep(1000);

        let goButton = text("去看看").findOne(DEFAULT_TIMEOUT);
        if (safeClick(goButton, "点击 '去看看' (拔萝卜)")) {
            sleep(1000); // 停留2秒
            log("拔萝卜活动签到（模拟）");
            back();
        } else {
            log("未找到 '去看看' 按钮 (拔萝卜)");
        }
    } catch (e) {
        console.error(`拔萝卜活动出错: ${e}`);
        back(); // 尝试返回
    }
}

/**
 * 观看视频任务
 */
function watchVideoTask() {
    console.info(">>>>>>>---| 视频任务 |---<<<<<<<");
    try {
        let watchButton = className("android.widget.Button").text("去浏览").findOne(DEFAULT_TIMEOUT);
        if (safeClick(watchButton, "点击 '去浏览' (视频)")) {
            log("开始浏览视频");
            let watchStartTime = new Date().getTime();
            let targetWatchMinutes = 5; // 目标观看分钟数
            let lastLogMinute = -1;

            while (true) {
                let elapsedMs = new Date().getTime() - watchStartTime;
                let elapsedMinutes = elapsedMs / (1000 * 60);

                if (elapsedMinutes >= targetWatchMinutes) {
                    log(`已观看 ${targetWatchMinutes} 分钟，退出视频`);
                    break;
                }

                let currentMinute = Math.floor(elapsedMinutes);
                if (currentMinute > lastLogMinute) {
                    log(`已观看约 ${currentMinute} 分钟`);
                    lastLogMinute = currentMinute;
                }

                // 模拟观看行为：随机滑动
                sleep(random(10000, 15000));
                let randomX = dwidth / 2 + random(-50, 50);
                let startY = dheight * 0.8 + random(-50, 50);
                let endY = dheight * 0.3 + random(-50, 50);
                swipe(randomX, startY, randomX, endY, random(400, 600));

                // 可选：增加退出条件，如检测到特定错误或按钮
            }
            back(); // 退出视频页面
        } else {
            log("未找到 '去浏览' 按钮 (视频)");
        }
    } catch (e) {
        console.error(`观看视频任务出错: ${e}`);
        back(); // 尝试返回
    }
}

/**
 * 记录成长值
 */
function recordLevel() {
    console.info(">>>>>>>---| 积分记录 |---<<<<<<<");
    try {
        let levelEntry = text("社区成长等级").findOne(DEFAULT_TIMEOUT);
        if (safeClick(levelEntry, "点击 '社区成长等级'")) {
            sleep(2000); // 等待明细页面加载

            let todayStr = todayDate.replace(/-/g, "/"); // 匹配页面格式
            let detailsFound = false;
            let totalPoints = 0;

            // 查找今日明细
            let todayItems = className("android.widget.TextView").textContains(todayStr).find();
            if (todayItems.nonEmpty()) {
                detailsFound = true;
                log("--- 今日成长值明细 ---");
                todayItems.forEach(item => {
                    try {
                        let taskName = item.previousSibling().text(); // 任务名称
                        let pointsText = item.nextSibling().text(); // 分值
                        let points = parseInt(pointsText.replace('+', ''));
                        if (!isNaN(points)) {
                            log(`${(taskName+'：').padEnd(17, '▒')}${pointsText.padStart(5, '')}`);
                            totalPoints += points;
                        }
                    } catch(eInner) {
                        console.warn(`解析某行明细时出错: ${eInner}`);
                    }
                });
                
                log(`今日总计：`.padEnd(17, '▒') + `+${totalPoints}`.padStart(5, ''));
            } else {
                log("未找到今日成长值明细");
            }
            // 查找当前总成长值
            let currentLevelText = className("android.widget.TextView").textContains("成长值").depth(13).indexInParent(1).findOne(SHORT_TIMEOUT);
            if (currentLevelText) {
                // 尝试提取数字部分
                let match = currentLevelText.text().match(/(\d+)\//);
                if (match && match[1]) {
                     let currentTotal = parseInt(match[1]);
                     log(`当前成长值：`.padEnd(17, '▒') + `${currentTotal}`.padStart(5, ''));
                     // 记录到文件
                     try {
                         files.append(LEVEL_RECORD_PATH, `\n${todayDate}：+${totalPoints.padEnd(5, " ")} 当前总计：${currentTotal}`);
                         log(`成长值已记录到 ${LEVEL_RECORD_PATH}`);
                     } catch (eFile) {
                         console.error(`写入成长值记录文件失败: ${eFile}`);
                     }
                } else {
                     log("无法从文本中解析当前成长值数字");
                }
            } else {
                log("未找到包含 '当前成长值' 的文本");
            }
            log("----------------------");
            back(); // 返回签到页
        } else {
            log("未找到 '社区成长等级' 入口");
        }
    } catch (e) {
        console.error(`记录成长值出错: ${e}`);
        back(); // 尝试返回
    }
}

/**
 * 双旗舰活动
 */
function dualFlagshipActivity() {
    console.info(">>>>>>>---| 旗舰活动 |---<<<<<<<");
    try {
        let cj = className("android.widget.Button").text("去参加").findOne(DEFAULT_TIMEOUT)
        if(safeClick(cj, "点击 '去参加' (双旗舰)")){

            // 是否首次参加活动
            let register = className("android.widget.Button").text("立即报名").findOne(SHORT_TIMEOUT)
            if(register){
                let checkBox = register.parent().child(1).click()
                if(checkBox){
                    safeClick(register, "点击 '立即报名' (双旗舰)")
                    sleep(2000)
                    let x = dwidth * 0.74
                    let y = dheight * 0.94
                    click(x,y)
                    sleep(1000)
                    }
            }
            解锁()
            sleep(1000)
            log("完成双旗舰活动")
            back()
        }else{
            log("未找到活动入口")
        }
    } catch (e) {
        console.error(`双旗舰活动出错: ${e}`);
        back(); // 尝试返回
    }
}

/**
 * 感恩季活动
 */
function thanksgivingActivity(){
    console.info(">>>>>>>---| 感恩活动 |---<<<<<<<")
    try {
        let qucanyu = className("android.widget.Button").text("去参与").findOne(3000)
        if(safeClick(qucanyu, "点击 '去参与' (感恩季)")){
            sleep(1000)
            解锁()
            sleep(1000)
        back()
        sleep(1000)
        }else{
            log("未找到活动入口")
        }
    } catch (e) {
        console.error(`感恩季活动出错: ${e}`);
        back(); // 尝试返回
    }
}

/**
 * 解锁
 */
function 解锁() {
    let jpso = className('TextView').text('可解锁').find()
    let count = className("android.widget.Button").text("去提升").findOne(3000).parent().child(1).text()
    if (jpso.size() > 0 && count > 0) {
        for (i = 0; i < jpso.size(); i++) {
            var control = jpso.get(i);
            if(count < 1){
                log("解锁次数不足")
                break;
            }
            safeClick(control, "点击解锁");
            log("第" + (i+1) + "次解锁");
            sleep(1000)
            let closeButton = indexInParent(1).childCount(1).depth(16).find()
            if(closeButton.length == 1){
                safeClick(closeButton.get(0), "关闭解锁提示");
            }
            sleep(1000)
            if(text("可获得1次解锁机会").exists() || i >= 10 || text("等待解锁").exists()){
                log("解锁次数不足")
                break
            }
        }
    } else {
        console.log("今日无解锁次数");
    }
}

/**
 * 小程序签到
 */
function miniAppSign() {
    console.info(">>>>>>>---| 程序签到 |---<<<<<<<");
    let success = false;
    try {
        let wechatButton = className("android.widget.Button").text("去微信").findOne(DEFAULT_TIMEOUT);
        if (!safeClick(wechatButton, "点击 '去微信'")) {
            log("未找到或无法点击 '去微信' 按钮，请检查社区 App 版本");
            return;
        }
        // 等待微信小程序加载
        if (waitFor(() => {
            let editProfileBtn = textContains('编辑资料').findOne(DEFAULT_TIMEOUT);
            let dailySignBtn = textContains("每日签到").exists();
            if (editProfileBtn && dailySignBtn) {
                return true;
            } else {
                if(!editProfileBtn){
                    log("未找到 '编辑资料' 按钮");
                }
                if(!dailySignBtn){
                    log("未找到 '每日签到' 按钮");
                }
                return false;
            }
        }, 2, SHORT_TIMEOUT, "微信小程序加载")) { // 等待时间加长
            log("进入微信小程序");
            sleep(1000);
            // 循环检查签到状态并尝试签到
             success = waitFor(() => {
                if (text("已签到").exists()) {
                    log("小程序已签到");
                    return true; // 条件达成，退出等待
                } else {
                    let signButton = text("去签到").findOne(SHORT_TIMEOUT);
                    if (safeClick(signButton, "点击 '去签到'")) {
                        sleep(1500); // 等待签到动画或状态更新
                        // 再次检查是否已签到
                        return text("已签到").exists();
                    } else {
                        log("未找到小程序 '去签到' 按钮，可能已签到或页面结构变化");
                        // 如果找不到按钮也找不到“已签到”，可能需要返回 true 避免死循环，或者认为失败
                        return text("已签到").exists(); // 再查一次
                    }
                }
            }, 3, 2000, "小程序签到完成"); // 重试次数减少，间隔增加
            if (!success) {
                log("小程序签到失败或超时");
            }
        } else {
            log("未能成功进入微信小程序或布局获取失败");
            log("尝试坐标点击，无法保证准确性。");
            click(cX(886), cY(1184))
            sleep(1000)
        }
    } catch (e) {
        console.error(`小程序签到出错: ${e}`);
    } finally {
        // 无论成功失败，尝试返回小米社区 App
        log("尝试返回小米社区 App");
        back(); // 可能需要多次 back 或直接 launchApp
        sleep(1000);
         // 确保返回
        waitFor(() => {
            app.launch(APP_PACKAGE_NAME);
            return isInSignPage()
        }, 3, 1000, "返回社区App");
    }
}


/**
 * 跳过启动广告
 */
function skipAd() {
    let closeButton = descMatches(/(关闭|跳过|Skip)/).findOne(1000) ||
                      idMatches(/.*(close|skip|cancel).*/).findOne(1000); // 尝试匹配常见ID

    if (safeClick(closeButton, "跳过广告")) {
        sleep(500);
    } else {
        // log("未检测到广告或无法跳过"); 
    }
}

/**
 * 链接可用测试
 * @param {Array} urllist - 需要测试的链接列表
 * @returns {string} 可用的链接，或 false
 */
function webTest(urllist) {
    log("开始测试链接");
    for (let j = 0; j < urllist.length; j++) {
        url = urllist[j];
        try {
            let url_res = http.get(url);
            if (url_res.statusCode == 200) {
                log("链接:"  + j + "可用");
                return url
            }
        } catch (e) {
            log("链接:"  + urllist[j] + " 连接失败");
        }
    }
    return false;
}

/**
 * 通过仓库中的配置文件检查脚本更新
 */
function checkScriptUpdate() {
        toastLog("正在检查脚本更新(配置文件)...");
        var urlList = [
            "https://github.moeyy.xyz/https://github.com/fgvsuiye/autojs6/blob/main/version.json",
            "https://gitee.com/kuandana/autojs6/raw/master/version.json"];
        //console.log("请求配置URL:", rawFileUrl);
        var rawFileUrl = webTest(urlList);
        if (!rawFileUrl) {
            console.error("检查更新失败：无法连接到配置文件仓库。");
            return;
        }
        try {
            var response = http.get(rawFileUrl, {
                // GitHub Raw 通常不需要特定 headers，但可以保留 Accept 以防万一
                // headers: {'Accept': 'text/plain'} // 或 application/json
            });
            if (response.statusCode == 200) {
                var configContent = response.body.string();
                //console.log("获取到配置文件内容:", configContent.substring(0, 100) + "..."); // 打印部分内容

                try {
                    var config = JSON.parse(configContent);
                    if (!config || !config.hasOwnProperty('latestVersion')) {
                        console.error("检查更新：配置文件格式错误或缺少 'latestVersion' 字段。");
                        toastLog("检查更新失败：配置文件无效");
                        return;
                    }

                    var latestVersion = config.latestVersion;
                    // 可选：获取更新链接和说明
                    var updateUrl = config.updateUrl || `https://github.com/fgvsuiye/autojs6/`; // 默认仓库地址
                    var releaseNotes = config.releaseNotes || "暂无更新说明。";
                    downloadList = config.downloadList || {}; // 下载地址列表
                    console.log("当前版本:", CURRENT_SCRIPT_VERSION);
                    console.log("最新版本:", latestVersion);

                    // 直接比较版本号 
                    if (isNewerCustomVersion(latestVersion, CURRENT_SCRIPT_VERSION) ) {
                        needUpdate = true;
                        toastLog("发现新版本！,将在脚本结束后自动下载");
                        updateList = config.updateList; // 下载地址列表
                        toastLog("本次更新文件：" + updateList);
                        //notifyUpdate(String(latestVersion), updateUrl, releaseNotes); // 统一转字符串给通知函数
                    } else {
                        console.log("当前已是最新版本。");
                        updateDate.put('updateDate', today)
                    }

                } catch (parseError) {
                    console.error("检查更新：解析配置文件 JSON 失败:", parseError);
                    toastLog("检查更新失败：无法解析版本信息");
                }

            } else if (response.statusCode == 404) {
                 console.warn(`检查更新：配置文件未找到 (404)。请确保路径正确: ${rawFileUrl}`);
                 toastLog("检查更新失败：找不到版本文件");
            } else if (response.statusCode == 403) {
                 console.error("检查更新：访问被禁止 (403)。可能是私有仓库或权限问题。");
                 toastLog("检查更新失败：无权访问版本文件");
            } else {
                console.error("检查更新失败：HTTP 状态码 " + response.statusCode);
                console.error("响应内容:", response.body.string().slice(0, 200));
            }
        } catch (error) {
            console.error("检查更新时发生网络或脚本异常:", error);
            // toastLog("检查更新时出错");
        }
}

/**
 * 比较自定义版本号（适用于数字、日期YYYYMMDD等可直接比较的类型）
 * @param {*} latestVersion - 从配置文件获取的新版本
 * @param {*} currentVersion - 脚本内置的当前版本
 * @returns {boolean} - 如果 latestVersion 比 currentVersion 新则返回 true
 */
function isNewerCustomVersion(latestVersion, currentVersion) {
    // 简单比较，假设类型一致且可直接用 > 比较
    // 注意：如果版本号是 "1.10.0" vs "1.9.0" 这种字符串，直接比较会出错 ('1.10.0' < '1.9.0')
    // 但对于纯数字 (20231225 > 20231224) 或纯数字日期字符串 ('20231225' > '20231224') 是有效的
    if (typeof latestVersion !== typeof currentVersion) {
        console.warn("版本号比较：类型不一致！Latest:", typeof latestVersion, "Current:", typeof currentVersion, ". 尝试转换比较...");
        // 尝试都转为字符串比较，或都转为数字比较（如果可能）
        try {
            return String(latestVersion) > String(currentVersion); // 或者 Number(latestVersion) > Number(currentVersion)
        } catch (e) {
            console.error("版本号比较失败:", e);
            return false; // 无法比较则认为没有更新
        }
    }
    // 类型相同时直接比较
    return latestVersion > currentVersion;
}

/**
 * 下载更新脚本
 * @param {string} 下载的文件名
 * @param {Array} 保存了下载文件的保存路径和链接的数组
 */
function updateScript(fileName, downloadinfo) {

    var updateUrl = downloadinfo.url;
    var ScriptPath = files.join(files.cwd(), downloadinfo.savePath);

    console.log("开始下载 " + fileName);
    //console.log("下载链接: " + updateUrl);
    console.log("保存路径: " + ScriptPath);
    // --- 下载更新文件 ---
    toastLog("开始下载更新...");
    try {
        var response = http.get(updateUrl, {
            timeout: 10000 // 毫秒
        });

        if (response.statusCode == 200) {
            // 确保目录存在
            files.ensureDir(ScriptPath);
            // 如果目标文件已存在，先备份
            let fullFileName = files.join(ScriptPath, fileName)
            if (files.exists(fullFileName)) {
                files.rename(fullFileName, fullFileName + ".bak");
                log("已备份原文件: " + fullFileName + ".bak");
            }
            // 写入文件
            files.writeBytes(ScriptPath, response.body.bytes());
            log("新版本已下载到: " + ScriptPath);

            // --- 验证下载文件 (简单示例：检查文件是否存在且非空) ---
            if (files.exists(ScriptPath)) {

                // --- 检查更新器脚本是否存在 ---
                var updaterScriptPath = files.cwd() + '/updater.js'
                if (fileName == "main.js" && files.exists(updaterScriptPath)) {

                    // --- 启动更新器脚本 ---
                    engines.execScriptFile(updaterScriptPath);
                    toastLog("准备更新main.js文件，主脚本即将退出...");
                    // !!! 立即退出，以便 updater.js 可以操作 main.js 文件 !!!
                    exit();
                }
            } else {
                var errorMsg = "下载的文件无效 (不存在或为空): "
                log(errorMsg);
            }
        } else {
            var errorMsg = "下载失败: 服务器返回状态码 " + response.statusCode;
            log(errorMsg);
            try { log("服务器信息: " + response.body.string().slice(0,200)); } catch(e){}
            toast(errorMsg);
        }

    } catch (error) {
        /* var errorMsg = "下载或处理更新时发生错误: " + error;
        log(errorMsg);
        toast(errorMsg);
        // 如果下载过程中出错，确保临时文件被删除 (如果已创建)
        if (files.exists(ScriptPath)) {
            files.remove(ScriptPath);
        } */
    }
}

/**
 * 发送更新通知 (适配 Auto.js v4.1.1)
 * @param {string} newVersion - 新版本号 (字符串形式)
 * @param {string} url - 点击通知后跳转的 URL
 * @param {string} notes - 更新日志
 */
function notifyUpdate(newVersion, url, notes) {
    var notificationId = 1001; // 给这个通知一个唯一的 ID
    var notificationTitle = "脚本更新提醒";
    var notificationText = `发现新版本 ${newVersion}！点击查看详情。`;
    var shortNotes = notes.split('\n')[0] || notes.substring(0, 50);
    if (shortNotes && shortNotes.length < notes.length) {
        shortNotes += "...";
    }
    var fullNotificationText = notificationText + "\n更新内容: " + shortNotes;

    try {
        // 1. 获取 NotificationManager 系统服务
        var nm = context.getSystemService(context.NOTIFICATION_SERVICE);

        // 2. (仅在 Android 8.0 及以上版本) 创建通知渠道
        // 最好在脚本启动时创建一次，但放在这里也能确保它存在
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            var channel = new android.app.NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                NOTIFICATION_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT // 设置通知重要性级别
            );
            // channel.setDescription("接收脚本版本更新提醒"); // 可选的渠道描述
            nm.createNotificationChannel(channel); // 创建渠道
        }

        // 3. 创建一个 Intent，用于在点击通知时打开 URL
        // 使用 Android 原生 Intent
        var intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        // 如果 app.intent 确实存在且能创建 VIEW Intent，也可以用：
        // var intent = app.intent({ action: "VIEW", data: url });

        // 4. 创建 PendingIntent，包装上面的 Intent
        var pendingIntentFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) { 
             pendingIntentFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        var pendingIntent = PendingIntent.getActivity(context, 0, intent, pendingIntentFlags);


        // 5. 使用 NotificationCompat.Builder 构建通知
        var builder = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
            // !!必须设置一个小图标!! 使用 Android 系统自带的图标
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            // 也可以尝试 Auto.js 的图标资源，但不保证路径固定不变
            // .setSmallIcon(org.autojs.autojs.R.drawable.autojs_material) // 不建议，可能随版本变化
            .setContentTitle(notificationTitle) // 设置通知标题
            .setContentText(fullNotificationText) // 设置通知主文本
            .setContentIntent(pendingIntent) // 设置点击通知时触发的 Intent
            .setAutoCancel(true) // 设置点击通知后自动清除通知
            .setDefaults(NotificationCompat.DEFAULT_ALL) // 使用系统默认的通知声音、震动等
            // 如果需要显示更长的文本，可以使用 BigTextStyle
            // .setStyle(new NotificationCompat.BigTextStyle().bigText(fullNotificationText + "\n\n" + notes));


        // 6. 发送通知
        nm.notify(notificationId, builder.build());

    } catch (error) {
        console.error("发送通知时出错:", error);
        log("堆栈跟踪:", error.stack); // 打印更详细的错误堆栈
        toastLog("发送通知失败，错误信息请查看日志。");
        // 提供备选信息给用户
        console.log("---- 更新信息 ----");
        console.log("新版本: " + newVersion);
        console.log("更新地址: " + url);
        console.log("更新内容: " + notes.substring(0, 100) + "...");
        console.log("---- 更新信息结束 ----");
    }
}

// ========================
// === 主程序逻辑 ===
// ========================
function main() {

    let initialMusicVolume = device.getMusicVolume();
    device.setMusicVolume(0); // 静音
    log("设备已静音");

    // 设置退出时恢复
    events.on("exit", function() {
        console.hide(); // 隐藏控制台
        device.setMusicVolume(initialMusicVolume);
        device.cancelKeepingAwake();
        log(`设备音量已恢复到 ${initialMusicVolume}`);
        log(`脚本运行总耗时: ${((new Date().getTime() - startTime) / 1000).toFixed(2)} 秒`);
        console.warn(">>>>>>>---| 脚本结束 |---<<<<<<<");
    });

    // 检查更新
    if (config.检查更新) {
        console.info(">>>>>>>---| 检查更新 |---<<<<<<<");
        let sto =updateDate.get('updateDate');
        // 是否为首次存储
        if(sto == null){
            console.log("首次存储");
            updateDate.put('updateDate', today)
        }
        // 是否大于更新间隔
        if(today - sto > config.更新间隔){
            checkScriptUpdate();
        }else{
            console.log("距离上次更新时间小于更新间隔，跳过更新检查");
            console.log("更新间隔小于0时，每次运行时都检查更新");
        }
    }

    try {
        // 1. 处理屏幕状态和解锁
        if (!ensureDeviceUnlocked(3)) { // 最多尝试3次
            log("无法解锁设备，脚本退出。");
            exit();
        }

        // 2. 重启应用并跳过广告
        restartApp(true);
        skipAd();
        if (config.浏览帖子) browsePosts(); // 帖子浏览

        // 3. 进入签到页面
        if (!waitFor(() => {
            let signBtn = desc('签到').findOne(DEFAULT_TIMEOUT);
            if (signBtn) {
                signBtn.click();
            }else{
                log("未找到签到按钮,尝试重启应用");
                restartApp(false); // 重启
            }
            return isInSignPage();
        },2,3000, "进入签到页面")) {
            log("多次尝试后仍无法进入签到页面，退出脚本");
            exit();
        }

        // 4. 执行签到
        let signedIn = performSign();
        // 如果签到失败，可以考虑是否继续执行其他任务
        
        // 5. 根据配置执行可选任务
        // if (config.加入圈子) joinCircleActivity(); // 
        if (config.小程序签到) miniAppSign();
        if (config.拔萝卜) carrotActivity();
        // if (config.米粉节) fansActivity(); // 
        if (config.观看视频) watchVideoTask();
        if (config.双旗舰) dualFlagshipActivity(); //
        if (config.感恩季) thanksgivingActivity(); // 
        if (isInSignPage() && config.成长值记录) {
             recordLevel();
        }
        log("所有配置的任务已执行完毕");
    } catch (e) {
        console.error(`主程序发生未捕获错误: ${e}`);
    } finally {
        // 6. 结束应用并返回主页 (可选)
        killApp(APP_PACKAGE_NAME);
        home();
        log("操作完成，已返回主页");
        // 7. 脚本更新
        sleep(1000); // 等待一秒，确保日志输出完整
        if (needUpdate && updateList.length > 0){
            console.info(">>>>>>>---| 更新脚本 |---<<<<<<<");
            for (var key in downloadList) {
               if (updateList.indexOf(key) >= 0) {
                   updateScript(key, downloadList[key]);
               }else {
                   //console.log("跳过 " + key);
               }
            } 
            console.log("所有脚本更新完成");
        }
        exit() 
    }
}