/*

*****小米社区自动签到脚本*****

原作者  by：PJ小宇    QQ：898811295
修改    by：风中拾叶

*/

// 引入配置文件
var config = require("./config.js");
run();//计时
curTime = new Date();
date = curTime.getFullYear() + "-" + (curTime.getMonth() + 1).toString().padStart(2, '0') + "-" + curTime.getDate();

setScaleBases(1080, 2400);
//var percentage;
var dwidth = device.width;
var dheight = device.height;
log(`今天是：${date}`);
log(`设备分辨率：${dwidth}x${dheight}`);
main();

//解锁
function unLock() {
    log(">>>>>>>---|解锁设备|---<<<<<<<");
    js = config.解锁方式;
    ran = random(-300,300)
    if (js == 1 || js == 2){
        wait(() => {
            swipe(dwidth*1/2, dheight*0.7+ran, dwidth*1/2, dheight*1/2+ran, 150)
            return textContains("紧急呼叫").findOne(2000)
        },5,500,{
            then(){
                log("上滑成功")
            },
            else(){
                log("未找到解锁界面，签到退出")
                exit()
            },
        });
    }else{
        swipe(dwidth*1/2, dheight*0.7+ran, dwidth*1/2, dheight*1/2+ran, 150)
    }
    sleep(1000);
    if (js == 1) {
        log("图案解锁");
        gesture(800, config.锁屏图案坐标);
    } else if (js == 2) {
        log("数字密码解锁");
        for (let i = 0; i < config.锁屏数字密码.length; i++) {
            desc(config.锁屏数字密码[i]).findOne().click();
        }
    }
    log("解锁成功");
}

//关闭程序
function killAPP(packageName){
    wait(() => {
        app.openAppSetting(packageName)
        return textContains("结束运行"||"强行停止").findOne(2000);
    },2,500,{
        then(){
            click("结束运行"||"强行停止");
            if (textContains("确定").findOne(1500)) {
                click("确定");
                log("结束小米社区");
            }else{
                log("程序未运行");
            }
            sleep(500);
        },
        else(){
            log("未找到结束运行按钮，退出");
        },
    });
}

//重启应用
function restart(){
    killAPP("com.xiaomi.vipaccount");
    sleep(500);
    log("打开小米社区");
    app.launchApp("小米社区");
    if (textContains("想要打开").findOne(1000)) click("允许");
    sleep(1000);
}

//浏览帖子
function posts(){
    log(">>>>>>>---|浏览帖子|---<<<<<<<")
    var regex = /((0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9]))|(0[0-9]|1[0-9]|2[0-3])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/;
    var textView
    wait(() => {
        textView = className("android.widget.TextView").depth("18").textMatches(regex).clickable(true).findOne(8000); 
        let page = className('ImageView').desc('编辑导航栏顺序').exists();
        sleep(1000);
        if (page && textView) {
            log("找到帖子页面");
            return true;
        } else {
            log("未找到帖子页面,尝试重启应用");
            restart();
            return false;
        }
    }, 3, 1000, {
        then(){
            wait(() => {
                log("尝试打开帖子");
                textView.click();
                return className("android.widget.TextView").textContains("收藏").findOne(2000) || textContains("说说你的想法").exists();
            }, 3, 1000, {
                then(){
                    log("打开帖子成功,开始浏览");
                    sleep(13000);
                    log("浏览10秒完成");
                    back();
                },
                else(){
                    log("打开帖子失败");
                }
            });
        },
    })
}

function upload() {
    log("开始截图");
    sleep(2000);
    var pic = images.clip(captureScreen(), cXy(config.x), cYx(config.y), cXy(config.width), cYx(config.height));
    images.save(pic, "/storage/emulated/0/脚本/pic.png", "png", 100);
    log("截图成功,上传图片");
    var res1 = http.postMultipart(config.url, {
        file: ["0.jpg", "/storage/emulated/0/脚本/pic.png"]
    });
    log("上传图片成功,等待结果");
    return res1
}

function newSign()  {
    if (!images.requestScreenCapture()) {
        toastLog("请求截图失败！");
        exit();
    }
    className("android.widget.TextView").text("立即签到").findOne().click();
    sleep(1000);
    for (let i = 0; i < 2; i++) {
        log("开始第" + (i+1) + "次申请");
        let res = upload();
        if (res.statusCode == 200) {
            log("分析结果")
            clickPic(res.body.json());
            break;
        }else if (res.statusCode == 500) {
            log("错误：");
            log(res.body.string());
        }else{
            log("web服务器错误，请稍后再试");
        }
        textContains("请点击此处重试").findOne(1000).click();
    }
    
}
// 点击图标
function clickPic(list) {
    for (let i = 0; i < list.length; i++) {
        x = list[i][0] + cXy(130)
        y = list[i][1] + cYx(675)
        let icon = list[i][2]
        log("点击第" + (i+1) + "个图标：" + icon)
        click(x, y)
        sleep(1000)
    }
    log("图标点击完成")
    click("提交答案")
    sleep(1000)
    if (textContains("已签到").findOne(3000)) log("签到成功")
}


//拔萝卜活动
function see(){
    log(">>>>>>>---|萝卜活动|---<<<<<<<");
    swipe(500, 1500, 700, 500, 800)
    var button = textContains("去看看").findOne(1500);
    if (button) {
        button.click();
        log("拔萝卜活动签到");
        sleep(500);
        back();
    }else{
        log("未找到'去看看'按钮");
    }
}

//米粉节活动
function fans() {
    log(">>>>>>>---|米粉活动|---<<<<<<<")
    var button = className("android.widget.Button").text("去参与").findOne(1000);
    if (button) {
        button.click();
        log("打开米粉节活动")
        var dianl = className("android.widget.Button").text("点亮今日足迹").findOne(1200);
        var chouka = className("android.widget.Button").text("抽取今日祝福").findOne(1200);
        if (dianl || chouka){
            clickAndLog(dianl || chouka);
            back();
        } else {
            console.log("未找米粉节参与按钮");
        }
    }else {
        log("未找到'去参与'按钮");
    }       
}

//米粉节活动按钮
function clickAndLog(button) {
    if (button) {
        button.click();
        console.log("点击了按钮: " + button.text());
        button2 = className("android.widget.Button").text("抽取今日祝福").clickable(true).depth(20).findOne(1200).click();
        if (button2){
            log("今日祝福已抽取");
        }
    } else {
        log("按钮为空，无法点击");
    }

}

//观看视频
function watchVideo(){ 
    log(">>>>>>>---|视频任务|---<<<<<<<")  
    var watch = className("android.widget.Button").text("去浏览").findOne(1000); //查找'去浏览'按钮 
    if (watch) { 
        var randomsleep = random(10000,15000);
        var stime = new Date().getTime(); //记录开始时间 
        var lastprinttime = -1;
        var randomgesture = random(-100,100); 
        watch.click(); 
        log("开始浏览视频"); 
        while(true){             
            var spendTime = Math.floor((new Date().getTime() - stime) / 1000) / 60;  //计算已观看时间   
            var watchtime = Math.floor(spendTime);
            if (watchtime !== lastprinttime && watchtime !== 5 && watchtime !== 0) { 
                log(`已观看${watchtime}分钟`); 
                lastprinttime = watchtime;
            } 
            sleep(randomsleep);
            gesture(200, [540 + randomgesture, 1900 + randomgesture], [540 + randomgesture, 1200 + randomgesture]);    
            if (spendTime >= 5) { 
                log("已观看5分钟，退出"); 
                back();
                break;
            } 
        }        
    } 
    else { 
        log("未找到'去浏览'按钮"); 
    } 
} 

//成长值
function level() { 
    log(">>>>>>>---|今日明细|---<<<<<<<");
    button = className("android.widget.TextView").text("社区成长等级").findOne(2000); 
    if (button){ 
        button.click(); 
        sleep(1000)
        var name1, value1;
        var sum = 0;
        today = date.replace(/-/g, "\/");
        let view = className("android.widget.TextView").textContains(today).find(2000);
        if (view){
            view.forEach(function(v){
                name1 = v.previousSibling().text();
                value1 = v.nextSibling().text();
                log((name1+":").padEnd(20,' ')  + String(value1).padStart(5,' '));
                sum += parseInt(value1);
            });
        }else{
            log("没有找到");
        }
        log(("今日总计:").padEnd(20,' ')  + String(sum).padStart(5,' '));
        var num = className("android.widget.TextView").textContains("成长值").depth(13).indexInParent(1).findOne(3000)
        if (num) { 
            var num1 = num.text().split(" ")[1].split("/")[0]; 
            var numValue = parseInt(num1); 
            log(("当前成长值:").padEnd(20,' ')  + String(numValue).padStart(5,' '));
            log("-".repeat(29));
            files.append("/sdcard/pictures/level.txt", "\n" + date + "：+" + sum + "\n" + "当前成长值：" + numValue); 
            sleep(500); 
        } else { 
            log("未找到成长值"); 
        } 
    } else { 
        log("未找到'社区成长等级'按钮");
    } 
} 

//签到+1概率
function logpercentage(){
    var percentageUi = className("android.widget.TextView").textContains("当前签到+1的概率：").findOne(3000)
    if(percentageUi){
        var percentageText = percentageUi.text()
        var regex = "\\d{1,3}(?:\\.\\d{1,3}?%)";
        var percentage = percentageText.match(regex)[0]
        log("当前签到+1的概率：" + percentage)
        return percentage;
    }else{
        log("未找到签到概率")
    }
    
}
//加入圈子活动
function join(){
    log(">>>>>>>---|入圈活动|---<<<<<<<")
    let qujiaru = className("android.widget.Button").text("去加入").findOne(3000)
    if(qujiaru){
        qujiaru.click()
        let join = className("android.widget.Button").text("加入圈子").findOne(3000).click()
        join ? log("加入圈子成功") : log("未找到加入按钮")
        sleep(2000)
        back()
    }else{
        log("未找到'加入圈子'按钮")
    }
}

//双旗舰活动
function 活动1() {
    log(">>>>>>>---|旗舰活动|---<<<<<<<")
    cj = className("android.widget.Button").text("去参加").findOne(5000)
    if(cj){
        cj.click()
        let register = className("android.widget.Button").text("立即报名").findOne(2000)
        if(register){
            sleep(1000)
            let checkBox = register.parent().child(1).click()
            if(checkBox){
                register.click()
                sleep(2000)
                let x = dwidth * 0.74
                let y = dheight * 0.94
                click(x,y)
                sleep(1000)
                }
        }
        解锁()
        sleep(1000)
        log("完成双旗舰活动")
        back()
    }else{
        log("未找到活动入口")
    }
}

//感恩季活动
function ganenji(){
    log(">>>>>>>---|感恩活动|---<<<<<<<")
    let qucanyu = className("android.widget.Button").text("去参与").findOne(3000).click();
    if(qucanyu){
        sleep(1000)
        解锁()
        sleep(1000)
    back()
    sleep(1000)
    }else{
        log("未找到活动入口")
    }
    
}

function 解锁() {
    let jpso = className('TextView').text('可解锁').find()
    let count = className("android.widget.Button").text("去提升").findOne(3000).parent().child(1).text()
    if (jpso.size() > 0 && count > 0) {
        for (i = 0; i < jpso.size(); i++) {
            var control = jpso.get(i);
            if(count < 1){
                log("解锁次数不足")
                break;
            }
            control.click();
            log("第" + (i+1) + "次解锁");
            sleep(1000)
            let xuanyao = className("android.widget.Button").text("炫耀一下").findOne(1000);
            let tisheng = className("android.widget.TextView").text("等待解锁").depth(15).findOne(1000)
            if(xuanyao){
                xuanyao.parent().child(5).click()
            }else if(tisheng){
                tisheng.parent().child(6).click()
            }
            sleep(1000)
            if(className("android.widget.TextView").text("可获得1次解锁机会").exists()){
                log("解锁次数不足")
                break
            }
        }
    } else {
        console.log("今日无解锁次数");
    }
}

//小程序签到
function 小程序签到() {
    log(">>>>>>>---|程序签到|---<<<<<<<");
   /*  wait(() => {
        home();
        return desc("第3屏").findOne(2000)
    }, 5, 1000);
    log("进入第3屏页面");
    sleep(1000);
    wait(() => {
        if (config.坐标点击) {
            click(config.x, config.y);
        } else {
            var text1 = packageName('com.miui.home').textContains("小米社区").findOne(1000);
            text1 ? text1.click() : toastLog("正在寻找小程序入口");
        }
        return className("android.widget.TextView").text("论坛").findOne(5000) && className("android.widget.TextView").text("我的").findOne(5000)
    }, 5, 1000);
    log("进入小程序"); */

    var qwx = className("android.widget.Button").text("去微信").findOne(5000);
    if (qwx) {
        qwx.click();
    } else {
        toastLog("未找到去微信按钮，请升级社区app版本");
        return; 
    }
    sleep(1000);
    wait(() =>{ 
        let wd = id("a0g").className("android.widget.TextView").text("我的").findOne(500)
        if(wd && !wd.click()){
          click(dwidth * 0.75, dheight * 0.95)
        }
        return text('编辑资料').findOne(2000)
    }, 5, 1000,{
        then:() => {
            sleep(1000)
            let signed = className("android.widget.TextView").text("已签到")
            if(signed.exists()){
                log("小程序已签到")
            }else{
                let qd = className("android.widget.TextView").text("去签到").findOne(15000)
                if (qd) {
                    log("点击去签到");
                    while (!signed.exists()) {
                        qd.click();
                        sleep(500)
                    }
                }
                log("完成小程序签到")
            }
            launchApp("小米社区");
            sleep(1000)
        },
        else:() => {
            console.log("未找到我的页面");
        }
    })
}


//跳过广告
function skipAd() {
    let adCloseBtn = className("android.widget.ImageView").desc("关闭").findOne(3000);
    if (adCloseBtn) {
        adCloseBtn.click();
        log("跳过了广告");
    }
}

function clickcenter(obj){
    let x = obj.centerX()
    let y = obj.centerY()
    //log(x,y)
    click(x,y)
}

//运行时间
function run() { 
    threads.start(function(){ 
        starttime = new Date().getTime(); 
        setInterval(function(time){ 
            endtime = new Date().getTime(); 
            let runtime = Math.floor((endtime - time) / 1000) 
            //log("运行时间：" + runtime + "秒"); 
            if ( runtime >= config.totaltime ){ 
                log("脚本运行超时，即将退出"); 
                exit(); 
            } 
        },10000,starttime) 
    })
} 

function sign(){
    log(">>>>>>>---|开始签到|---<<<<<<<");
    var done = textContains("已签到").findOne(3000);
    if (done){        
        log("今日已签到");  
    }
    else{
        newSign();
    }
}

//失败重试
function signView(){
    let sign = className("android.widget.ImageView").desc("签到").findOne(10000);
    if (sign) sign.click();
    let xz = textContains("社区勋章").findOne(5000);
    let dj = textContains("社区成长等级").findOne(5000);
    if(xz && dj){
        log("当前为签到页面");
        return true;
    }else{
        log("未找到签到页面");
        log("尝试重启应用");
        restart();
        return false;
    }
}

//主程序
function main() {
    if (!device.isScreenOn()) {
        log("设备已锁定");
        while (!device.isScreenOn()){            
            device.wakeUp()
            sleep(100)
        }
        sleep(500);
        unLock();
    }
    restart();
    skipAd(); 
    if (config.浏览帖子) posts();
    wait(() => signView(), 3, 1000,{
        then(){
            //percentage = logpercentage();
            sign();
            // 按配置启用功能
            if (config.双旗舰) 活动1();
            if (config.加入圈子) join();
            if (config.小程序签到) 小程序签到();
            if (config.感恩季) ganenji();
            if (config.拔萝卜) see(); 
            if (config.成长值记录) level();
            if (config.米粉节) fans();
            if (config.观看视频) watchVideo();
            killAPP("com.xiaomi.vipaccount");
            home();
            log("全部操作已完成");
        },
        else(){
            log("找不到签到页面，即将退出。");
        }
    });
    exit();
}
