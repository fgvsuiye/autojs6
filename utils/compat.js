/**
 * Auto.js 7 / AutoX.js 兼容层
 *
 * 作用：为 Auto.js 7 / Rhino 引擎补充缺失的 ES 特性及 AutoJs6 特有方法，
 * 确保脚本在 Auto.js 7、AutoX.js、AutoJs6 等多种环境下均可正常运行。
 */

// 1. String.prototype.padStart 垫片
if (!String.prototype.padStart) {
    String.prototype.padStart = function (targetLength, padString) {
        targetLength = targetLength >> 0;
        padString = String(padString !== undefined ? padString : " ");
        if (this.length > targetLength) return String(this);
        targetLength = targetLength - this.length;
        if (targetLength > padString.length) {
            padString += padString.repeat(targetLength / padString.length);
        }
        return padString.slice(0, targetLength) + String(this);
    };
}

// 2. String.prototype.padEnd 垫片
if (!String.prototype.padEnd) {
    String.prototype.padEnd = function (targetLength, padString) {
        targetLength = targetLength >> 0;
        padString = String(padString !== undefined ? padString : " ");
        if (this.length > targetLength) return String(this);
        targetLength = targetLength - this.length;
        if (targetLength > padString.length) {
            padString += padString.repeat(targetLength / padString.length);
        }
        return String(this) + padString.slice(0, targetLength);
    };
}

// 3. String.prototype.repeat 垫片 (防止某些极老 Rhino 环境缺少 repeat)
if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
        count = count >> 0;
        if (count < 0 || count === Infinity) throw new RangeError("Invalid count value");
        var str = "" + this;
        var rpt = "";
        while (count > 0) {
            if (count & 1) rpt += str;
            count >>>= 1;
            str += str;
        }
        return rpt;
    };
}

// 4. setScaleBases 兼容（保持屏幕坐标 1:1，防止全局坐标缩放干扰实际设备像素）
if (typeof global.setScaleBases !== "function") {
    global.setScaleBases = function (w, h) {};
}

// 5. cX / cY 坐标转换函数兼容
if (typeof global.cX !== "function") {
    global.cX = function (x) {
        var devW = (typeof device !== "undefined" && device.width) ? device.width : 1080;
        return Math.round((Number(x) / 1080) * devW);
    };
}
if (typeof global.cY !== "function") {
    global.cY = function (y) {
        var devH = (typeof device !== "undefined" && device.height) ? device.height : 2400;
        return Math.round((Number(y) / 2400) * devH);
    };
}

// 6. contentMatches 兼容垫片
if (typeof global.contentMatches !== "function") {
    global.contentMatches = function (reg) {
        return descMatches(reg);
    };
}
if (typeof global.content !== "function") {
    global.content = function (str) {
        return desc(str);
    };
}

// 7. textMatch 别名兼容
if (typeof global.textMatch !== "function") {
    global.textMatch = function (reg) {
        return textMatches(reg);
    };
}

// 8. ui.isUiThread 保护（防止 AutoX 在 __globals__.js 中调用 sleep 时因 ui 缺失或被篡改而抛出异常）
if (typeof global.ui === "undefined" || !global.ui) {
    global.ui = {};
}
if (typeof global.ui.isUiThread !== "function") {
    global.ui.isUiThread = function () {
        try {
            return android.os.Looper.myLooper() === android.os.Looper.getMainLooper();
        } catch (e) {
            return false;
        }
    };
}

// 9. 安全 sleep 函数（在 sleep 抛异常时降级使用 java.lang.Thread.sleep，杜绝线程崩溃）
var rawSleep = (typeof global.sleep === "function") ? global.sleep : null;
global.safeSleep = function (ms) {
    ms = Number(ms) || 0;
    if (ms <= 0) return;
    try {
        if (rawSleep) {
            rawSleep(ms);
            return;
        }
    } catch (eSleep) {}
    try {
        java.lang.Thread.sleep(ms);
    } catch (eThread) {}
};
global.sleep = global.safeSleep;

module.exports = true;
