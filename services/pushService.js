/**
 * 推送服务
 *
 * 作用：根据配置选择推送渠道。
 * 使用：主程序只调用 send(ctx)，具体推送实现放在 pushToWechat.js。
 */
function send(ctx) {
    var p = ctx.cfg.推送 || {};
    var mode = p.方式;
    if (mode != 1 && mode != 2) return true;

    var token = mode == 1 ? p.serverChanToken : p.pushPlusToken;
    if (!token) {
        ctx.log.info("推送任务跳过：Token 未配置");
        return true;
    }

    try {
        require("./pushToWechat.js")(mode == 1 ? "serverChan" : "pushPlus", token, "小米社区签到任务完成", ctx.state.push || "", ctx.log);
        return true;
    } catch (e) {
        ctx.log.error("推送异常：" + e);
        return false;
    }
}

module.exports = { send: send };
