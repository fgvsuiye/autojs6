/**
 * UI 通用工具。
 * 所有日志自动继承当前任务标签。
 */
var logger = null;

/** 设置统一日志对象。 */
function setLogger(value) { logger = value; }

/** 点击坐标中心。 */
function center(obj) {
    try {
        if (!obj || typeof obj.bounds !== "function") return false;
        var b = obj.bounds();
        if (!b) return false;
        logger && logger.debug("点击坐标：(" + b.centerX() + ", " + b.centerY() + ")");
        return !!click(b.centerX(), b.centerY());
    } catch (e) {
        if (logger) logger.error("点击中心失败：" + e);
        return false;
    }
}

/** 点击控件；普通日志记录点击，调试日志记录控件信息及结果。 */
function clickObj(obj, msg) {
    if (!obj) {
        if (logger) logger.log("点击失败：未找到控件" + (msg ? "（" + msg + "）" : ""));
        return false;
    }
    try {
        logger && logger.log("准备点击" + (msg ? "：" + msg : ""));
        var ok = false;
        try { if (typeof obj.click === "function") ok = !!obj.click(); } catch (e) {
            logger && logger.debug("控件 click() 异常：" + e);
        }
        if (!ok) {
            logger && logger.debug("控件 click() 未成功，改用中心坐标点击");
            ok = center(obj);
        }
        logger && logger.log((ok ? "点击成功" : "点击失败") + (msg ? "：" + msg : ""));
        if (ok) {
            logger && logger.debug("点击完成，等待控件响应 500ms");
            sleep(500);
        }
        return ok;
    } catch (e) {
        if (logger) logger.error("点击异常：" + e);
        return false;
    }
}

/** 等待条件满足；普通日志记录开始、每轮等待和结果，调试日志记录轮次与耗时。 */
function wait(fn, times, gap, name) {
    times = Number(times);
    gap = Number(gap);
    if (typeof fn !== "function") return false;
    if (!isFinite(times) || times < 1) times = 1;
    if (!isFinite(gap) || gap < 0) gap = 0;

    var title = name || "条件";
    var begin = new Date().getTime();
    logger && logger.log("开始等待：" + title + "，最多 " + times + " 次");
    for (var i = 0; i < times; i++) {
        logger && logger.debug("等待第 " + (i + 1) + "/" + times + " 次检查：" + title);
        try {
            if (fn()) {
                logger && logger.log("等待完成：" + title + "，耗时 " + (new Date().getTime() - begin) + "ms");
                return true;
            }
        } catch (e) {
            if (logger) logger.error("等待异常（" + title + "）：" + e);
        }
        if (i < times - 1 && gap) {
            logger && logger.log("等待 " + gap + "ms 后重试：" + title);
            sleep(gap);
        }
    }
    if (logger) logger.warn("等待超时：" + title + "，耗时 " + (new Date().getTime() - begin) + "ms");
    return false;
}

/** 记录并等待指定时间。 */
function delay(ms, reason) {
    ms = Number(ms);
    if (!isFinite(ms) || ms < 0) return;
    if (logger) logger.log("等待 " + ms + "ms" + (reason ? "：" + reason : ""));
    try {
        sleep(ms);
    } catch (e) {
        try {
            java.lang.Thread.sleep(ms);
        } catch (eThread) {}
    }
}

module.exports = { setLogger: setLogger, center: center, click: clickObj, wait: wait, sleep: delay };
