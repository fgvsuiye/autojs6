/** 执行微信小程序签到，并返回小米社区。 */
function run(ctx) {
    var ok = false;
    try {
        ctx.log.log("查找微信小程序入口");
        var btn = className("android.widget.Button").desc("去微信").findOne(ctx.sys.wait);
        if (!ctx.u.click(btn, "点击去微信")) return false;

        if (ctx.u.wait(function () {
            ctx.log.debug("检查微信页面：编辑资料、每日签到");
            return !!textContains("编辑资料").findOne(ctx.sys.wait) && textContains("每日签到").exists();
        }, 2, 1000, "等待微信小程序")) {
            ctx.u.sleep(1000, "等待微信页面稳定");
            ok = ctx.u.wait(function () {
                ctx.log.debug("检查小程序签到状态");
                if (text("已签到").exists()) { ctx.log.log("检测到已签到"); return true; }
                var sign = text("去签到").findOne(ctx.sys.short);
                if (ctx.u.click(sign, "点击去签到")) {
                    ctx.u.sleep(1500, "等待签到结果");
                    return text("已签到").exists();
                }
                return false;
            }, 3, 2000, "小程序签到");
        } else {
            {
                click(cX(886), cY(1184));
                ctx.u.sleep(1000, "等待微信页面稳定");
            }
        }
    } catch (e) {
        ctx.log.error("程序签到异常：" + e);
    } finally {
        ctx.log.log("准备返回小米社区");
        ctx.u.wait(function () {
            app.launch(ctx.sys.pkg);
            return ctx.isSign();
        }, 3, 1000, "返回社区");
    }
    return ok;
}
module.exports = { tag: "程序签到", name: "程序签到", key: "程序签到", run: run };
