/**
 * 统一日志模块。
 *
 * 日志等级：
 * 0 = 精简：任务启动、任务结果、错误。
 * 1 = 普通：精简 + 每一步主要操作（点击、查找、等待、截图等）。
 * 2 = 调试：普通 + 控件、坐标、耗时、返回值、循环次数等诊断信息。
 */

var TAG = {
    main: "主程序",
    unlock: "解锁",
    browse: "浏览帖子",
    miniSign: "程序签到",
    sign: "社区签到",
    carrot: "萝卜活动",
    level: "积分记录",
    push: "推送微信"
};

/** 创建统一日志对象。 */
function create(level) {
    level = Number(level);
    if (!isFinite(level)) level = 1;
    level = Math.max(0, Math.min(2, Math.floor(level)));
    var current = TAG.main;

    function fmt(msg) {
        return "[" + current + "] " + String(msg === undefined ? "" : msg);
    }

    return {
        level: level,
        tags: TAG,
        setTag: function (tag) { current = tag || TAG.main; },
        getTag: function () { return current; },
        info: function (msg) {
            if (level >= 0) console.info(fmt(msg));
        },
        log: function (msg) {
            if (level >= 1) console.log(fmt(msg));
        },
        debug: function (msg) {
            if (level >= 2) console.warn(fmt(msg));
        },
        error: function (msg) {
            console.error(fmt("错误：" + msg));
        }
    };
}

module.exports = { create: create, TAG: TAG };
