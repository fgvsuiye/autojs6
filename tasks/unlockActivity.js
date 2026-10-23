/** 执行活动中的解锁动作。 */
function run(ctx) {
    var list = className("TextView").text("可解锁").find();
    var count = 0;

    try {
        if (typeof pickup === "function") {
            count = parseInt(pickup(text("去提升"), "p1c1", "text"), 10) || 0;
        } else {
            var upObj = text("去提升").findOne(2000);
            if (upObj && upObj.parent() && upObj.parent().childCount() > 1) {
                var c1 = upObj.parent().child(1);
                count = parseInt(c1 ? c1.text() : "0", 10) || 0;
            }
        }
    } catch (eCnt) {}

    if (!list || list.size() <= 0 || count <= 0) return true;

    for (var i = 0; i < list.size() && i <= 10; i++) {
        if (count < 1) break;
        ctx.u.click(list.get(i), "点击解锁");
        ctx.log.log("第" + (i + 1) + "次解锁");
        ctx.u.sleep(1000);
        try {
            if (typeof pickup === "function") {
                pickup(text("炫耀一下"), "p1s>1", "click");
            } else {
                var brag = text("炫耀一下").findOne(2000);
                if (brag && brag.parent()) {
                    var bp = brag.parent();
                    var bIdx = brag.indexInParent();
                    if (bIdx + 1 < bp.childCount()) {
                        ctx.u.click(bp.child(bIdx + 1), "点击炫耀后按钮");
                    } else if (bp.parent()) {
                        var bpp = bp.parent();
                        var bpIdx = bp.indexInParent();
                        if (bpIdx + 1 < bpp.childCount()) {
                            ctx.u.click(bpp.child(bpIdx + 1), "点击炫耀后按钮");
                        }
                    }
                }
            }
        } catch (eBrag) {}
        ctx.u.sleep(1000);
        if (text("可获得1次解锁机会").exists() || text("等待解锁").exists()) break;
    }
    return true;
}
module.exports = { run: run };
