/**
 * 运行时工具
 *
 * 作用：提供日期和总时长限制等与具体任务无关的功能。
 */

require("./compat.js");

/** 返回 YYYY-MM-DD 格式日期。 */
function date(d) {
    var y = d.getFullYear();
    var monthNum = d.getMonth() + 1;
    var dayNum = d.getDate();
    var m = (monthNum < 10 ? "0" : "") + monthNum;
    var day = (dayNum < 10 ? "0" : "") + dayNum;
    return y + "-" + m + "-" + day;
}

/** 开启总运行时间监控，超时后退出脚本。 */
function timer(ms, logger) {
    ms = Number(ms);
    if (!isFinite(ms) || ms <= 0) return;
    if (logger) logger.log("运行限时监控守护线程已启动，最长允许运行：" + (ms / 1000) + " 秒");
    threads.start(function () {
        try {
            sleep(ms);
            if (logger) {
                logger.setTag(logger.tags.main);
                logger.error("【关键中断】脚本运行已达到设定总时长限制 (" + (ms / 1000) + " 秒)，强制终止退出！如需延长请在 config/config.js 中调大【运行.总时长】");
                logger.diag("运行超时中断");
            }
            exit();
        } catch (e) {}
    });
}

module.exports = { date: date, timer: timer };
