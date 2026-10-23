var cap = require("../services/captchaProvider.js");

function points(s, ctx) {
    if (ctx && ctx.log) ctx.log.debug("解析验证码");
    if (typeof s !== "string") return null;
    var list = s.split("|").map(function (v) { return v.trim(); }).filter(function (v) { return !!v; });
    for (var i = 0; i < list.length; i++) {
        var p = list[i].split(",");
        if (p.length < 2 || !isFinite(Number(p[0])) || !isFinite(Number(p[1]))) return null;
    }
    if (ctx && ctx.log) ctx.log.debug("解析结果：" + list);
    return list.length ? list : null;
}

function shot(ctx) {
    var sys = ctx.sys;
    var ui = ctx.ui;
    var w = ctx.w;
    var h = ctx.h;
    var path = sys.pic;
    var screen = null;
    var img = null;

    try {
        ctx.log.log("等待验证码区域加载");
        ctx.u.sleep(2000, "等待验证码界面");
        var top = textContains("请在下图依次").findOne(sys.wait) || descContains("请在下图依次").findOne(sys.wait);
        if (!top) {
            ctx.log.error("未找到验证码顶部文字【请在下图依次】");
            return false;
        }
        if (top.parent()) top = top.parent();
        if (top.parent()) top = top.parent();

        ctx.log.log("查找验证码确认按钮");
        var bottom = descMatches(/(确认|确定)/).findOne(sys.wait) || textMatches(/(确认|确定)/).findOne(sys.wait);
        if (!bottom) {
            ctx.log.error("未找到验证码底部确认按钮");
            return false;
        }

        var a = top.bounds();
        var b = bottom.bounds();
        var x = Math.max(0, a.left);
        var y = Math.max(0, a.top);
        var cw = Math.min(w - x, b.right - x);
        var ch = Math.min(h - y, b.top - y);
        if (cw <= 0 || ch <= 0) {
            ctx.log.error("验证码区域尺寸计算异常: cw=" + cw + ", ch=" + ch);
            return false;
        }

        ctx.state.cx = x;
        ctx.state.cy = y;
        ctx.log.log("准备截图，隐藏控制台");
        if (ctx.log && ctx.log.setConsoleEnabled) ctx.log.setConsoleEnabled(false);
        try { console.hide(); } catch (eH) {}
        ctx.u.sleep(1000, "等待界面无遮挡稳定");
        screen = captureScreen();
        if (!screen) {
            ctx.log.error("captureScreen() 截图失败，未能截取屏幕");
            return false;
        }
        img = images.clip(screen, x, y, cw, ch);
        if (!img) {
            ctx.log.error("images.clip 裁剪图片失败");
            return false;
        }
        files.ensureDir(path);
        images.save(img, path, "jpg", 90);
        ctx.log.log("验证码截图已保存：" + path);
        ctx.log.debug("验证码区域：x=" + x + ", y=" + y + ", w=" + cw + ", h=" + ch);
        return true;
    } catch (e) {
        ctx.log.error("验证码截图异常：" + e);
        return false;
    } finally {
        try { if (img) img.recycle(); } catch (e1) {}
        try { if (screen) screen.recycle(); } catch (e2) {}
    }
}

function fresh(ctx, reason) {
    if (reason) ctx.log.log(reason);
    ctx.log.debug("准备刷新验证码，原因：" + (reason || "未说明"));
    var sys = ctx.sys;
    var ui = ctx.ui;
    var btn = text(ui.capRefresh).findOne(sys.short) || desc(ui.capRefresh).findOne(sys.short);
    if (!btn) { ctx.log.log("未找到刷新验证码按钮"); return false; }
    if (!ctx.u.click(btn, "刷新验证码")) return false;
    ctx.u.sleep(1500);
    return true;
}

function clicks(ctx, list) {
    if (!Array.isArray(list) || !list.length) return false;
    var sys = ctx.sys;
    var ui = ctx.ui;
    var x0 = ctx.state.cx;
    var y0 = ctx.state.cy;

    ctx.u.sleep(600, "准备点击验证码");

    for (var i = 0; i < list.length; i++) {
        var p = list[i].split(",");
        var x = Math.round(Number(p[0]) + x0 + random(-2, 2));
        var y = Math.round(Number(p[1]) + y0 + random(-2, 2));
        if (x < 0 || x > ctx.w || y < 0 || y > ctx.h) return false;
        ctx.log.log("点击第 " + (i + 1) + "/" + list.length + " 个验证码坐标：(" + x + ", " + y + ")");

        var dur = random(80, 120);
        try {
            if (typeof press === "function") {
                press(x, y, dur);
            } else {
                click(x, y);
            }
        } catch (eP) {
            click(x, y);
        }

        ctx.u.sleep(random(1100, 1400), "等待验证码响应");
    }

    ctx.u.sleep(800, "等待确认按钮就绪");
    ctx.log.log("等待验证码确认按钮");
    var ok = descMatches(/(确认|确定)/).findOne(sys.wait) || textMatches(/(确认|确定)/).findOne(sys.short);
    var okClicked = ctx.u.click(ok, "点击确认");
    return okClicked;
}

function solve(ctx) {
    try {
        ctx.log.log("开始调用验证码 API");
        ctx.log.debug("验证码图片路径：" + ctx.sys.pic);
        var res = cap.solve(ctx.sys.pic, { config: ctx.cfg, timeout: ctx.sys.wait, log: ctx.log });
        if (typeof res !== "string") {
            ctx.log.error("验证码结果返回异常");
            return null;
        }
        res = res.trim();
        ctx.log.debug("验证码 API 原始结果：" + res);
        return res || null;
    } catch (e) {
        ctx.log.error("验证码服务异常：" + e);
        return null;
    }
}

function run(ctx) {
    var sys = ctx.sys;
    var ui = ctx.ui;
    try {
        var done = textContains(ui.signed).findOne(sys.short);
        if (done) {
            ctx.log.info("今日已签到");
            return true;
        }

        var btn = text(ui.signNow).findOne(sys.wait);
        if (!ctx.u.click(btn, "点击立即签到")) return false;
        ctx.u.sleep(1000);

        for (var i = 0; i < sys.signRetry; i++) {
            ctx.log.log("开始第 " + (i + 1) + " 次签到尝试");
            if (!shot(ctx)) { fresh(ctx, "截图失败"); continue; }
            var res = solve(ctx);
            var pts = points(res, ctx);
            if (!pts) { fresh(ctx, "验证码识别结果无效"); continue; }
            if (!clicks(ctx, pts)) { fresh(ctx, "验证码点击失败"); continue; }
            if (ctx.u.wait(function () {
                return !!textContains(ui.signed).findOne(sys.wait);
            }, 2, 1000, "等待签到成功")) return true;
            fresh(ctx, "提交后未检测到签到成功");
        }
        return false;
    } catch (e) {
        ctx.log.error("签到任务异常：" + e);
        return false;
    } finally {
        if (ctx.log && ctx.log.setConsoleEnabled) ctx.log.setConsoleEnabled(true);
    }
}

module.exports = { name: "社区签到", tag: "社区签到", key: "签到", run: run };
