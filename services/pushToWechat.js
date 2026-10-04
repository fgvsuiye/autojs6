/**
 * 微信推送服务
 *
 * 统一封装 PushPlus 和 Server酱两种推送方式。
 *
 * 本文件只负责推送，不负责读取 config。
 * 上层模块决定使用哪个渠道以及传入什么参数。
 */

/**
 * 通过 PushPlus 推送消息到微信。
 * @param {string} token PushPlus Token
 * @param {string} title 消息标题
 * @param {string} content 消息内容
 * @returns {boolean} 推送是否成功
 */
function pushPlus(token, title, content, logger) {
    if (!token) {
        if (logger) logger.error("PushPlus Token 未配置");
        return false;
    }

    title = title || "Auto.js 通知";
    content = content || "没有内容";

    var data = {
        token: String(token),
        title: title,
        content: content,
        template: "markdown"
    };

    try {
        if (logger) logger.log("发送 PushPlus 请求");
        var res = http.postJson("http://www.pushplus.plus/send", data);

        if (!res || res.statusCode !== 200) {
            if (logger) logger.error("PushPlus 请求失败: " +
                (res ? res.statusCode : "无响应") +
                (res ? " " + res.statusMessage : ""));
            return false;
        }

        var result = res.body.json();

        if (result && result.code === 200) {
            if (logger) logger.log("PushPlus 推送成功");
            return true;
        }

        if (logger) logger.error("PushPlus 推送失败: " +
            (result && result.msg ? result.msg : "未知错误"));
        return false;
    } catch (e) {
        if (logger) logger.error("PushPlus 推送异常: " + e);
        return false;
    }
}

/**
 * 通过 Server酱推送消息到微信。
 * @param {string} token Server酱 SendKey
 * @param {string} title 消息标题
 * @param {string} content 消息内容，支持 Markdown
 * @returns {boolean} 推送是否成功
 */
function serverChan(token, title, content, logger) {
    if (!token) {
        if (logger) logger.error("ServerChan Token 未配置");
        return false;
    }

    title = title || "Auto.js 通知";
    content = content || "脚本运行结果";

    try {
        if (logger) logger.log("发送 Server酱 请求");
        var url = "https://sctapi.ftqq.com/" + String(token) + ".send";
        var res = http.post(url, {
            title: title,
            desp: content
        });

        if (!res || res.statusCode !== 200) {
            if (logger) logger.error("Server酱请求失败: " +
                (res ? res.statusCode : "无响应") +
                (res ? " " + res.statusMessage : ""));
            return false;
        }

        var result = res.body.json();

        if (result &&
            ((result.data && result.data.errno === 0) || result.code === 0)) {
            if (logger) logger.log("Server酱推送成功");
            return true;
        }

        if (logger) logger.error("Server酱推送失败: " + res.body.string());
        return false;
    } catch (e) {
        if (logger) logger.error("Server酱推送异常: " + e);
        return false;
    }
}

/**
 * 根据指定渠道发送微信通知。
 * @param {string} channel "pushPlus" 或 "serverChan"
 * @param {string} token 对应渠道 Token
 * @param {string} title 消息标题
 * @param {string} content 消息内容
 * @returns {boolean} 推送是否成功
 */
function push(channel, token, title, content, logger) {
    if (!token) {
        if (logger) logger.error("请先配置推送渠道的 Token");
        return false;
    }
    if (logger) logger.debug("推送标题：" + title + "，内容长度：" + String(content || "").length);
    if (!content || !String(content).trim()) {
        if (logger) logger.error("推送内容为空，取消发送");
        return false;
    }

    if (channel === "pushPlus") {
        var ok1 = pushPlus(token, title, content, logger);

        if (ok1) {
            toast("消息已通过 PushPlus 推送至微信");
        } else {
            toast("PushPlus 推送失败，请查看日志");
        }

        return ok1;
    }

    if (channel === "serverChan") {
        var ok2 = serverChan(token, title, content, logger);

        if (ok2) {
            toast("消息已通过 Server酱 推送至微信");
        } else {
            toast("Server酱 推送失败，请查看日志");
        }

        return ok2;
    }

    if (logger) logger.error("未知的推送渠道：" + channel);
    return false;
}

module.exports = push;
