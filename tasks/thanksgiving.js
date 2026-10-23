/** 执行感恩季活动，并处理首次报名和解锁。 */
function run(ctx) {
    try {
        var btn = className("android.widget.Button").desc("去参加").findOne(3000);
        if (!ctx.u.click(btn, "点击去参加（感恩季）")) return false;
        var store = storages.create("isFirstParticipation");
        if (store.get("isFirstParticipation") !== true) {
            var reg = className("android.widget.Button").text("立即报名").findOne(3000);
            if (reg) {
                try {
                    if (typeof detect === "function") {
                        detect(reg, "s>1", "click");
                    } else if (reg.parent() && reg.parent().childCount() > 1) {
                        reg.parent().child(1).click();
                    }
                } catch (eDet) {}
                ctx.u.sleep(300);
                ctx.u.click(reg, "点击立即报名");
                ctx.u.sleep(300);
                try {
                    if (typeof pickup === "function") {
                        pickup(textContains("确定"), "click");
                    } else {
                        var okBtn = textContains("确定").findOne(2000);
                        if (okBtn) ctx.u.click(okBtn, "点击确定");
                    }
                } catch (ePick) {}
                store.put("isFirstParticipation", true);
            }
        }
        ctx.u.sleep(1000);
        require("./unlockActivity.js").run(ctx);
        ctx.u.sleep(1000);
        back();
        return true;
    } catch (e) {
        ctx.log.error("感恩季异常：" + e);
        back();
        return false;
    }
}
module.exports = { name: "感恩活动", tag: "主程序", key: "感恩季", run: run };
