/** 执行活动中的解锁动作。 */
function run(ctx) {
    var pick = pickup;
    var list = className("TextView").text("可解锁").find();
    var count = pick(text("去提升"), "p1c1", "text");
    if (!list || list.size() <= 0 || count <= 0) return true;

    for (var i = 0; i < list.size() && i <= 10; i++) {
        if (count < 1) break;
        ctx.u.click(list.get(i), "点击解锁");
        ctx.log.log("第" + (i + 1) + "次解锁");
        ctx.u.sleep(1000);
        pick(text("炫耀一下"), "p1s>1", "click");
        ctx.u.sleep(1000);
        if (text("可获得1次解锁机会").exists() || text("等待解锁").exists()) break;
    }
    return true;
}
module.exports = { run: run };
