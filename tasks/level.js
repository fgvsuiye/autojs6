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

    try {
        ctx.log.log("读取今日签到及任务数据");
        var signObj = textMatches(/已连续签到 (\d{1,4}) 天/).findOne(ctx.sys.short);
        var signText = signObj ? signObj.text() : "";
        var days = signText ? (signText.split(" ")[1] || "0") : "0";
        ctx.log.debug("连续签到文本：" + signText);

        var diObj = text("每日任务").findOne(ctx.sys.short);
        var niObj = text("新手任务").findOne(ctx.sys.short);
        var dhObj = text("每日签到").findOne(ctx.sys.short);

        var di = diObj ? diObj.indexInParent() : -1;
        var ni = niObj ? niObj.indexInParent() : 999;
        var dh = (dhObj && dhObj.bounds()) ? dhObj.bounds().height() : 0;
        var pid = (dhObj && dhObj.parent()) ? dhObj.parent().id() : "";

        var all = className("android.widget.TextView").find();
        var list = [];
        if (all && all.size() > 0) {
            for (var aIdx = 0; aIdx < all.size(); aIdx++) {
                try {
                    var itemNode = all.get(aIdx);
                    var idx = itemNode.indexInParent();
                    var b = itemNode.bounds();
                    var bh = b ? b.height() : 0;
                    var p = itemNode.parent() ? itemNode.parent().id() : "";
                    if (idx > di && idx < ni && Math.abs(bh - dh) < 2 && p == pid) {
                        list.push(itemNode.text());
                    }
                } catch (eItem) {}
            }
        }

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
        if (items && items.size() > 0) {
            for (var itIdx = 0; itIdx < items.size(); itIdx++) {
                try {
                    var curItem = items.get(itIdx);
                    var parentNode = curItem.parent();
                    var itemIdx = curItem.indexInParent();
                    var prevNode = (parentNode && itemIdx > 0) ? parentNode.child(itemIdx - 1) : null;
                    var nextNode = (parentNode && itemIdx + 1 < parentNode.childCount()) ? parentNode.child(itemIdx + 1) : null;
                    var name = prevNode ? prevNode.text() : "";
                    var pt = nextNode ? nextNode.text() : "";
                    if (name && pt) {
                        var pVal = parseInt(pt.replace("+", ""), 10) || 0;
                        done[name] = done.hasOwnProperty(name) ? (parseInt(done[name], 10) + pVal) : pt;
                        total += pVal;
                    }
                } catch (eParse) {}
            }
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
        var curObj = textMatches(/成长值 (\d{1,5})\/(\d{1,5})/).findOne(ctx.sys.short);
        var cur = curObj ? curObj.text() : "";

        var level = "";
        var segs = textContains("段").find();
        if (segs && segs.size() > 0) {
            for (var sIdx = 0; sIdx < segs.size(); sIdx++) {
                var seg = segs.get(sIdx);
                var sb = seg.bounds();
                if (sb) {
                    var cxRatio = sb.centerX() / ctx.w;
                    if (cxRatio >= 0.35 && cxRatio <= 0.65) {
                        level = seg.text();
                        break;
                    }
                }
            }
            if (!level && segs.size() > 0) {
                level = segs.get(0).text();
            }
        }

        var now = null;
        var max = null;
        if (cur) {
            var cm = String(cur).match(/(\d{1,5})\/(\d{1,5})/);
            if (cm) {
                now = parseInt(cm[1], 10);
                max = parseInt(cm[2], 10);
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
            try {
                var totStr = String(total);
                while (totStr.length < 5) totStr += " ";
                files.append("./tmp/level.txt", "\n" + ctx.today + "：今日：+" + totStr + " 当前 " + (level || "未知") + " 总计：" + now + "/" + max);
            } catch (e) {}
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
