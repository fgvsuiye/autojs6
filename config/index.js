/**
 * 配置文件加载器
 */

var config = require("./config.js");

function mergeConfig(target, source) {
    Object.keys(source).forEach(function (key) {
        var value = source[key];
        if (value && typeof value === "object" && !Array.isArray(value)) {
            if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) {
                target[key] = {};
            }
            mergeConfig(target[key], value);
        } else {
            target[key] = value;
        }
    });

    return target;
}

if (files.exists("./config/config.local.js")) {
    var localConfig = require("./config.local.js");
    if (!localConfig || typeof localConfig !== "object" || Array.isArray(localConfig)) {
        throw new Error("本地配置文件必须导出一个配置对象");
    }
    mergeConfig(config, localConfig);
}

module.exports = config;
