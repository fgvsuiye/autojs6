/**
 * 统一日志模块
 *
 * 功能：
 * 1. 控制台与文件双重输出，日志实时持久化至 ./tmp/app.log，防止脚本意外中断时丢失信息。
 * 2. 详细时间戳（毫秒级）与标签体系。
 * 3. 错误堆栈抓取与屏幕状态诊断（前台包名、Activity）。
 *
 * 日志等级：
 * 0 = 精简：任务启动、结果、警告和错误。
 * 1 = 普通：精简 + 关键步骤（点击、查找、等待等）。
 * 2 = 调试：普通 + 控件信息、坐标、耗时、重试次数等。
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

/** 补零函数 */
function pad(num, len) {
    var str = String(num);
    while (str.length < len) str = "0" + str;
    return str;
}

/** 获取精确格式化时间：YYYY-MM-DD HH:mm:ss.SSS */
function nowTime() {
    var d = new Date();
    var y = d.getFullYear();
    var m = pad(d.getMonth() + 1, 2);
    var day = pad(d.getDate(), 2);
    var h = pad(d.getHours(), 2);
    var min = pad(d.getMinutes(), 2);
    var s = pad(d.getSeconds(), 2);
    var ms = pad(d.getMilliseconds(), 3);
    return y + "-" + m + "-" + day + " " + h + ":" + min + ":" + s + "." + ms;
}

/** 创建统一日志对象。 */
function create(level, logFile) {
    level = Number(level);
    if (!isFinite(level)) level = 1;
    level = Math.max(0, Math.min(2, Math.floor(level)));
    var currentTag = TAG.main;
    var filePath = logFile || "./tmp/app.log";

    // 确保日志目录存在
    try {
        if (typeof files !== "undefined" && files.ensureDir) {
            files.ensureDir(filePath);
        }
    } catch (eDir) {}

    /** 写入文件日志 */
    function writeToFile(line) {
        try {
            if (typeof files !== "undefined" && files.append) {
                files.append(filePath, line + "\n");
            }
        } catch (eWrite) {}
    }

    var consoleEnabled = true;

    /** 格式化单行消息 */
    function format(type, msg) {
        var timeStr = nowTime();
        var tagStr = "[" + currentTag + "]";
        return timeStr + " [" + type + "] " + tagStr + " " + String(msg === undefined ? "" : msg);
    }

    /** 控制台与文件统一输出 */
    function output(type, msg, toConsole) {
        var full = format(type, msg);
        writeToFile(full);
        if (consoleEnabled && toConsole && typeof console !== "undefined") {
            try {
                if (type === "ERROR") console.error(full);
                else if (type === "WARN") console.warn(full);
                else if (type === "INFO") console.info(full);
                else console.log(full);
            } catch (eConsole) {}
        }
    }

    return {
        level: level,
        tags: TAG,
        getLogFile: function () { return filePath; },
        setTag: function (tag) { currentTag = tag || TAG.main; },
        getTag: function () { return currentTag; },
        setConsoleEnabled: function (val) { consoleEnabled = !!val; },

        info: function (msg) {
            output("INFO", msg, level >= 0);
        },
        log: function (msg) {
            output("LOG", msg, level >= 1);
        },
        warn: function (msg) {
            output("WARN", msg, true);
        },
        debug: function (msg) {
            output("DEBUG", msg, level >= 2);
        },
        error: function (msg, err) {
            var detail = String(msg || "");
            if (err) {
                if (err.stack) {
                    detail += "\n异常堆栈:\n" + err.stack;
                } else if (err.message) {
                    detail += " (原因: " + err.message + ")";
                } else {
                    detail += " (异常: " + String(err) + ")";
                }
            }
            output("ERROR", detail, true);
        },

        /** 输出当前屏幕与系统诊断信息，帮助定位中断原因 */
        diag: function (reason) {
            var lines = [];
            lines.push("--- 系统诊断信息 [" + (reason || "检测点") + "] ---");
            try {
                if (typeof currentPackage === "function") {
                    lines.push("前台包名: " + currentPackage());
                }
            } catch (e1) {}
            try {
                if (typeof currentActivity === "function") {
                    lines.push("前台页面: " + currentActivity());
                }
            } catch (e2) {}
            try {
                if (typeof device !== "undefined") {
                    lines.push("屏幕点亮: " + (device.isScreenOn ? device.isScreenOn() : "未知"));
                }
            } catch (e3) {}
            lines.push("---------------------------------------");
            output("WARN", lines.join("\n"), true);
        }
    };
}

module.exports = { create: create, TAG: TAG };
