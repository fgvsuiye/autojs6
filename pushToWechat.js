/**
 * @version 20250518
 * 推送消息到微信
*/


/**
 * 通过 PushPlus 推送消息到微信
 * @param {*} token 用户Token
 * @param {*} title 消息标题
 * @param {*} content 消息内容
 * @returns {Boolean} 推送是否成功
 */
function pushPlus(token, title, content) {
    if (!token) {
        toastLog("PushPlus Token 未配置");
        return false;
    }
    title = title || "Auto.js 通知";
    content = content || "没有内容";
    template = "markdown"; // html, json, cloudMonitor 均可

    let url = "http://www.pushplus.plus/send";
    let data = {
        token: token,
        title: title,
        content: content,
        template: template
    };

    try {
        
        let res = http.postJson(url, data);
        if (res.statusCode == 200) {
            let result = res.body.json();
            if (result.code == 200) {
                log("PushPlus 推送成功");
                return true;
            } else {
                log("PushPlus 推送失败: " + result.msg);
                return false;
            }
        } else {
            log("PushPlus 请求失败: " + res.statusCode + " " + res.statusMessage);
            return false;
        }
    } catch (e) {
        log("PushPlus 推送异常: " + e);
        return false;
    }
}

/**
 * 通过 ServerChan 推送消息到微信
 * @param {*} token 用户Token
 * @param {*} title 消息标题
 * @param {*} desp 消息内容
 * @returns {Boolean} 推送是否成功
 */
function serverChan(token, title, desp) {
    if (!token) {
        toastLog("ServerChan token 未配置");
        return false;
    }
    title = title || "Auto.js 通知";
    desp = desp || "脚本运行结果";

    let url = "https://sctapi.ftqq.com/" + token + ".send";
    let params = {
        title: title, // 消息标题，必填
        desp: desp    // 消息内容，选填，支持 Markdown
    };

    try {
        // POST
        let res = http.post(url, params);
        if (res.statusCode == 200) {
            let result = res.body.json();
            if (result.data && result.data.errno === 0 || result.code === 0) { 
                log("Server酱推送成功: " + result.data.pushid);
                return true;
            } else {
                log("Server酱推送失败: " + res.body.string());
                return false;
            }
        } else {
            log("Server酱请求失败: " + res.statusCode + " " + res.statusMessage);
            return false;
        }
    } catch (e) {
        log("Server酱推送异常: " + e);
        return false;
    }
}

/**
 * 推送消息到微信
 * @param {string} pushChannel 推送渠道，目前支持 "pushPlus" 和 "serverChan"
 * @param {*} myToken 推送渠道的 Token
 * @param {string} pushTitle 推送标题
 * @param {string} pushContent 推送内容
 */
function push(pushChannel, myToken, pushTitle, pushContent) {
    // 推送消息
    if (myToken) {
        if (pushChannel === "pushPlus") {
            if (pushPlus(myToken, pushTitle, pushContent)) {
                toast("消息已通过 PushPlus 推送至微信");
            } else {
                toast("PushPlus 推送失败，请查看日志");
            }
        } else if (pushChannel === "serverChan") {
            if (serverChan(myToken, pushTitle, pushContent)) {
                toast("消息已通过 Server酱 推送至微信");
            } else {
                toast("Server酱 推送失败，请查看日志");
            }
        } else {
            toastLog("未知的推送渠道: " + pushChannel);
        }
    } else {
        toastLog("请先配置推送渠道的 Token");
    }
}

// 导出push函数
module.exports = push;