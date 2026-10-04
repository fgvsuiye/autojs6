/**
 * 运行时工具
 *
 * 作用：提供日期和总时长限制等与具体任务无关的功能。
 */

/** 返回 YYYY-MM-DD 格式日期。 */
function date(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
}

/** 开启总运行时间监控，超时后退出脚本。 */
function timer(ms, logger) {
    ms = Number(ms);
    if (!isFinite(ms) || ms <= 0) return;
    threads.start(function () {
        try {
            sleep(ms);
            if (logger) logger.setTag(logger.tags.main);
            logger.error("脚本达到总运行时间限制，退出。");
            exit();
        } catch (e) {}
    });
}

module.exports = { date: date, timer: timer };
