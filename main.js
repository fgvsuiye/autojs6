require("./utils/compat.js");
try {
    if (typeof engines !== "undefined" && engines.myEngine && engines.all) {
        var curEngine = engines.myEngine();
        var allEngines = engines.all();
        for (var engIdx = 0; engIdx < allEngines.length; engIdx++) {
            var eng = allEngines[engIdx];
            if (eng && eng.id !== curEngine.id && String(eng.getSource()) === String(curEngine.getSource())) {
                eng.forceStop();
            }
        }
    }
} catch (eEng) {}

try {
    console.info("正在检查无障碍服务状态...");
    auto.waitFor();
    console.info("无障碍服务已就绪");
} catch (eAuto) {}

var sys = {
    pkg: "com.xiaomi.vipaccount",
    pic: "./tmp/pic.png",
    logFile: "./tmp/app.log",
    short: 2000,
    wait: 5000,
    signRetry: 3,
    unlockRetry: 3,
    swipe: 200,
    keep: 180000
};

var uiTexts = {
    sign: "签到",
    signed: "已签到",
    signNow: "立即签到",
    capRefresh: "刷新验证",
    capOk: "确认",
    feature1: "社区勋章",
    feature2: "社区成长等级"
};

var cfg = require("./config/index.js");
var u = require("./utils/ui.js");
var dev = require("./utils/device.js");
var rt = require("./utils/runtime.js");
var logger = require("./utils/logger.js");
var ps = require("./services/pushService.js");
var tasks = require("./tasks/index.js");

var w = device.width;
var h = device.height;
var today = rt.date(new Date());
var start = new Date().getTime();
var state = { cx: 0, cy: 0, push: "" };
logger.checkLogSize(sys.logFile);
var log = logger.create(cfg.运行.日志等级, sys.logFile);
log.setTag(logger.TAG.main);
u.setLogger(log);

var ctx = {
    sys: sys,
    ui: uiTexts,
    cfg: cfg,
    w: w,
    h: h,
    today: today,
    state: state,
    u: u,
    isSign: isSign,
    log: log
};

function isSign() {
    u.sleep(sys.short, "等待页面稳定");
    return textContains(uiTexts.feature1).exists() && textContains(uiTexts.feature2).exists();
}

function validCfg() {
    if (!cfg || typeof cfg !== "object") {
        log.error("配置校验失败：config 未能正确加载");
        return false;
    }
    if (!cfg.解锁 || !cfg.任务 || !cfg.运行 || !cfg.验证码) {
        log.error("配置校验失败：缺少关键配置节（解锁/任务/运行/验证码）");
        return false;
    }
    if (cfg.解锁.方式 == 1 && (!Array.isArray(cfg.解锁.图案) || !cfg.解锁.图案.length)) {
        log.error("配置校验失败：解锁方式为图案解锁，但图案坐标列表为空");
        return false;
    }
    if (cfg.解锁.方式 == 2 && (cfg.解锁.密码 === undefined || cfg.解锁.密码 === null || String(cfg.解锁.密码).trim() === "")) {
        log.error("配置校验失败：解锁方式为密码解锁，但未填写数字密码");
        return false;
    }
    return true;
}

function runTask(task) {
    if (!task || typeof task.run !== "function") return true;
    var tag = task.tag || logger.TAG.main;
    var taskName = task.name || tag;
    log.setTag(tag);
    log.info("任务启动: " + taskName);
    var tStart = new Date().getTime();
    try {
        var ok = task.run(ctx) !== false;
        var cost = ((new Date().getTime() - tStart) / 1000).toFixed(1);
        log.info("任务结果：" + (ok ? "成功" : "失败") + " (耗时 " + cost + "s)");
        return ok;
    } catch (e) {
        log.error("任务执行异常：" + taskName, e);
        log.diag("任务异常中断点: " + taskName);
        return false;
    }
}

function init() {
    try { console.hide(); } catch (eConsole) {}
    log.info("========================================");
    log.info("小米社区自动化脚本启动");
    log.info("日志实时保存路径: " + files.path(sys.logFile));
    log.log("运行日期: " + today);
    log.log("设备分辨率: " + w + "x" + h);
    if (typeof setScaleBases === "function") {
        setScaleBases(1080, 2400);
    }
    rt.timer(Number(cfg.运行.总时长) * 1000, log);
    device.setMusicVolume(0);
    }

function preparecapCapture(){
    try {
        log.info("申请全局截图权限...");
        if (!requestScreenCapture()) {
            log.error("全局截图权限申请失败");
        } else {
            log.info("全局截图权限已就绪");
        }
    } catch (eCap) {
        log.error("申请截图权限异常: " + eCap);
    }
}

function cleanup(oldVol) {
    events.on("exit", function () {
        try { device.setMusicVolume(oldVol); } catch (e2) {}
        try { device.cancelKeepingAwake(); } catch (e3) {}
        var cost = ((new Date().getTime() - start) / 1000).toFixed(2);
        log.info("脚本生命周期结束，累计运行 " + cost + " 秒");
        log.info("详细日志已保存至: " + files.path(sys.logFile));
        try {
            sleep(3000);
            console.hide();
        } catch (e1) {}
    });
}

function main() {
    var oldVol = device.getMusicVolume();
    cleanup(oldVol);

    if (!validCfg()) {
        log.error("【主流程中断】关键配置无效，退出");
        log.diag("配置校验失败中断");
        exit();
        return;
    }

    init();

    try {
        log.info("--- 开始执行解锁流程 ---");
        if (!dev.unlock(ctx, sys.unlockRetry)) {
            log.error("【主流程中断】设备未能解锁成功，终止后续任务！");
            log.diag("解锁流程中断点");
            return;
        }

        log.setTag(logger.TAG.main);
        preparecapCapture()
        log.info("--- 启动并准备小米社区 ---");
        dev.restart(ctx, true);
        dev.skipAd(ctx);

        log.setTag(logger.TAG.main);
        var ts = tasks.get(cfg);

        if (ts.pre && ts.pre.length) {
            log.info("--- 开始执行预任务 (共 " + ts.pre.length + " 个) ---");
            for (var p = 0; p < ts.pre.length; p++) {
                runTask(ts.pre[p]);
            }
        }

        log.setTag(logger.TAG.main);
        u.sleep(1500, "等待页面平稳过渡");
        log.info("--- 准备进入签到中心页面 ---");
        var enterOk = u.wait(function () {
            var btn = desc(uiTexts.sign).findOne(sys.wait);
            if (btn) {
                u.click(btn, "进入签到页面");
            } else {
                log.log("未在首页发现【" + uiTexts.sign + "】入口，尝试唤起社区...");
                dev.restart(ctx, false);
            }
            return isSign();
        }, 3, 3000, "进入签到页");

        if (!enterOk) {
            log.error("【主流程中断】多次尝试未能成功进入签到中心页面，终止执行！");
            log.diag("进入签到页失败中断点");
            return;
        }

        if (ts.list && ts.list.length) {
            log.info("--- 开始执行主任务列表 (共 " + ts.list.length + " 个) ---");
            for (var i = 0; i < ts.list.length; i++) {
                runTask(ts.list[i]);
            }
        }

        log.setTag(logger.TAG.push);
        log.info("任务启动: 推送通知");
        var pushOk = ps.send(ctx);
        log.info("任务结果：" + (pushOk ? "成功" : "失败"));
    } catch (e) {
        log.setTag(logger.TAG.main);
        log.error("【致命异常中断】主流程捕获到未处理异常:", e);
        log.diag("未捕获异常中断点");
    } finally {
        log.setTag(logger.TAG.main);
        log.info("正在执行收尾清理工作...");
        try { dev.kill(ctx); } catch (eKill) {}
        try { home(); } catch (eHome) {}
        log.info("所有流程已执行完毕");
        exit();
    }
}

main();