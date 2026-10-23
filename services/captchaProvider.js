/**
 * 验证码服务商适配器
 *
 * 作用：隔离验证码平台的 HTTP 请求和返回值解析。
 * 使用：签到任务只调用 solve()，更换平台时主要修改本文件。
 */
var P = {
    url: "http://api.jfbym.com/api/YmServer/customApi",
    type: 319190,
    direction: "top",
    debug: false    
};

/** 调用验证码平台，返回平台识别结果字符串。 */
function solve(path, opt) {
    opt = opt || {};
    var cfg = opt.config || {};
    var token = cfg.验证码 && cfg.验证码.token;
    if (!path || !token) return null;

    var img = null;
    try {
        if (opt.log) opt.log.debug("读取验证码图片：" + path);
        img = images.read(path);
        if (!img) return null;
        if (opt.log) opt.log.log("提交验证码识别请求");
        var res = http.post(P.url, {
            image: images.toBase64(img),
            direction: P.direction,
            token: String(token),
            type: P.type
        });
        if (!res || !res.body) {
            if (opt.log) opt.log.error("验证码服务无响应");
            return null;
        }
        var body = res.body.string();
        if (opt.log) opt.log.log("验证码接口响应：" + body);

        var resultData = null;
        try {
            var json = JSON.parse(body);
            if (json) {
                if (json.data) {
                    if (typeof json.data === "string") resultData = json.data;
                    else if (typeof json.data === "object" && json.data.data) resultData = String(json.data.data);
                }
                if (!resultData && json.result) {
                    if (typeof json.result === "string") resultData = json.result;
                    else if (typeof json.result === "object" && json.result.data) resultData = String(json.result.data);
                }
                if (!resultData && json.msg && json.code !== 10000) {
                    if (opt.log) opt.log.error("验证码服务提示: " + json.msg + " (code=" + json.code + ")");
                }
            }
        } catch (eJson) {}

        // 原版字符串提取方式兜底
        if (!resultData && body.indexOf('data":"') !== -1) {
            try {
                resultData = body.split('data":"')[1].split('","time')[0].split('"')[0];
            } catch (eSplit) {}
        }
        if (!resultData) {
            var m = body.match(/"data"\s*:\s*"([^"]+)"/);
            if (m) resultData = m[1];
        }

        if (resultData) {
            resultData = String(resultData).trim();
            if (opt.log) opt.log.log("验证码解析成功，提取坐标: " + resultData);
            return resultData;
        } else {
            if (opt.log) opt.log.error("未能解析出验证码坐标数据");
            return null;
        }
    } catch (e) {
        if (opt.log) opt.log.error("验证码服务异常：" + e);
        return null;
    } finally {
        try { if (img) img.recycle(); } catch (e1) {}
    }
}

/** 解析服务商响应，兼容 data/result 两种字段。 */
function parse(body) {
    if (typeof body !== "string" || !body.trim()) return null;
    try {
        var json = JSON.parse(body);
        if (json && json.data !== undefined) return norm(json.data);
        if (json && json.result !== undefined) return norm(json.result);
    } catch (e) {}
    var m = body.match(/"(?:data|result)"\s*:\s*"([^"]*)"/);
    return m ? norm(m[1]) : null;
}

/** 将平台返回值统一转换成字符串。 */
function norm(v) {
    if (v === null || v === undefined) return null;
    v = String(v).trim();
    return v || null;
}

module.exports = { solve: solve };
