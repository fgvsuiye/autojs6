/**
 * @version 20250612
 * 小米社区签到脚本配置文件 
 */

var config = {
    // 解锁配置
    解锁方式: 1,           // 解锁方式：1=图案解锁, 2=数字密码, 其他=上滑解锁
    锁屏数字密码: "000000", // 数字密码（解锁方式=2时生效）
    锁屏图案坐标: [         // 图案解锁坐标（解锁方式=1时生效）
        [284, 1479],      
        [540, 1479],    //每个中括号内代表一个点位的x和y坐标 
        [540, 1732],    //添加或减少点位数量时，注意遵循原格式。
        [284, 1987],
        [540, 1987],
        [792, 1987]
    ],
    
    // 功能开关（1 = 启用, 0 = 禁用）
    小程序签到: 1,
    成长值记录: 1,  
    浏览帖子: 1,
    加入圈子: 0,     
    观看视频: 0,   
    米粉节: 0,    
    感恩季: 1,
    双旗舰: 1,
    拔萝卜: 1,
    检查更新: 1,
    更新间隔: 3, // 单位：天
    推送至微信 : 2, // 1 = 通过 ServerChan 推送消息到微信, 2 = 通过 PushPlus 推送消息到微信, 其它 = 不推送
    serverChanToken : "", // ServerChan Token (推送至微信 = 1 时必填)
    pushPlusToken : "",   // PushPlus Token (推送至微信 = 2 时必填)


    // 其他配置
    confThreshold : 0.7,                    // 最低置信度
    packageName : "com.xiaomi.vipaccount",  // 小米社区包名
    yoloModelPath : "./yolov11/yolov11.js", // YOLOv11 模块路径
    capturePicPath : "./tmp/pic.png",       // 验证码截图路径
    levelRecordPath : "./tmp/level.txt",    // 成长值记录路径
    defaultTimeout : 5000,                  // 默认查找超时时间 (ms)
    shortTimeout : 2000,                    // 较短超时时间
    retryTimes : 3,                         // 主要操作的重试次数
    totaltime: 200                          //脚本运行时长限制(单位: 秒)

};

module.exports = config; // 导出配置
