/*

*****小米社区自动签到脚本*****

原作者  by：PJ小宇    QQ：898811295
修改    by：风中拾叶

*/

// 引入配置文件
var config = require("./config.js");

run();//计时
curTime = new Date();
date = curTime.getFullYear() + "-" + (curTime.getMonth() + 1) + "-" + curTime.getDate();
sleep(500);
var centerX;
var centerY;
var rX;
var percentage;
var dwidth = device.width;
var dheight = device.height;
log(`今天是：${date}`);
log(`设备分辨率：${dwidth}x${dheight}`);
main();

//解锁
function unLock() {
    device.keepScreenOn(3600 * 1000);
    log("开始解锁设备");
    sleep(1000);
    wait(() => {
        ran = random(-300,300)
        swipe(dwidth*1/2, dheight*0.7+ran, dwidth*1/2, dheight*1/2+ran, 150)
        sleep(1000)
        return textContains("紧急呼叫").exists()
        },10,200,{
            then(){
                log("上滑成功")
            },
            else(){
                log("未找到解锁界面，签到退出")
                exit()
            },
    });
    sleep(1000);
    if (config.解锁方式 == 1) {
        log("图案解锁");
        gesture(800, config.锁屏图案坐标);
    } else if (config.解锁方式 == 2) {
        log("数字密码解锁");
        for (let i = 0; i < config.锁屏数字密码.length; i++) {
            desc(config.锁屏数字密码[i]).findOne().click();
        }
    }
}
//关闭程序
function killAPP(packageName){
    app.openAppSetting(packageName)
    wait(() => textContains("结束运行"||"强行停止").exists(),10,500,{
        then(){
            log("结束运行");
            click("结束运行"||"强行停止");
            while(click("确定"));
            log("结束小米社区");
            sleep(500);
        },
        else(){
            log("未找到结束运行按钮，退出");
        },
    });
    app.launch(packageName)
    log("打开小米社区");
}

//浏览帖子
function posts(){
    log("开始浏览帖子")
    let page = className('ImageView').desc('编辑导航栏顺序').findOne(20000);
    if(page){
        var regex = /((0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9]))|(0[0-9]|1[0-9]|2[0-3])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/;
        var textView = className("android.widget.TextView").depth("18").textMatches(regex).clickable(true).findOne(2000); 
        let pkly = className("android.widget.ImageView").desc("评论").clickable(true).findOne(2000)
        if (textView || pkly) { 
            textView.click() || pkly.click();
        }else{
            log("页面错误")
            return;
        }
        log("打开帖子");
        sleep(13000);
        log("浏览10s完成");
        back();
    }else{
        log("未找到帖子页面")
        return;
    }
}

//寻找坐标
function findCenter() {
    textContains("立即签到").findOne(5000).click();
    log("开始签到");
    if (!images.requestScreenCapture()) {
        log('请求截图失败');
        exit();
    } 
    sleep(5000)
    var pictures2 = images.clip(captureScreen(),0,0,dwidth,dheight);
    images.save(pictures2,"/sdcard/Pictures/pictures2.png","png",100);
    var img2 =images.read("/sdcard/Pictures/pictures2.png");
    var wx = images.read("/sdcard/Pictures/hk.png");
    //截图并找图
    var p = findImage(img2, wx, {
        //region: [0, 50],
        threshold: 0.8
    });
    if (p) {
        // 计算小图在大图中的中心坐标
        centerX = p.x+ wx.width/2;
        centerY = p.y + wx.height/2;
        rX = p.x+ wx.width*3/4;
        pY = p.y
        // 显示找到的小图中心坐标
        log("找到滑块中心坐标：(" + centerX + ", " + centerY + ")");
        img2.recycle();
        wx.recycle();
        qd();//开始签到
    } 
    else {
        log("没有找到滑块");
    }
    sleep(1000);
}

//签到
function qd() {
    var len;   
    var con = config.con;
    var sta = "10(0{"+con+",})1"
    if (!images.requestScreenCapture()) {
        log('请求截图失败');
        exit();
    }
    var img2 =images.read("/sdcard/Pictures/pictures2.png");
    var pictures = images.clip(img2,rX,dheight*1/3+30,dwidth*5/6-rX,pY-dheight*1/3-30);
    images.save(pictures,"/sdcard/Pictures/pictures.png","png",100);
    img2.recycle();
    var img =images.read("/sdcard/Pictures/pictures.png");
    var result =images.inRange(img,"#000000","#858585")
    images.save(result,"/sdcard/Pictures/result.png", "png", 100);
    img.recycle();
    var image = images.read("/sdcard/Pictures/result.png");
    var path ="/sdcard/Pictures/test.txt";
    if (files.exists(path)) {
        files.write(path, "");
    }
    var width = image.getWidth();
    var height = image.getHeight();
    for (let i = 1; i<height; i+=4){
        var s="";
        for (let j = 1; j<width; j+=2){
            var number = images.pixel(image, j, i);
            var color = colors.toString(number);
            var ss = color == "#000000"?1:0;
            s+= ss;
        }
        files.append(path, s +"\n");
        var matches = s.match(new RegExp(sta,"g"));
        if (matches) {
            var sum = 0;
            for (let i = 0;i < matches[0].length;i++){
                if ( matches[0][i] == 0 ){
                    sum += 1
                }
            }
            log("缺口长度为" + sum)
            length = matches[0].length - 1;
            image.recycle();
            break;
        }
    }
    len =-1;
    let index = s.indexOf(matches);
    if (index >-1){
        len = rX+index*2+length;
        log("缺口中心:"+len);
    }
    if (len > -1) {
        log("开始模拟滑动");
        let random1 = parseInt(random(-5,5))
        let xyDis = len - centerX;
        let sx = centerX + random1;
        let ex = sx + xyDis;
        let sy = centerY + random1;
        let ey = centerY + parseInt(random(-30,30));
            log("贝塞尔曲线滑动");
            swipeBezierzier(sx, sy, ex, ey);
        
        var done = textContains("已签到").findOne(4000);
        if (done) {
            notice('签到完成','签到成功啦');
            log("签到完成");
            return;
        } else{
            log("签到失败1");  
            notice('签到失败','签到遇到问题，请重新签到');
        }
    }
    else{
        log("签到失败2");
    }
}

// 贝塞尔曲线滑动
function swipeBezierzier(sx, sy, ex, ey){
    function bezierCreate(x1,y1,x2,y2,x3,y3,x4,y4){
        //构建参数
        var h=100;
        var cp=[{x:x1,y:y1+h},{x:x2,y:y2+h},{x:x3,y:y3+h},{x:x4,y:y4+h}];
        var numberOfPoints = 100;
        var curve = [];
        var dt = 1.0 / (numberOfPoints - 1);

        //计算轨迹
        for (var i = 0; i < numberOfPoints; i++){
            var ax, bx, cx;
            var ay, by, cy;
            var tSquared, tCubed;
            var result_x, result_y;
        
            cx = 3.0 * (cp[1].x - cp[0].x);
            bx = 3.0 * (cp[2].x - cp[1].x) - cx;
            ax = cp[3].x - cp[0].x - cx - bx;
            cy = 3.0 * (cp[1].y - cp[0].y);
            by = 3.0 * (cp[2].y - cp[1].y) - cy;
            ay = cp[3].y - cp[0].y - cy - by;
        
            var t=dt*i
            tSquared = t * t;
            tCubed = tSquared * t;
            result_x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0].x;
            result_y = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0].y;
            curve[i] = {
                x: result_x,
                y: result_y
            };
        }
    
        //轨迹转路数组
        var array=[];
        for (var i = 0;i<curve.length; i++) {
            try {
                var j = (i < 100) ? i : (199 - i);
                xx = parseInt(curve[j].x)
                yy = parseInt(Math.abs(100 - curve[j].y))
            } catch (e) {
                break
            }
            array.push([xx, yy])
        }

        return array
    }
   
    function randomSwipe(sx,sy,ex,ey){
        //设置随机滑动时长范围
        var timeMin=1000
        var timeMax=2200
        //设置控制点极限距离
        var leaveHeightLength=60
        //log([sx, sy, ex, ey]);
        if(Math.abs(ex-sx)>Math.abs(ey-sy)){
            var my=(sy+ey)/2
            var y2=my+random(0,leaveHeightLength)
            var y3=my-random(0,leaveHeightLength)
        
            var lx=(sx-ex)/3
            if(lx<0){lx=-lx}
            var x2=sx+lx/2+random(0,lx)
            var x3=sx+lx+lx/2+random(0,lx)
        }else{
            var mx=(sx+ex)/2
            var y2=mx+random(0,leaveHeightLength)
            var y3=mx-random(0,leaveHeightLength)
        
            var ly=(sy-ey)/3
            if(ly<0){ly=-ly}
            var y2=sy+ly/2+random(0,ly)
            var y3=sy+ly+ly/2+random(0,ly)
        }
    
        //获取运行轨迹，及参数
        var time=[0,random(timeMin,timeMax)]
        var track=bezierCreate(sx,sy,x2,y2,x3,y3,ex,ey)

        // log("随机控制点A坐标："+x2+","+y2)
        // log("随机控制点B坐标："+x3+","+y3)
        // log("随机滑动时长："+time[1])

        //滑动
        gestures(time.concat(track))
    }
    randomSwipe(sx,sy,ex,ey)
}

//拔萝卜活动
function see(){
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
    button = className("android.widget.TextView").text("社区成长等级").findOne(1500); 
    if (button){ 
        button.click(); 
        sleep(1000)
        var a = readfile("/sdcard/pictures/level.txt"); 
        var num = className("android.widget.TextView").textContains("成长值").depth(13).indexInParent(1).findOne(3000)
        if (num) { 
            var num1 = num.text().split(" ")[1].split("/")[0]; 
            var numValue = parseInt(num1); 
            var b = numValue - a; 
            log("今日获得成长值：" + b); 
            //notice("今日获得成长值：" + b); 
            log("当前成长值：" + numValue); 
            files.append("/sdcard/pictures/level.txt", "\n" + date + "：+" + b + "     签到+1的概率：" + percentage + "\n" + numValue); 
            sleep(500); 
        } else { 
            log("未找到成长值"); 
        } 
    } else { 
        log("未找到'社区成长等级'按钮");
    } 
} 

//成长值文件
function readfile(filePath) { 
    if (!files.exists(filePath)) { 
        files.createWithDirs(filePath); // 如果文件不存在则创建 
        return 0; 
    } 
    var fileContent = files.read(filePath); 
    if (!fileContent) return 0; // 如果文件无数据则返回0 
    var lines = fileContent.split("\n"); 
    var lastLine = lines[lines.length - 1];   
    return parseInt(lastLine); 
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

function 活动1() {
    let cj = className("android.widget.Button").text("去参加").findOne(5000)
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
        back()
    }else{
        log("未找到活动入口")
    }
}

//感恩季活动
function ganenji(){
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
    var qwx = className("android.widget.Button").text("去微信").findOne(5000);
    if (qwx) {
        qwx.click();
    } else {
        toastLog("未找到去微信按钮，请升级社区app版本");
        return; 
    }
    sleep(1000);
    wait(() => text('编辑资料').exists(), 10, 1000,{
        then:() => {
            let signed = className("android.widget.TextView").text("已签到")
            if(signed.exists()){
                log("小程序已签到")
            }else{
                let qd = className("android.widget.TextView").text("去签到").findOne(15000)
                if (qd) {
                    while (!signed.exists()) {
                        qd.click();
                        sleep(500)
                    }
                }
                log("完成小程序签到")
            }
        },
        else:() => {
            console.log("未找到小程序页面");
        }
    })
    launchApp("小米社区")
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
                log("定时结束"); 
                device.cancelKeepingAwake(); 
                exit(); 
            } 
        },10000,starttime) 
    })
} 

function start(){
    var done = textContains("已签到").findOne(3000);
    if (done){        
        log("今日已签到");  
    }
    else{
        findCenter(); 
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
    let musicVolume = device.getMusicVolume();
    device.setMusicVolume(0);
    killAPP("com.xiaomi.vipaccount");
    skipAd(); 
    if (config.浏览帖子) posts();
    let sign = className("android.widget.ImageView").desc("签到").findOne(10000);
    if (sign){
        sign.click();
        log("打开签到页面");
        percentage = logpercentage();
        start();
        // 按配置启用功能
        if (config.小程序签到) 小程序签到();
        if (config.双旗舰) 活动1();
        if (config.加入圈子) join();
        if (config.感恩季) ganenji();
        if (config.拔萝卜) see(); 
        if (config.成长值记录) level();
        if (config.米粉节) fans();
        if (config.观看视频) watchVideo();
        killAPP("com.xiaomi.vipaccount");
        home();
        log("全部操作已完成");
    }else{
        toastLog("未找到签到按钮，即将退出")
        sleep(1000)
    }
    device.setMusicVolume(musicVolume);
    device.cancelKeepingAwake();
    sleep(1000)
    exit();
}
