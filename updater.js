/**
 * @version 20250514
 * 更新器脚本
 */


console.info(">>>>>>>---| 检查更新 |---<<<<<<<");

var proxy
setProxys();
function setProxys() {
    github = "https://github.com/fgvsuiye/autojs6/blob/main/version.json"
    proxys = [
        "https://github.moeyy.xyz/", 
        "https://gh-proxy.com/", 
        "https://gh.llkk.cc/",
        "https://git.886.be/",
        "https://ghfast.top/",
        "https://gh-proxy.ygxz.in/",
        "https://github.fxxk.dedyn.io/",
    ];
    for (let i = 0; i < proxys.length; i++) {
        url = proxys[i] + github
        if(webTest([url])){
            proxy = proxys[i]
            break;
        }
    }
}

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

/**
 * 链接可用测试
 * @param {Array} urllist - 需要测试的链接列表
 * @returns {string} 可用的链接，或 false
 */
function webTest(urllist) {
    log("开始测试链接");
    for (let j = 0; j < urllist.length; j++) {
        url = urllist[j];
        try {
            let url_res = http.get(url);
            if (url_res.statusCode == 200) {
                //console.log("链接:"  + urllist[j] + "可用"]);
                return url
            }
        } catch (e) {
            log("链接:"  + urllist[j] + " 连接失败");
        }
    }
    return false;
}

function downloadFile(scriptPathInRepo, localFullPath) {
    var downloadUrl = proxy + "https://github.com/fgvsuiye/autojs6/blob/main/" + scriptPathInRepo + "?timestamp=" + new Date().getTime();
    console.log(`准备下载: ${scriptPathInRepo}`);
    try {
        let res = http.get(downloadUrl);
        if (res.statusCode == 200) {
            // 确保目标目录存在
            files.ensureDir(localFullPath);
            // 下载到临时文件，成功后再重命名，防止更新中断导致文件损坏
            let tempPath = localFullPath + ".tmp";
            files.write(tempPath, res.body.string());
            if (files.exists(tempPath)) { // 简单校验
                fileName = files.getName(tempPath);
                finName = fileName.split(".")[0] + "." + fileName.split(".")[1];
                files.rename(tempPath, finName) ; // 覆盖原文件
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
    let urllist = [
        "https://github.moeyy.xyz/https://github.com/fgvsuiye/autojs6/blob/main/version.json",
        "https://gitee.com/kuandana/autojs6/raw/master/version.json"
    ];
    var configPath = "/tmp/config.js"; // 相对于项目根目录的路径
    let updatesPerformedCount = 0;
    let url = webTest(urllist);
    if (!url) {
        console.error("检查更新失败：无法连接到配置文件仓库。");
        return;
    }
    try {
        let res = http.get(url);
        if (res.statusCode == 200) {
            let remoteVersionsData = res.body.json();
            if (!remoteVersionsData) {
                console.error("无法解析远程版本信息 versions.json");
                return;
            }
            //console.log("远程版本信息:", JSON.stringify(remoteVersionsData));
            for (let scriptPathInRepo in remoteVersionsData) {
                let remoteVersion = remoteVersionsData[scriptPathInRepo];
                let localVersion = getLocalVersion(scriptPathInRepo);
                let localFullPath = files.join(files.cwd(), scriptPathInRepo);
                if (scriptPathInRepo === "updater.js") continue; // 跳过更新器自身
                if (compareVersions(localVersion, remoteVersion) ) {
                    console.log(`需要更新: ${scriptPathInRepo} (本地: ${localVersion}, 远程: ${remoteVersion})`);
                    if (scriptPathInRepo == configPath) {
                        // 特殊处理 config.js
                        if (files.exists(localFullPath)) {
                            fileName = files.getName(localFullPath) + ".bak";
                            files.rename(localFullPath, fileName);
                            console.log(`备份旧 ${configPath} 到 ${fileName}`);
                        }
                        if (downloadFile(scriptPathInRepo, localFullPath)) {
                            console.error(`${configPath} 已更新为最新默认配置。请检查备份并合并您的设置。`);
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
                console.log(`共 ${updatesPerformedCount} 个文件已更新。部分更新可能需要重启脚本才能生效。`);
            } else {
                console.log("所有受管理的文件已是最新或未找到更新目标。");
            }

        } else {
            console.error("获取 versions.json 失败:", res.statusMessage);
        }
    } catch (e) {
        console.error("更新异常:", e);
    } finally {
        console.log("Updater.js 执行完毕。");
    }
}

// 执行更新
performUpdates();
engines.stopAllAndToast(); 