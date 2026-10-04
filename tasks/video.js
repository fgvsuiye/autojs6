/** 执行观看视频任务并按时间进行浏览。 */
function run(ctx) {
    try {
        var btn = className("android.widget.Button").desc("去浏览").findOne(ctx.sys.wait);
        if (!ctx.u.click(btn, "点击去浏览（视频）")) return false;
        var start = new Date().getTime();
        var last = -1;
        var mins = 5;
        while (true) {
            var now = (new Date().getTime() - start) / 60000;
            if (now >= mins) break;
            var cur = Math.floor(now);
            if (cur > last) { ctx.log.log("已观看约 " + cur + " 分钟"); last = cur; }
            ctx.u.sleep(random(10000, 15000));
            var x = ctx.w / 2 + random(-50, 50);
            swipe(x, ctx.h * .8 + random(-50, 50), x, ctx.h * .3 + random(-50, 50), random(400, 600));
        }
        back();
        return true;
    } catch (e) {
        ctx.log.error("观看视频异常：" + e);
        back();
        return false;
    }
}
module.exports = { name: "观看视频", tag: "主程序", key: "观看视频", run: run };
