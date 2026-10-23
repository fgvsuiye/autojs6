/**
 * 设备工具
 *
 * 作用：处理解锁、重启应用、跳过广告和结束应用。
 * 
 */
importClass(android.content.Context);

/** 根据配置执行一次解锁动作。 */
function doUnlock(ctx) {
    var c = ctx.cfg.解锁;
    var s = ctx.sys;
    var off = random(-150, 150);

    if (!device.isScreenOn()) {
        ctx.log.log("屏幕未点亮，尝试唤醒...");
        device.wakeUp();
        ctx.u.sleep(s.short);
        if (!device.isScreenOn()) return false;
    }

    if (c.方式 != 1 && c.方式 != 2) {
        ctx.log.log("解锁方式不支持，跳过解锁动作。");
        swipe(ctx.w / 2, ctx.h * .7 + off, ctx.w / 2, ctx.h * .3 + off, s.swipe);
        ctx.u.sleep(500);
        return true;
    }

    var visible = false;
    for (var i = 0; i < 3; i++) {
        if (ctx.u.wait(function () {
            ctx.log.log("等待解锁界面...");
            swipe(ctx.w / 2, ctx.h * .7 + off, ctx.w / 2, ctx.h * .3 + off, s.swipe);
            ctx.u.sleep(500);
            return textMatches(/.*?(紧急呼叫|Emergency call|图案|数字|混合|Pattern|PIN|Password).*?/).exists();
        }, 5, 1000, "解锁界面")) {
            visible = true;
            break;
        }
        ctx.u.sleep(1000);
    }
    if (!visible) return false;

    try {
        if (c.方式 == 1) {
            ctx.log.log("使用图案解锁...");
            if (!Array.isArray(c.图案) || !c.图案.length) return false;
            gesture(800, c.图案);
            ctx.log.log("图案解锁完成");
        } else {
            ctx.log.log("使用密码解锁...");
            var pwd = String(c.密码);
            for (var j = 0; j < pwd.length; j++) {
                var btn = desc(pwd.charAt(j)).findOne(s.short);
                if (!ctx.u.click(btn)) return false;
                ctx.u.sleep(100);
            }
            ctx.log.log("密码输入完成");
        }
        ctx.u.sleep(2000);
        return true;
    } catch (e) {
        ctx.log.error("解锁异常：" + e);
        return false;
    }
}

/** 检查锁屏状态并在需要时重复执行解锁。 */
function unlock(ctx, max) {
    ctx.log.setTag(ctx.log.tags.unlock);
    ctx.log.info("任务启动");
    var keyguardKey = (typeof Context !== "undefined" && Context.KEYGUARD_SERVICE) ? Context.KEYGUARD_SERVICE : "keyguard";
    var km = context.getSystemService(keyguardKey);
    if (!km || !km.inKeyguardRestrictedInputMode()) {
        ctx.log.log("设备未锁定");
        return true;
    }
    for (var i = 1; i <= max; i++) {
        ctx.log.log("第 " + i + " / " + max + " 次尝试解锁");
        if (doUnlock(ctx)) {
            km = context.getSystemService(keyguardKey);
            if (!km || !km.inKeyguardRestrictedInputMode()) { ctx.log.info("任务结果：成功"); return true; }
        }
        ctx.u.sleep(ctx.sys.short);
    }
    ctx.log.error("解锁失败，无法进入系统");
    ctx.log.diag("解锁失败状态");
    return false;
}

/** 通过系统应用设置结束小米社区进程。 */
function kill(ctx) {
    try {
        ctx.log.log("打开应用设置...");
        app.openAppSetting(ctx.sys.pkg);
        ctx.u.sleep(1500);
        var btn = textMatches(/(结束运行|强行停止|FORCE STOP|Force stop)/).findOne(ctx.sys.wait);
        if (btn && btn.enabled()) {
            ctx.u.click(btn, "结束运行");
            var ok = textMatches(/(确定|OK|强行停止)/).findOne(ctx.sys.short);
            if (ok) {
                ctx.u.click(ok, "确认强行停止");
            }
        }
        ctx.u.sleep(500);
        back(); // 退出应用设置界面，避免遮挡
        ctx.u.sleep(1000);
    } catch (e) {
        ctx.log.error("结束应用异常：" + e);
    }
}

/** 重启小米社区，并等待首页签到入口出现。 */
function restart(ctx, first) {
    kill(ctx);
    ctx.u.sleep(500);
    ctx.log.log("尝试启动小米社区: " + ctx.sys.pkg);
    if (!app.launch(ctx.sys.pkg)) {
        ctx.log.error("启动小米社区失败：" + ctx.sys.pkg);
        return false;
    }
    var ready = ctx.u.wait(function () {
        return !!desc(ctx.ui.sign).findOne(ctx.sys.wait);
    }, 3, ctx.sys.short, "等待社区首页");
    var allow = textMatches(/(允许|允许使用|Allow)/).findOne(1000);
    if (allow) ctx.u.click(allow, "处理权限弹窗");
    if (!first) {
        var signEntry = desc(ctx.ui.sign).findOne(ctx.sys.short);
        if (signEntry) ctx.u.click(signEntry, "点击签到入口");
    }
    return ready;
}

/** 尝试关闭启动广告。 */
function skipAd(ctx) {
    var btn = descMatches(/(关闭|跳过|Skip)/).findOne(2000) ||
        textMatches(/(关闭|跳过|Skip)/).findOne(1000) ||
        idMatches(/.*(close|skip|cancel).*/).findOne(1000);
    return !!(btn && ctx.u.click(btn, "跳过启动广告"));
}

module.exports = { unlock: unlock, kill: kill, restart: restart, skipAd: skipAd };
