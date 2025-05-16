/**
 * 配置合并器
 * @version 20250516
 * @description 合并两个配置文件，并保存到本地。
 *              个性化配置项会优先保留本地配置，其他项会优先使用新版配置。
 */


log("开始合并配置文件...");
// 获取需覆盖的配置项
var updateKeys = engines.myEngine().execArgv.updateKeys || [];
var currentDir = files.cwd();
var localConfigPath = files.join(currentDir, "tmp/config.js") 
var newConfigPath = files.join(currentDir, "tmp/config.js.txt");

// 如果找不到指定路径，则使用当前目录
if(!files.exists(localConfigPath)) localConfigPath = currentDir;
if(!files.exists(newConfigPath)) newConfigPath = currentDir;


/**
 * 比较两个对象或值是否相等
 * @param {Object|*} obj1 
 * @param {Object|*} obj2 
 * @returns {boolean} 相等返回true，否则返回false
 */
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (obj1 == null || typeof obj1 !== "object" || obj2 == null || typeof obj2 !== "object") {
        return false;
    }
    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (let key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
}

/**
 * 从配置文件字符串中提取JS对象
 * @param {string} configStr 配置文件字符串
 * @returns {Object|null} JS对象，或null
 */
function getJsObjectFromConfigString(configStr) {
    const match = configStr.match(/var\s+config\s*=\s*(\{[\s\S]*?\});/);
    if (match && match[1]) {
        try {
            return (new Function('return ' + match[1]))();
        } catch (e) {
            console.error("解析JS对象时出错:", e);
            return null;
        }
    }
    console.error("在配置字符串中未找到 'var config = {...};' 结构");
    return null;
}
/**
 * 解析配置文件字符串，提取键、值字符串、注释和结构信息
 * @param {string} configStr 配置文件字符串
 * @returns {Object|null} 包含键、值字符串、注释和结构信息的对象，或null
 */
function parseConfigStructure(configStr) {
    let configBlockMatch = configStr.match(/(var\s+config\s*=\s*\{)([\s\S]*?)(\};[\s\S]*)/);
    if (!configBlockMatch) {
        console.error("无法解析主要的 'var config = { ... };' 结构。");
        return null;
    }
    // 提取头部、对象定义、对象内容和尾部
    let headerContent = configStr.substring(0, configStr.indexOf(configBlockMatch[1]));
    let varDeclarationAndOpeningBrace = configBlockMatch[1]; // "var config = {"
    let objectInnards = configBlockMatch[2]; // {}内部的内容
    let closingBraceAndFooter = configBlockMatch[3]; // "};" 

    let items = [];  // 存储解析后的对象内部项
    let lines = objectInnards.split('\n'); // 按行分割对象内部内容
    let currentKey = null;                 // 当前正在处理的键名
    let currentValueLines = [];            // 当前键对应的多行值
    let currentComment = "";               // 当前行尾注释
    let inMultiLineValue = false;          // 是否正在处理多行值
    let braceCount = 0;                    // 多行值中未匹配的 { 数量
    let bracketCount = 0;                  // 多行值中未匹配的 [ 数量
    // 正则：匹配键值对行，捕获缩进、键名、值和行尾注释部分
    let keyLineRegex = /^(\s*)(['"]?[a-zA-Z0-9\u4e00-\u9fa5_]+['"]?)\s*:\s*(.*)/;
    // 匹配独立注释行或空行
    let commentOrEmptyLineRegex = /^(\s*(\/\/.*|\s*))$/;

    // 当一个项目解析完成后，存入 items 数组
    function finalizeCurrentItem() {
        if (currentKey) {
            let valueString = currentValueLines.join('\n').trimRight();
            if (valueString.endsWith(',')) {
                valueString = valueString.slice(0, -1).trimRight();
            }
            items.push({
                key: currentKey.replace(/['"]/g, ''),  // 去除引号
                valueString: valueString,              // 值的字符串表示
                comment: currentComment.trim(),        // 行尾注释
                indentation: keyIndentation,           // 原始缩进
                isKvPair: true                         // 标记为键值对
            });
        }
        // 重置当前项
        currentKey = null;
        currentValueLines = [];
        currentComment = "";
        keyIndentation = "";
        inMultiLineValue = false;
        braceCount = 0;
        bracketCount = 0;
    }

    // 逐行解析对象内部的内容
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmedLine = line.trim();

        if (!inMultiLineValue) { // 处理非多行值
            let keyMatch = line.match(keyLineRegex);
            if (keyMatch) { // 是键值对的开始
                finalizeCurrentItem(); // 完成上一个项目 
                keyIndentation = keyMatch[1]; // 缩进
                currentKey = keyMatch[2];     // 键名
                let valuePartAndComment = keyMatch[3]; // 值和行尾注释部分
                // 尝试从行尾提取注释
                let commentMatchKv = valuePartAndComment.match(/\s*(\/\/.*)$/);
                if (commentMatchKv) {
                    currentComment = commentMatchKv[1]; // 存储注释
                    valuePartAndComment = valuePartAndComment.substring(0, commentMatchKv.index).trimRight();
                } else {
                    currentComment = ""; // 没有注释
                }
                currentValueLines.push(valuePartAndComment); // 存储值部分

                // 检查值部分是否是多行值
                for (let char of valuePartAndComment) {
                    if (char === '{') braceCount++; else if (char === '}') braceCount--;
                    else if (char === '[') bracketCount++; else if (char === ']') bracketCount--;
                }
                if (braceCount > 0 || bracketCount > 0) { // 多行值
                    inMultiLineValue = true;
                } else { // 单行值
                    finalizeCurrentItem();
                }
            } else if (commentOrEmptyLineRegex.test(line)) { // 是独立注释行或空行
                finalizeCurrentItem(); // 确保之前的键值对已处理
                if (trimmedLine.startsWith('//')) { // 独立注释行
                    items.push({ type: 'commentOnly', line: line });
                } else if (trimmedLine === '') {
                    // 避免非注释内的连续多个空行
                    if (items.length === 0 || items[items.length - 1].type !== 'emptyLine' || (items.length > 0 && items[items.length - 1].line.trim() !== '')) {
                       items.push({ type: 'emptyLine', line: line });
                    }
                }
            } else if (trimmedLine !== "") { // 未识别的行
                finalizeCurrentItem();
                items.push({type: 'unparsed', line: line });
            }
        } else { // 处理多行值
            currentValueLines.push(line); // 直接将行内容添加到当前值的行列表中

            // 更新括号计数以判断多行值是否结束
            for (let char of line) {
                if (char === '{') braceCount++; else if (char === '}') braceCount--;
                else if (char === '[') bracketCount++; else if (char === ']') bracketCount--;
            }
            if (braceCount === 0 && bracketCount === 0) {  // 多行值结束
                if (!currentComment.trim()) { // 如果主键行没有行尾注释，尝试从多行值的最后一行获取
                    let lastValLine = currentValueLines[currentValueLines.length - 1];
                    let commentMatchMulti = lastValLine.match(/\s*(\/\/.*)$/);
                    if (commentMatchMulti) {
                        currentComment = commentMatchMulti[1];
                        currentValueLines[currentValueLines.length - 1] = lastValLine.substring(0, commentMatchMulti.index).trimRight();
                    }
                }
                finalizeCurrentItem(); // 完成多行键值对项
            }
        }
    }
    finalizeCurrentItem(); // 确保最后一个项目被添加

    return {
        header: headerContent,                  // 文件对象定义前的所有内容
        prefix: varDeclarationAndOpeningBrace,  // "var config = {"
        items: items,                           // 对象内部的解析项列表
        suffix: closingBraceAndFooter,          // 从 "};" 开始到文件末尾的所有内容
    };
}


/**
 * 合并配置的核心函数
 * @param {string} localContent 本地配置文件内容
 * @param {string} newContent 新版配置文件内容
 * @param {string[]} keysToUpdateValue 需要更新值的键列表
 * @returns {string} 合并后的配置文件内容
 */
function mergeConfigs(localContent, newContent, keysToUpdateValue) {
    // 1. 解析配置文件
    let localParsed = parseConfigStructure(localContent);
    let newParsed = parseConfigStructure(newContent);

    if (!localParsed || !newParsed) {
        console.log("配置解析失败，无法合并。");
        return localContent;
    }

    // 2. 提取 JS 对象
    let localObj = getJsObjectFromConfigString(localContent);
    let newObj = getJsObjectFromConfigString(newContent);

    if (!localObj || !newObj) {
        console.log("JS对象提取失败，无法合并。");
        return localContent;
    }

    let finalItems = [];
    // 创建本地和新版键值对的Map，以便通过键名快速查找，提高效率
    let localKvMap = new Map(localParsed.items.filter(it => it.isKvPair).map(item => [item.key, item]));
    let newKvMap = new Map(newParsed.items.filter(it => it.isKvPair).map(item => [item.key, item]));
    
    let newItemIndex = 0;

    // 合并对象内部的 item (KV对, 独立注释, 空行)
    while(newItemIndex < newParsed.items.length) {
        let newItem = newParsed.items[newItemIndex];

        if (newItem.isKvPair) { // 新版当前项是键值对
            let key = newItem.key;
            let itemToPush = Object.assign({}, newItem); // 默认使用新版键值对结构

            if (localKvMap.has(key)) { // 本地也存在此键
                let localItem = localKvMap.get(key);
                // 值处理
                let localValue = localObj[key];
                let newValue = newObj[key];
                if (keysToUpdateValue.includes(key) && !deepEqual(localValue, newValue)) {
                    // itemToPush.valueString 已经是 newItem.valueString
                    console.log(`配置项 "${key}": 值已更新为新版。`);
                } else { // 保留本地值
                    itemToPush.valueString = localItem.valueString;
                    if (!keysToUpdateValue.includes(key) && !deepEqual(localValue, newValue)){
                        console.log(`配置项 "${key}": 值保留本地版本。`);
                    }
                }
                // 行尾注释处理: 如果新版有定义行尾注释 ，则用新版的；否则用本地的
                if (typeof newItem.comment === 'string') { // 新版有注释定义
                     if (itemToPush.comment !== newItem.comment && localItem.comment !== newItem.comment) { // 仅当注释确实改变时记录
                        console.log(`配置项 "${key}": 行尾注释已更新为新版 ("${newItem.comment}")。`);
                    }
                    itemToPush.comment = newItem.comment; // 已经是新版的注释
                } else if (localItem.comment) { // 新版无注释，本地有，则用本地的
                    itemToPush.comment = localItem.comment;
                    console.log(`配置项 "${key}": 行尾注释保留本地版本 ("${localItem.comment}")。`);
                } else {
                    itemToPush.comment = ""; // 都没注释
                }
            } else { // 此键为新版新增
                console.log(`新增配置项 "${key}" (来自新版)。`);
            }
            itemToPush.comment = itemToPush.comment || "";
            finalItems.push(itemToPush);
            newItemIndex++;
        } else { // 新版当前项是独立注释、空行或未解析行
            finalItems.push(Object.assign({}, newItem)); // 直接采用新版的独立注释/空行
            newItemIndex++;
        }
    }
    
    // 检查是否有本地独有的KV项，并且这些项在新版中不存在
    for (let [localKey, localKvItem] of localKvMap) {
        if (!newKvMap.has(localKey)) {
            // 检查 finalItems 中是否已存在此key（理论上不应该，因为上面是基于 newParsed.items 遍历）
            if (!finalItems.some(fi => fi.isKvPair && fi.key === localKey)) {
                console.log(`保留本地独有配置项 "${localKey}"。`);
                finalItems.push(Object.assign({}, localKvItem));
            }
        }
    }

    // 3. 重建配置文件字符串
    // 使用新版的头部和尾部
    let output = newParsed.header;
    output += newParsed.prefix + "\n"; // "var config = {" (来自新版)

    for (let i = 0; i < finalItems.length; i++) {
        let item = finalItems[i];
        if (item.type) { // 如果是独立注释、空行或未解析行
            output += item.line + "\n"; // 直接使用原始行内容
        } else if (item.isKvPair) { // 键值对
            let line = item.indentation + item.key + ": " + item.valueString;
            // 添加逗号
            let isLastKvItem = true;
            for (let j = i + 1; j < finalItems.length; j++) {
                if (finalItems[j].isKvPair) { // 检查后面是否还有键值对
                    isLastKvItem = false;
                    break;
                }
            }
            if (!isLastKvItem) {
                line += ",";
            }

            // 添加行尾注释，如果有
            if (item.comment) {
                line += " " + item.comment;
            }
            output += line + "\n";
        }
    }
    output = output.trimRight() + "\n";
    output += newParsed.suffix; // 从 "};" 到文件末尾 (来自新版)

    return output; // 返回合并后的配置文件内容
}

// --- 主程序 (main 函数与之前版本相同) ---
function main() {
    console.show();
    log("开始合并配置文件...");

    if (!files.exists(localConfigPath)) {
        console.error(`错误：本地配置文件 "${localConfigPath}" 不存在！`);
        return;
    }
    if (!files.exists(newConfigPath)) {
        console.error(`错误：新版配置文件 "${newConfigPath}" 不存在！`);
        return;
    }

    let localFileContent = files.read(localConfigPath);
    let newFileContent = files.read(newConfigPath);

    if (!localFileContent || !newFileContent) {
        console.error("读取配置文件内容失败！");
        return;
    }

    // 合并
    let mergedConfigContent = mergeConfigs(localFileContent, newFileContent, updateKeys);
    
    // 直接覆盖本地配置文件
    files.write(localConfigPath, mergedConfigContent);
    log(`配置文件合并完成！结果已保存到: ${localConfigPath}`);
    // 删除下载的新版配置文件
    files.remove(newConfigPath);
}
main();