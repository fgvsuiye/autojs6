var actUnlock = require("./unlockActivity.js").run;
/** 执行双旗舰活动任务。 */
function run(ctx) {
    try {
        var btn = className("android.widget.Button").desc("去参加").findOne(ctx.sys.wait);
        if (!ctx.u.click(btn, "点击去参加（双旗舰）")) return false;
        var reg = className("android.widget.Button").text("立即报名").findOne(ctx.sys.short);
        if (reg) {
            try {
                if (reg.parent().child(1).click()) {
                    ctx.u.click(reg, "点击立即报名（双旗舰）");
                    ctx.u.sleep(2000);
                    click(ctx.w * .74, ctx.h * .94);
                    ctx.u.sleep(1000);
                }
            } catch (e) {}
        }
        actUnlock(ctx);
        ctx.u.sleep(1000);
        back();
        return true;
    } catch (e) {
        ctx.log.error("双旗舰异常：" + e);
        back();
        return false;
    }
}
module.exports = { name: "旗舰活动", tag: "主程序", key: "双旗舰", run: run };
