var cap = require("../services/captchaProvider.js");

/** 校验并解析验证码平台返回的坐标字符串。 */
function points(s) {
    ctx.log.debug("解析验证码")
    if (typeof s !== "string") return null;
    var list = s.split("|").map(function (v) { return v.trim(); }).filter(function (v) { return !!v; });
    for (var i = 0; i < list.length; i++) {
        var p = list[i].split(",");
        if (p.length < 2 || !isFinite(Number(p[0])) || !isFinite(Number(p[1]))) return null;
    }
    ctx.log.debug("解析结果：" + list)
    return list.length ? list : null;
}

/** 截取验证码区域并保存到配置的图片路径。 */
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
        var top = textContains("请在下图依次").findOne(sys.wait);
        top = top && top.parent();
        top = top && top.parent();
        ctx.log.log("查找验证码确认按钮");
        var bottom = desc(ui.capOk).findOne(sys.wait);
        if (!top || !bottom) return false;

        var a = top.bounds();
        var b = bottom.bounds();
        var x = a.left;
        var y = a.top;
        var cw = b.right - x;
        var ch = b.top - y;
        if (cw <= 0 || ch <= 0 || x < 0 || y < 0 || x + cw > w || y + ch > h) return false;

        ctx.state.cx = x;
        ctx.state.cy = y;
        ctx.log.log("准备截图，隐藏控制台");
        console.hide();
        ctx.u.sleep(300);
        ctx.log.log("执行截图");
        screen = captureScreen();
        if (!screen) return false;
        img = images.clip(screen, x, y, cw, ch);
        if (!img) return false;
       // var dir = files.dirname(path);
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
        try { console.show(); } catch (e3) {}
    }
}

/** 刷新验证码并等待新验证码出现。 */
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

/** 将识别出的验证码坐标转换成屏幕坐标并依次点击。 */
function clicks(ctx, list) {
    if (!Array.isArray(list) || !list.length) return false;
    var sys = ctx.sys;
    var ui = ctx.ui;
    var x0 = ctx.state.cx;
    var y0 = ctx.state.cy;

    for (var i = 0; i < list.length; i++) {
        var p = list[i].split(",");
        var x = Math.round(Number(p[0]) + x0);
        var y = Math.round(Number(p[1]) + y0);
        if (x < 0 || x > ctx.w || y < 0 || y > ctx.h) return false;
            ctx.log.log("点击验证码坐标：(" + x + ", " + y + ")");
        if (!click(x, y)) return false;
        ctx.u.sleep(random(500, 800));
    }

    ctx.log.log("等待验证码确认按钮");
    var ok = desc(ui.capOk).findOne(sys.wait) || text(ui.capOk).findOne(sys.short);
    return ctx.u.click(ok, "点击确认");
}

/** 调用验证码服务商适配器获取识别结果。 */
function solve(ctx) {
    try {
        ctx.log.log("开始调用验证码 API");
        ctx.log.debug("验证码图片路径：" + ctx.sys.pic);
        var res = cap.solve(ctx.sys.pic, { config: ctx.cfg, timeout: ctx.sys.wait, log: ctx.log });
        if (typeof res !== "string") {
            ctx.log.error("验证码结果返回异常")
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

/** 执行签到任务，包括验证码截图、识别、点击和成功校验。 */
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
        ctx.log.log("申请截图权限");
        if (!requestScreenCapture()) { ctx.log.error("截图权限申请失败"); return false; }

        for (var i = 0; i < sys.signRetry; i++) {
            ctx.log.log("开始第 " + (i + 1) + " 次签到尝试");
            if (!shot(ctx)) { fresh(ctx, "截图失败"); continue; }
            var res = solve(ctx);
            var pts = points(res);
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
    }
}

module.exports = { name: "社区签到", tag: "社区签到", key: "签到", run: run };
