// yolov11.js - YOLO 检测与结果处理模块
var config = require("../tmp/config.js");
// --- 常量定义 ---
const YOLO_PLUGIN_NAME = "com.circlefork.yolo"; // 插件包名
const MODEL_SUBDIR = "/yolov11/model";          // 模型文件夹相对于本脚本的路径
const MODEL_NAME = "yzm";                       // 模型名
const MODEL_USE_GPU = true
const MODEL_LABELS = ["面条", "牙齿", "喷漆", "戒指", "汉堡", "双串", "气球", "三星", "四方角", "拉力器",
        "垃圾桶", "纽扣", "保龄球", "吊灯", "蚂蚱", "电脑", "网球", "地雷", "干杯", "猫头鹰",
        "胭脂", "橄榄球", "熊脚印", "锤子", "磁带", "五色球", "打拳击", "拉提琴", "项链模特",
        "吉他", "柜子", "开关", "小杯", "乒乓球拍", "BUG", "鸭子", "鼓", "钱袋", "照相",
        "方蛇", "乌龟", "车钥匙", "蜻蜓", "蜗牛", "两片叶子", "墨水", "小号", "路灯", "蛇",
        "双色帆", "工具箱", "木鱼", "铃铛", "音乐盒", "天平", "怀表", "辣椒", "鹤", "麻脑",
        "电机", "未知02", "小熊", "沙漏", "墓碑", "排球", "讲台", "汽车", "生化", "浴缸",
        "闹钟", "西瓜", "大树", "一枝花", "摩天轮", "吊钩", "别墅", "热水浴缸", "三圆", "飞机",
        "弓箭", "瞳孔", "创可贴", "蝴蝶", "圆柱", "指南针", "飞碟", "苹果", "冰淇淋", "机器人",
        "磁铁", "蒸汽火车", "鹰头", "一个铃铛", "双手提东西", "五环", "打火机", "风力发电", "派大星",
        "鸟嘴", "手掌", "树叶", "火龙", "大炮", "风车", "胡萝卜", "甜筒", "木鱼", "自行车",
        "战斗", "香烟"
    ];         
// --- 模型参数 ---
const DEFAULT_CONF_THRESHOLD = config.confThreshold;           // 默认置信度阈值
const DEFAULT_IMG_SIZE = 640;                  // 默认检测图像尺寸
const tag = "[YOLO模块] ";
// --- 模块级变量 (用于存储初始化状态和实例) ---
let yoloInstance = null;
let isYoloInitialized = false;
/**
 * @description 初始化 YOLO 插件和模型。
 * 该函数在模块首次加载时自动执行一次。
 * @returns {boolean} 初始化是否成功
 */
function initializeYolo() {
    // 防止重复初始化
    if (isYoloInitialized) {
        console.log(tag + " 已初始化，跳过。");
        return true;
    }
    // 如果实例存在但未初始化成功（上次失败），则不再尝试
    if (yoloInstance && !isYoloInitialized) {
         console.warn(tag + " 初始化曾失败，不再尝试。");
         return false;
    }

    console.log(tag + " 正在初始化...");
    try {
        console.log(`${tag} 加载插件 '${YOLO_PLUGIN_NAME}'...`);
        let YoloPlugin = plugins.load(YOLO_PLUGIN_NAME);
        if (!YoloPlugin) {
            throw new Error(`插件 '${YOLO_PLUGIN_NAME}' 加载失败！`);
        }

        yoloInstance = new YoloPlugin();
        console.log(tag + " 插件加载成功，实例已创建。");

        // --- 使用 __dirname 获取模型路径 ---
        const modelPath = files.cwd() + MODEL_SUBDIR;
        console.log(`${tag} 使用模型路径: ${modelPath}`);
        console.log(`${tag} 初始化模型 '${MODEL_NAME}`);

        // 初始化模型
        isYoloInitialized = yoloInstance.init(modelPath, MODEL_NAME, MODEL_USE_GPU, MODEL_LABELS);

        if (!isYoloInitialized) {
            console.error(tag + " yolo.init() 初始化失败！请检查模型路径、名称、标签及插件权限。");
            yoloInstance = null; // 初始化失败，清空实例
            return false;
        }

        console.log(tag + " 初始化成功！");
        return true;

    } catch (error) {
        console.error(`${tag} 初始化过程中发生错误: ${error}`);
        yoloInstance = null; // 出错时清空实例
        isYoloInitialized = false;
        return false;
    }
}

/**
 * @description 对原始检测结果进行排序和处理。
 * 规则: 1. 按Y坐标升序；2. 分为(A组)和(B组)；3. A组按X坐标升序；
 *       4. B组按A组排序后的标签顺序排序；5. 计算B组中心点并格式化输出。
 * @param {Array<object>} data - YOLO 检测原始结果数组，格式: [{x, y, width, height, prob, label}, ...]
 * @returns {Array<object>|null} - 处理后的 B 组结果数组 [{centerX, centerY, prob, label}, ...]，或在失败/无效输入时返回 null。
 */
function sortAndProcessResults(data) {
    // 输入验证
    if (!Array.isArray(data)) {
        console.error("结果处理: 输入数据不是数组。");
        return null;
    }
    let len = data.length
    // 检查数据长度是否满足处理逻辑要求 (4或6)
    if (len !== 4 && len !== 6) {
        console.warn(`结果处理: 预期数据长度为 4 或 6，实际为 ${len}。`);
        return null;
    }


    try {
        // 1. 按 Y 坐标升序排序
        data.sort((a, b) => a.y - b.y);

        // 2. 分组
        let groupA = data.slice(0, len / 2);
        let groupB = data.slice(len / 2);

        // 3. groupA 按 X 坐标升序排序
        groupA.sort((a, b) => a.x - b.x);

        // 4. 获取 groupA 的标签顺序
        let labelOrder = groupA.map(item => item.label);

        // 5. groupB 根据 groupA 的标签顺序排序
        groupB.sort((a, b) => {
            let indexA = labelOrder.indexOf(a.label);
            let indexB = labelOrder.indexOf(b.label);
            // 如果标签不在 labelOrder 中（理论上不应发生，除非模型标签配置错误或检测异常），保持原相对顺序
            if (indexA === -1 || indexB === -1) {
                return 0;
            }
            return indexA - indexB;
        });

        // 6. 格式化 groupB 的结果
        let finalResult = groupB.map(item => {
            let centerX = item.x + (item.width / 2);
            let centerY = item.y + (item.height / 2);
            return {
                centerX: Math.round(centerX),
                centerY: Math.round(centerY),
                prob: parseFloat(item.prob.toFixed(2)), // 保留两位小数
                label: item.label
            };
        });

        return finalResult;

    } catch (error) {
        console.error(`结果处理: 排序或格式化过程中发生错误: ${error}`);
        return null;
    }
}

/**
 * @description 对指定路径的图片执行 YOLO 检测并处理结果。
 * @param {string} imagePath - 要检测的图片文件的绝对路径。
 * @param {number} [confThreshold=DEFAULT_CONF_THRESHOLD] - 置信度阈值 (可选)。 
 * @returns {Array<object>|null} - 处理后的检测结果数组，或在失败时返回 null。
 */
function detectAndProcess(imagePath, confThreshold = DEFAULT_CONF_THRESHOLD,) {
    // 检查初始化状态
    if (!isYoloInitialized || !yoloInstance) {
        console.error(tag + " 未初始化或初始化失败，尝试重新初始化...");
        // 尝试再次初始化
        initializeYolo(); 
        if (!isYoloInitialized || !yoloInstance) return null;
            return null;
    }

    // 检查图片路径
    if (!imagePath || typeof imagePath !== 'string') {
        console.error("检测处理: 无效的图片路径。");
        return null;
    }
     if (!files.exists(imagePath)) {
        console.error(`检测处理: 图片文件不存在: ${imagePath}`);
        return null;
    }

    let img = null;
    try {
        // 读取图片
        console.log(`${tag} 读取图片: ${imagePath}`);
        img = images.read(imagePath); // 使用函数参数 imagePath
        if (!img) {
            console.error(`检测处理: 读取图片失败: ${imagePath}`);
            return null;
        }

        // 执行检测
        console.log(`${tag} 开始检测 (conf: ${confThreshold})...`);
        // 注意：yolo.detect 可能需要 Bitmap 对象，images.read 返回的是 Image 对象
        // 需要确认 yolo.detect 接受的参数类型，如果是 Bitmap，需要 img.bitmap
        let rawResults = yoloInstance.detect(img.bitmap, confThreshold, 0.45, 640);
        console.log(`${tag} 检测完成，原始结果数量: ${rawResults ? rawResults.length : 'N/A'}`);
        //log(rawResults)
        // 处理并返回结果
        return sortAndProcessResults(rawResults);

    } catch (error) {
        console.error(`${tag} 检测过程中发生错误: ${error}`);
        return null;
    } finally {
        // 释放图片资源（如果需要）
        if (img) {
            img.recycle(); // 回收图片对象，防止内存泄漏
        }
    }
}

// --- 模块初始化 ---
// 在模块加载时执行一次初始化尝试
initializeYolo();

// --- 导出功能 ---
// 导出主函数
module.exports = detectAndProcess;
