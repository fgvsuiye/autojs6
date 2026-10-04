/** 查找两个任务名称之间的共同子串，用于匹配成长值记录。 */
function findCommonSub(a, b) {
    a = String(a || "");
    b = String(b || "");
    var short = a.length <= b.length ? a : b;
    var long = a.length <= b.length ? b : a;
    for (var len = short.length; len >= 3; len--) {
        for (var i = 0; i + len <= short.length; i++) {
            var s = short.substring(i, i + len);
            if (long.indexOf(s) >= 0) return s;
        }
    }
    return false;
}

/** 读取签到和成长值页面，生成今日任务报告并保存推送内容。 */
function run(ctx) {
    if (!ctx.isSign()) { ctx.log.log("当前不在签到页面，跳过积分记录"); return true; }
    var pick = pickup;

    try {
        ctx.log.log("读取今日签到及任务数据");
        var signText = pick(textMatch(/已连续签到 (\d{1,4}) 天/), "text");
        var days = signText ? signText.split(" ")[1] : "0";
        ctx.log.debug("连续签到文本：" + signText);
        var all = className("android.widget.TextView").find();
        var di = pick(text("每日任务"), "indexInParent");
        var ni = pick(text("新手任务"), "indexInParent");
        var dh = pick(text("每日签到"), "boundsHeight");
        var pid = pick(text("每日签到"), "p1", "id");
        var list = all.filter(function (item) {
            var idx = item.indexInParent();
            var bh = detect(item, "boundsHeight");
            var p = detect(item, "p1", "id");
            return idx > di && idx < ni && Math.abs(bh - dh) < 2 && p == pid;
        }).map(function (item) { return item.text(); });

        ctx.log.log("查找社区成长等级入口");
        var entry = text("社区成长等级").findOne(ctx.sys.wait);
        if (!ctx.u.click(entry, "点击社区成长等级")) return false;
        ctx.u.sleep(2000, "等待成长等级页面加载");

        var today = ctx.today.replace(/-/g, "/");
        var total = 0;
        var done = {};
        var count = 0;
        var lines = [
            "## 任务报告\n* 时间：" + new Date().toLocaleString() + "\n* 来自 Auto.js 脚本推送\n",
            "| 任务名称 | 数值 | 状态 |", "|---|---|---|"
        ];

        ctx.log.log("读取今日积分明细");
        var items = className("android.widget.TextView").textContains(today).find();
        ctx.log.debug("今日积分记录数量：" + (items ? items.size() : 0));
        if (items && items.nonEmpty()) {
            items.forEach(function (item) {
                try {
                    var name = item.previousSibling().text();
                    var pt = item.nextSibling().text();
                    var p = parseInt(pt.replace("+", ""));
                    done[name] = done.hasOwnProperty(name) ? parseInt(done[name]) + p : pt;
                    total += p;
                } catch (e) {}
            });
        }

        for (var i = 0; i < list.length; i++) {
            var show = list[i], reward = "0", icon = "❌";
            for (var k in done) {
                var hit = findCommonSub(list[i], k);
                if (hit) { show = hit; reward = done[k]; icon = "✅"; count++; break; }
            }
            lines.push("| " + show + " | " + reward + " | " + icon + " |");
        }

        lines.push("-----", "* 当前信息", "", "| 项目 | 状态 |", "|---|---|", "| 今日总计 | " + total + " |");
        ctx.log.log("读取当前成长值和等级");
        var cur = pick(textMatch(/成长值 (\d{1,5})\/(\d{1,5})/), "text");
        var level = pick(textContains("段").boundsCenterX(0.4, 0.6), "text");
        var now = null;
        var max = null;
        if (cur) {
            var cm = String(cur).match(/(\d{1,5})\/(\d{1,5})/);
            if (cm) {
                now = parseInt(cm[1]);
                max = parseInt(cm[2]);
            }
        }
        lines.push("| 今日任务完成 | " + count + " / " + list.length + " |", "| 连续签到天数 | " + days + " |");
        if (now !== null) lines.push("| 当前成长值 | " + now + " |");
        if (level) lines.push("| 当前等级 | " + level + " |");
        if (now !== null && max !== null) lines.push("| 距下一段还需 | " + (max - now) + " |");
        lines.push("-----");
        lines.push(count != list.length ? "* ⚠️ **注意** 今日有任务未完成，请打开社区检查\n" : "* ✅ 所有任务已完成");
        ctx.log.debug("积分汇总：total=" + total + ", completed=" + count + "/" + list.length + ", current=" + now + ", level=" + level);
        if (now !== null) {
            try { files.append("./tmp/level.txt", "\n" + ctx.today + "：今日：+" + String(total).padEnd(5, " ") + " 当前 " + (level || "未知") + " 总计：" + now + "/" + max); } catch (e) {}
        }
        ctx.state.push = lines.join("\n");
        ctx.log.log("积分报告生成完成，共 " + lines.length + " 行");
        ctx.log.debug("推送内容预览：\n" + ctx.state.push);
        back();
        return true;
    } catch (e) {
        ctx.log.error("成长值记录异常：" + e);
        back();
        return false;
    }
}

module.exports = { name: "积分记录", tag: "积分记录", key: "记录成长值", run: run };
