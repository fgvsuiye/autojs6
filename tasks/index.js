/**
 * 任务注册表
 *
 * 作用：集中管理任务的加载、执行开关和执行顺序。
 * 使用：新增任务时，在 tasks/ 创建模块，再在这里注册；main.js 不需要修改。
 */

/** 根据配置生成本次需要执行的任务列表。 */
function get(cfg) {
    var pre = [];
    var list = [];
    var ext = require("./external.js");

    // 预任务：进入签到页之前执行
    if (cfg.任务.浏览帖子) pre.push(require("./browse.js"));

    // 主任务：保持原有业务顺序
    if (cfg.任务.签到) list.push(require("./sign.js"));
    if (cfg.任务.小程序签到) list.push(require("./miniApp.js"));
    if (cfg.任务.拔萝卜) list.push(require("./carrot.js"));
    if (cfg.任务.观看视频) list.push(require("./video.js"));
    if (cfg.任务.双旗舰) list.push(require("./dualFlagship.js"));
    if (cfg.任务.感恩季) list.push(require("./thanksgiving.js"));
    if (cfg.任务.成长值记录) list.push(require("./level.js"));

    return { pre: pre, list: list };
}

module.exports = { get: get };
