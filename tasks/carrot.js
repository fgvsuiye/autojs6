/** 执行拔萝卜任务。 */
function run(ctx) {
    try {
        swipe(ctx.w * .5, ctx.h * .8, ctx.w * .5, ctx.h * .4, 500);
        ctx.u.sleep(1000);
        var btn = desc("去看看").findOne(ctx.sys.wait);
        if (!ctx.u.click(btn, "点击去看看（拔萝卜）")) return false;
        ctx.u.sleep(1000);
        ctx.log.log("开始拔萝卜活动签到");
        back();
        return true;
    } catch (e) {
        ctx.log.error("拔萝卜异常：" + e);
        back();
        return false;
    }
}
module.exports = { tag: "萝卜活动", name: "萝卜活动", key: "拔萝卜", run: run };
