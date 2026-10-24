/** 执行浏览帖子任务：循环浏览指定篇数（默认 10 篇），浏览完成后平稳返回主页。 */
function run(ctx) {
    var sys = ctx.sys, w = ctx.w, h = ctx.h;
    var target = 10;
    if (ctx.cfg && ctx.cfg.任务 && typeof ctx.cfg.任务.浏览帖子 === "number" && ctx.cfg.任务.浏览帖子 > 1) {
        target = ctx.cfg.任务.浏览帖子;
    }
    ctx.log.info("计划浏览帖子 " + target + " 篇");

    var count = 0;
    var failCount = 0;
    var re = /((0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9]))|(0[0-9]|1[0-9]|2[0-3])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/;

    for (var i = 0; i < target && failCount < 5; i++) {
        ctx.log.log("正在查找第 " + (count + 1) + "/" + target + " 篇帖子");
        var postObj = null;

        for (var retry = 0; retry < 3; retry++) {
            var arr = [textMatches(re), desc("评论"), id("img_tri_fst")];
            for (var a = 0; a < arr.length; a++) {
                var found = arr[a].find();
                if (found && found.length) {
                    for (var k = 0; k < found.length; k++) {
                        var b = found[k].bounds();
                        if (b.top > h * 0.15 && b.bottom < h * 0.85) {
                            postObj = found[k];
                            break;
                        }
                    }
                }
                if (postObj) break;
            }
            if (postObj) break;
            swipe(w * 0.5, h * 0.7, w * 0.5, h * 0.45, random(350, 500));
            ctx.u.sleep(800);
        }

        if (postObj && ctx.u.click(postObj, "打开帖子")) {
            ctx.u.sleep(random(5500, 7500), "初览帖子");
            swipe(w * 0.5, h * 0.75, w * 0.5, h * 0.3, random(350, 500));
            ctx.u.sleep(random(5500, 7500), "细览帖子");
            back();
            ctx.u.sleep(1000, "返回信息流");
            count++;
            failCount = 0;
            ctx.log.info("已完成第 " + count + "/" + target + " 篇浏览");
            swipe(w * 0.5, h * 0.8, w * 0.5, h * 0.3, random(350, 500));
            ctx.u.sleep(1000);
        } else {
            failCount++;
            ctx.log.log("未点中帖子，滑动翻页寻找新帖子 (" + failCount + "/5)");
            swipe(w * 0.5, h * 0.75, w * 0.5, h * 0.3, random(400, 600));
            ctx.u.sleep(1200);
        }
    }

    ctx.log.info("浏览帖子任务完成，累计成功浏览 " + count + " 篇");
    ctx.u.sleep(1500, "等待页面平稳");
    return count > 0;
}

module.exports = { tag: "浏览帖子", name: "浏览帖子", key: "浏览帖子", run: run };
