/**
 * 小米社区自动任务主程序
 *
 * 作用：只负责初始化、启动任务、收尾，不处理具体任务细节。
 * 使用：修改 config/config.js 控制任务开关和运行参数。
 */
var sys = {
    pkg: "com.xiaomi.vipaccount",
    pic: "./tmp/pic.png",
    short: 2000,
    wait: 5000,
    signRetry: 3,
    unlockRetry: 3,
    swipe: 200,
    keep: 180000
};

var ui = {
    sign: "签到",
    signed: "已签到",
    signNow: "立即签到",
    capRefresh: "刷新验证",
    capOk: "确认",
    feature1: "社区勋章",
    feature2: "社区成长等级"
};

// 配置、工具和服务
var cfg = require("./config/config.js");
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
var log = logger.create(cfg.运行.日志等级);
log.setTag(logger.TAG.main);
u.setLogger(log);

var ctx = {
    sys: sys,
    ui: ui,
    cfg: cfg,
    w: w,
    h: h,
    today: today,
    state: state,
    u: u,
    isSign: isSign,
    log: log
};

/** 判断当前页面是否为签到相关页面。 */
function isSign() {
    u.sleep(sys.short, "等待页面稳定");
    return textContains(ui.feature1).exists() && textContains(ui.feature2).exists();
}

/** 检查关键配置，避免明显错误导致脚本进入任务后才失败。 */
function validCfg() {
    if (!cfg || typeof cfg !== "object") return false;
    if (!cfg.解锁 || !cfg.任务 || !cfg.运行 || !cfg.验证码) return false;
    if (cfg.解锁.方式 == 1 && (!Array.isArray(cfg.解锁.图案) || !cfg.解锁.图案.length)) return false;
    if (cfg.解锁.方式 == 2 && (cfg.解锁.密码 === undefined || cfg.解锁.密码 === null)) return false;
    return true;
}

/** 执行一个任务，并统一输出任务启动与结果日志。
 * @param {Object} task 任务对象。
 * @returns {boolean} 是否执行成功。
 */
function runTask(task) {
    if (!task || typeof task.run !== "function") return true;
    var tag = task.tag || logger.TAG.main;
    log.setTag(tag);
    log.info("任务启动");
    try {
        var ok = task.run(ctx) !== false;
        log.info("任务结果：" + (ok ? "成功" : "失败"));
        return ok;
    } catch (e) {
        log.error("任务异常：" + e);
        return false;
    }
}

/** 初始化控制台、屏幕常亮、静音和总运行时间限制。 */
function init() {
    console.setSize(w, h * .25);
    console.setPosition(0, 0);
    console.show();
    log.info("脚本启动");
    log.log("今天是：" + today);
    log.log("设备分辨率：" + w + "x" + h);
    setScaleBases(1080, 2400);
    device.keepScreenOn(sys.keep);
    rt.timer(Number(cfg.运行.总时长) * 1000, log);
    device.setMusicVolume(0);
}

/** 注册退出清理动作，恢复音量并释放常亮状态。 */
function cleanup(oldVol) {
    events.on("exit", function () {
        try { console.hide(); } catch (e1) {}
        try { device.setMusicVolume(oldVol); } catch (e2) {}
        try { device.cancelKeepingAwake(); } catch (e3) {}
        log.info("脚本结束，运行 " + ((new Date().getTime() - start) / 1000).toFixed(2) + " 秒");
    });
}

/** 主流程：启动社区、执行任务、推送结果并退出。 */
function main() {
    var oldVol = device.getMusicVolume();
    cleanup(oldVol);

    if (!validCfg()) {
        log.error("关键配置无效，退出");
        exit();
        return;
    }

    init();

    try {
        if (!dev.unlock(ctx, sys.unlockRetry)) return;
        log.setTag(logger.TAG.main);
        dev.restart(ctx, true);
        dev.skipAd(ctx);

        log.setTag(logger.TAG.main);
        var ts = tasks.get(cfg);
        for (var p = 0; p < ts.pre.length; p++) runTask(ts.pre[p]);

        log.setTag(logger.TAG.main);
        if (!u.wait(function () {
            var btn = desc(ui.sign).findOne(sys.wait);
            if (btn) u.click(btn, "进入签到页面");
            else dev.restart(ctx, false);
            return isSign();
        }, 2, 3000, "进入签到页")) return;

        for (var i = 0; i < ts.list.length; i++) runTask(ts.list[i]);
        log.setTag(logger.TAG.push);
        log.info("任务启动");
        var pushOk = ps.send(ctx);
        log.info("任务结果：" + (pushOk ? "成功" : "失败"));
    } catch (e) {
        log.setTag(logger.TAG.main);
        log.error("主流程异常：" + e);
    } finally {
        log.setTag(logger.TAG.main);
        dev.kill(ctx);
        home();
        exit();
    }
}

main();
