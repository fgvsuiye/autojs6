
// 新版本 main.js 下载后保存的临时路径
var newScriptPath = files.join(files.cwd(), "main.js.new");
var oldScriptPath = files.join(engines.myEngine().cwd(), "main.js");

log("更新器脚本 (updater.js) 已启动");
log("临时文件路径: " + newScriptPath);
log("目标文件路径: " + oldScriptPath);

// 检查所需文件是否存在
if (!files.exists(newScriptPath)) {
    toastLog("错误：未找到下载的更新文件 " + newScriptPath);
    exit();
}
if (!files.exists(oldScriptPath)) {
    // 如果目标 main.js 路径不正确，这里会报错
     toastLog("错误：未找到目标主脚本文件 " + oldScriptPath + "，请检查路径配置！");
     exit();
 }

// 短暂等待，确保 main.js 已退出并释放文件锁
log("等待 2 秒以确保主脚本退出...");
sleep(2000); 

try {
    // 重命名旧脚本文件
    files.rename(oldScriptPath, oldScriptPath + ".bak");
    console.log("旧脚本已备份为 " + oldScriptPath + ".bak");

    // 执行替换操作 (files.copy 会覆盖目标文件)
    log("开始替换文件...");
    var result = files.copy(newScriptPath, oldScriptPath);

    if (result) {
        log("文件替换成功!");
        toast("更新完成！请重新运行主脚本。");

        // 清理下载的临时文件
        log("清理临时文件: " + newScriptPath);
        files.remove(newScriptPath);

    } else {
        log("文件替换失败！请检查权限或文件是否被占用。");
        toast("更新失败！未能替换主脚本。");
    }

} catch (error) {
    var errorMsg = "替换文件时发生错误: " + error;
    log(errorMsg);
    toast(errorMsg);
}
log("更新器脚本执行完毕。");
