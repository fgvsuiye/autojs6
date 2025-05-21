/**
 * @version 20250521
 * @description 更新器脚本
 *               自动检查更新并下载更新文件。
 */


console.setSize(0.9, 0.5).show();
console.info(">>>>>>>---| 检查更新 |---<<<<<<<");
var proxy, remoteVersionsData 
var configNeedsMerge = false;
const receiver = engines.myEngine().execArgv;
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
    let ext = files.getExtension(relativePath);
    if (ext != "js") return 23333333
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
 * 获取远程文件的 SHA 值
 * @param {string} scriptPathInRepo - 仓库中的文件路径
 * @returns {string|null} 文件的 SHA 值，失败返回 null
 */
function getRemoteFileSHA(scriptPathInRepo) {
    let apiUrl = "https://api.github.com/repos/fgvsuiye/autojs6/contents/" + scriptPathInRepo;
    try {
        let res = http.get(apiUrl, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'AutoJS-Updater'
            }
        });
        if (res.statusCode == 200) {
            let data = res.body.json();
            return data.sha;
        } else {
            console.error(`获取文件 ${scriptPathInRepo} 的 SHA 失败: HTTP ${res.statusCode}`);
            return null;
        }
    } catch (e) {
        console.error(`获取文件 ${scriptPathInRepo} 的 SHA 异常:`, e);
        return null;
    }
}

/**
 * 将字节数组转换为十六进制字符串
 * @param {byte[]} bytes - 字节数组
 * @returns {string} 十六进制字符串
 */
function bytesToHexString(bytes) {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
        let current = (bytes[i] & 0xFF).toString(16);
        hex += (current.length === 1) ? "0" + current : current;
    }
    return hex;
}


/**
 * 计算文件哈希值（十六进制格式）
 * @param {string} filePath - 文件路径
 * @returns {string|null} 文件的 SHA 值，失败返回 null
 */
function calculateLocalFileSHA(filePath) {
    try {
        if (!files.exists(filePath)) {
            console.error("Git Blob SHA1计算失败: 文件不存在 " + filePath);
            return null;
        }

        // 1. 读取文件所有字节
        let fileBytes = files.readBytes(filePath); // 假设 files.readBytes 返回 byte[]
        if (!fileBytes) {
            console.error("读取文件内容失败: " + filePath);
            return null;
        }

        // 2. 构造 Git Blob 头部
        let headerString = "blob " + fileBytes.length + "\0";
        let headerBytes = new java.lang.String(headerString).getBytes("UTF-8"); // 或者其他合适的编码，UTF-8 通常是安全的

        // 3. 合并头部和文件内容
        let combinedBytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, headerBytes.length + fileBytes.length);
        java.lang.System.arraycopy(headerBytes, 0, combinedBytes, 0, headerBytes.length);
        java.lang.System.arraycopy(fileBytes, 0, combinedBytes, headerBytes.length, fileBytes.length);

        // 4. 计算 SHA-1
        let md = java.security.MessageDigest.getInstance("SHA-1");
        md.update(combinedBytes, 0, combinedBytes.length);
        let digestBytes = md.digest();
        // 5. 转换为十六进制字符串
        return bytesToHexString(digestBytes);

    } catch (e) {
        console.error("计算文件 Git Blob SHA-1 失败: " + filePath, e);
        return null;
    }
}
/**
 * 下载文件并进行 SHA 校验
 * @param {string} scriptPathInRepo - 仓库中的文件路径
 * @param {string} localFullPath - 本地文件路径
 * @returns {boolean} 是否下载成功
 */
function downloadFile(scriptPathInRepo, localFullPath) {
    var downloadUrl = proxy + "https://github.com/fgvsuiye/autojs6/blob/main/" + scriptPathInRepo;
    try {
        // 先获取远程文件的 SHA
        let remoteSHA = getRemoteFileSHA(scriptPathInRepo);
        if (!remoteSHA) {
            console.error(`无法获取远程文件 ${scriptPathInRepo} 的 SHA 值`);
            return false;
        }

        let res = http.get(downloadUrl);
        if (res.statusCode == 200) {
            // 确保目标目录存在
            files.ensureDir(localFullPath);
            let tempPath = localFullPath + ".tmp";
            files.writeBytes(tempPath, res.body.bytes());
            
            // 计算下载文件的 SHA 并验证
            let localSHA = calculateLocalFileSHA(tempPath);
            if (!localSHA) {
                console.error(`计算下载文件 SHA 失败`);
                files.remove(tempPath);
                return false;
            }

            if (localSHA !== remoteSHA) {
                //console.error(`文件 SHA 校验失败: \n本地: ${localSHA}\n远程: ${remoteSHA}`);
                console.error(`文件 ${scriptPathInRepo} SHA 校验失败, 文件可能损坏或不完整`);
                console.error(`请尝试重新运行main.js下载更新或手动下载`);
                files.remove(tempPath);
                return false;
            }

            // SHA 校验通过，重命名文件
            fileName = files.getName(localFullPath);
            files.rename(tempPath, fileName);
            console.log(`文件 ${scriptPathInRepo} 下载成功并通过 SHA 校验`);
            return true;
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
    var configPath = "tmp/config.js"; // 相对于项目根目录的路径
    var updatesPerformedCount = 0;
    try {

        for (let scriptPathInRepo in remoteVersionsData) {
            let remoteVersion = remoteVersionsData[scriptPathInRepo];
            if (typeof remoteVersion !== "number") continue; // 跳过非数字项
            if (scriptPathInRepo === "updater.js") continue; // 跳过更新器自身
            let localVersion = getLocalVersion(scriptPathInRepo);
            let localFullPath = files.join(files.cwd(), scriptPathInRepo);
            if (compareVersions(localVersion, remoteVersion) ) {
                console.log(` ${scriptPathInRepo} 需要更新 (本地: ${localVersion}, 远程: ${remoteVersion})`);
                if (scriptPathInRepo == configPath) {
                    // 特殊处理 config.js
                    if (files.exists(localFullPath)) {
                        configNeedsMerge = true;
                        console.log("发现配置文件需要合并，将在脚本执行完毕后自动合并。");
                        localFullPath = localFullPath + ".txt";
                    }
                    if (downloadFile(scriptPathInRepo, localFullPath)) {
                        console.info(`${configPath} 已下载成功，`);
                        updatesPerformedCount++;
                    } else {
                        console.log(`更新 ${configPath} 失败!`);
                    }
                } else {
                    // 其他文件直接覆盖
                    if (downloadFile(scriptPathInRepo, localFullPath)) {
                        console.info(`${scriptPathInRepo} 更新成功!`);
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

