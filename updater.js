/**
 * @version 20250517
 * @description 更新器脚本
 *               自动检查更新并下载更新文件。
 */


console.setSize(0.9, 0.5).show();
console.info(">>>>>>>---| 检查更新 |---<<<<<<<");
const receiver = engines.myEngine().execArgv;
var proxy, remoteVersionsData 
var configNeedsMerge = false;
if (receiver && typeof receiver.proxy !== "undefined" && typeof receiver.remoteVersionsData !== "undefined") {
    proxy = receiver.proxy;
    remoteVersionsData = receiver.remoteVersionsData;
}else {
    console.error("接收器参数错误，无法获取代理和更新列表。");
    engines.stopAllAndToast();
    exit();
}
var updateKeys = remoteVersionsData["updateKeys"];
if (!updateKeys || updateKeys.length === 0) updateKeys = ["小程序签到", "成长值记录", "浏览帖子", "加入圈子", "观看视频", "米粉节", "感恩季", "双旗舰", "拔萝卜"];


/**
 * 获取本地文件的版本号
 * @param {string} relativePath相对于项目根目录的文件路径
 * @returns {string | number} 版本号, 格式为 yyyymmdd 或 0 
 */
function getLocalVersion(relativePath) {
    let localPath = files.join(files.cwd(), relativePath);
    if (!files.exists(localPath)) {
        return 0; // 文件不存在，视为版本0
    }
    try {
        let content = files.read(localPath);
        let match = content.match(/\*\s*@version\s+(\d{8})/);
        return match ? match[1] : 0; // 无版本号视为0
    } catch (e) {
        console.error("读取本地文件版本失败: " + relativePath, e);
        return 0;
    }
}

/**
 * 比较版本号
 * @param {string|number} localVersion - 本地版本号
 * @param {string|number} serverVersion - 服务器版本号
 * @returns {boolean} 是否有更新
 */
function compareVersions(localVersion, serverVersion) {
    var normalizeVersion = (vStr) => {
        // 检查是否是8位数字字符串
        if (typeof vStr === 'number') return vStr;
        if (typeof vStr === 'string' && /^\d{8}$/.test(vStr)) {
            return parseInt(vStr, 10);
        }
        return 0;
    };
    var numLocal = normalizeVersion(localVersion);
    var numServer = normalizeVersion(serverVersion);
    if (numLocal < numServer) return true;
}


function downloadFile(scriptPathInRepo, localFullPath) {
    var downloadUrl = proxy + "https://github.com/fgvsuiye/autojs6/blob/main/" + scriptPathInRepo + "?timestamp=" + new Date().getTime();
    try {
        let res = http.get(downloadUrl);
        if (res.statusCode == 200) {
            // 确保目标目录存在
            files.ensureDir(localFullPath);
            // 下载到临时文件，成功后再重命名，防止更新中断导致文件损坏
            let tempPath = localFullPath + ".tmp";
            files.write(tempPath, res.body.string());
            if (files.exists(tempPath)) { // 简单校验
                fileName = files.getName(localFullPath);
                files.rename(tempPath, fileName) ; // 覆盖原文件
                console.log(`文件 ${scriptPathInRepo} 下载并保存到 ${localFullPath} 成功。`);
                return true;
            } else {
                console.error(`下载 ${scriptPathInRepo} 后写入临时文件 ${tempPath} 失败或文件为空。`);
                if(files.exists(tempPath)) files.remove(tempPath);
                return false;
            }
        } else {
            console.error(`下载 ${scriptPathInRepo} 失败: HTTP ${res.statusCode} - ${res.statusMessage}`);
            return false;
        }
    } catch (e) {
        console.error(`下载 ${scriptPathInRepo} 异常:`, e);
        return false;
    }
}

// --- 更新逻辑 ---
function performUpdates() {
    var configPath = "/tmp/config.js"; // 相对于项目根目录的路径
    var updatesPerformedCount = 0;
    try {
        
        for (let scriptPathInRepo in remoteVersionsData) {
            let remoteVersion = remoteVersionsData[scriptPathInRepo];
            if (typeof remoteVersion !== "number") continue; // 跳过非数字项
            if (scriptPathInRepo === "updater.js") continue; // 跳过更新器自身
            let localVersion = getLocalVersion(scriptPathInRepo);
            let localFullPath = files.join(files.cwd(), scriptPathInRepo);
            if (compareVersions(localVersion, remoteVersion) ) {
                console.log(`需要更新: ${scriptPathInRepo} (本地: ${localVersion}, 远程: ${remoteVersion})`);
                if (scriptPathInRepo == configPath) {
                    // 特殊处理 config.js
                    if (files.exists(localFullPath)) {
                        configNeedsMerge = true;
                        localFullPath = localFullPath + ".txt";
                    }
                    if (downloadFile(scriptPathInRepo, localFullPath)) {
                        console.error(`${configPath} 已下载成功，准备合并配置...`);
                        updatesPerformedCount++;
                    } else {
                        console.log(`更新 ${configPath} 失败!`);
                    }
                } else {
                    // 其他文件直接覆盖
                    if (downloadFile(scriptPathInRepo, localFullPath)) {
                        console.log(`${scriptPathInRepo} 更新成功!`);
                        updatesPerformedCount++;
                    } else {
                        console.log(`更新 ${scriptPathInRepo} 失败!`);
                    }
                }
            } else {
                console.log(`${scriptPathInRepo} 无需更新 (本地: ${localVersion}, 远程: ${remoteVersion})`);
            }
        }
        if (updatesPerformedCount > 0) {
            console.info(`更新完成，本次更新共 ${updatesPerformedCount} 个文件。`);
        } else {
            console.log("所有受管理的文件已是最新或未找到更新目标。");
        }
    } catch (e) {
        console.error("更新异常:", e);
    } finally {
        console.log("Updater.js 执行完毕。");
    }
}

performUpdates();

if (configNeedsMerge) {
    // 监听退出事件
    events.on("exit", function() {
        let path = files.join(files.cwd(), "tmp/mergeConfigs.js");
        if  (!files.exists(path)) {
            console.error("合并配置脚本不存在，无法执行。");
            return;
        }
        engines.execScriptFile(path, {
            arguments: {
                updateKeys: updateKeys
            }
        })
    });
}else{
    console.log("更新完成，脚本将在3秒后关闭...");
    sleep(3000);
    console.hide();
}

