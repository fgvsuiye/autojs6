/** 执行浏览帖子任务：进入帖子、浏览一段时间后返回社区。 */
function run(ctx) {
    var sys = ctx.sys, w = ctx.w, h = ctx.h;
    try {
        ctx.log.log("开始查找可浏览帖子");
        var ok = ctx.u.wait(function () {
            var re = /((0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9]))|(0[0-9]|1[0-9]|2[0-3])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/;
            var arr = [textMatches(re), desc("评论"), id("img_tri_fst")];
            for (var i = 0; i < arr.length; i++) {
                var obj = arr[i].findOne(sys.short);
                if (obj) return ctx.u.click(obj, "打开帖子");
                ctx.log.log("未找到帖子，向上滑动继续查找");
                swipe(w * .5, h * .8, w * .5, h * .5, random(400, 600));
            }
            return false;
        }, 2, 1000, "查找帖子");
        if (ok) {
            ctx.u.sleep(random(6000, 7000), "浏览帖子");
            ctx.log.log("执行浏览滑动");
            swipe(w * .5, h * .8, w * .5, h * .2, random(400, 600));
            ctx.u.sleep(random(6000, 7000), "浏览帖子");
        }
        ctx.log.log("返回主页")
        back();
        return ok;
    } catch (e) {
        ctx.log.error("浏览帖子异常：" + e);
        back();
        return false;
    }
}
module.exports = { tag: "浏览帖子", name: "浏览帖子", key: "浏览帖子", run: run };
