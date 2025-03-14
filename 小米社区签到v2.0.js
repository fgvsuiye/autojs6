 /*

*****小米社区自动签到脚本*****

原作者  by：PJ小宇    QQ：898811295
修改    by：风中拾叶
三改    by：wengzhenquan
版本号：20250315

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
    sleep(500);
    if(swipe(dwidth*1/2, dheight*0.96, dwidth*1/2, dheight*1/2, 300)){
        log("上滑成功");
    }else{
        gesture(100,[dwidth*1/2, dheight*0.96] , [dwidth*1/2, dheight*1/2]);
    }
    sleep(500);
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
    app.openAppSetting(packageName);
    sleep(600)
    let yyxx = textContains("小米社区" && "权限");
    let i = 0;
    while (!yyxx.exists()){ 
        log("没有找到小米社区App");
        if(i%2===0) app.openAppSetting(app.getPackageName("小米社区"))
        else app.openAppSetting(packageName);
        sleep(600)
        i++;
        if(i>5) {
            let yyxq = className("android.widget.TextView").text("应用详情")
            if(yyxq.exists()){
                className("android.widget.FrameLayout").desc("返回").findOne().click()
                sleep(200)
                if(yyxx.exists())break;
            }
            
            return;}
    }
    sleep(500)
    if(text("结束运行"||"强行停止").exists()){
        click("结束运行"||"强行停止");
        
    }else{
        let end = className("android.widget.LinearLayout").desc("结束运行").findOne(2000)
        if(end) end.click()
    }
    sleep(500)
    if(textContains("确定").exists()){
         click("确定")
         log("结束小米社区");
            
     }
    
}

//打开程序
function launchAPP(packageName){
    app.launch(packageName);
    sleep(2000)
    let xmsqAPP = text("签到" && "官方" && "消息");
    let n = 0;
    while (!xmsqAPP.exists()){ 
        if(n%2===0) app.launchApp("小米社区")
        else app.launchPackage(packageName);
        sleep(1000)
        n++;
        if(n>5){
            let yyxx = className("android.widget.TextView").text("应用信息");
            let yyxq = className("android.widget.TextView").text("应用详情")
            if(yyxx.exists()){
                className('android.widget.LinearLayout').desc("更多").findOne().click();
                sleep(300)
                yyxq.findOne().parent().click();
                sleep(300)
                
            }
            if(yyxq.exists()){
                className("android.widget.TextView").text("启动").findOne().parent().click();
                sleep(1000)
                if(xmsqAPP.exists())return true;
            }
            
            log("无法打开小米社区");
            return false;
        }
    }
    
    log("打开小米社区");
    return true;
}



//浏览帖子
function posts(n){
    sleep(500);
    log("开始浏览帖子")
    var regex = /((0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9]))|(0[0-9]|1[0-9]|2[0-3])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/;
    let textView = className("android.widget.TextView").textMatches(regex).findOne(2000);
//    let textView2 = textView.parent().clickable(true)
    
    let pkly = className("android.widget.ImageView").desc("评论").findOne(1500)
    if (textView) { 
        textView.click(); 
    }
    else if (pkly){
        pkly.click();
    }
    else{
        log("第"+n+"次重试")
        swipe(dwidth*4/5,dheight*3/4,dwidth*2/5,dheight*1/4, 1500)
        if(n > 3){
            log("打开帖子失败")      
            return;
        }
        if(n <= 3){
            return posts(n+1);
        }
    }
    log("打开帖子");
    sleep(13000);
    log("浏览10s完成");
    back();
    return
}

//寻找坐标
function findCenter() {
    textContains("立即签到").findOne(5000).click();
    log("开始签到");
    if (!images.requestScreenCapture()) {
        log('请求截图失败');
        exit();
    } 
    sleep(2000)
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
    sleep(500);
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
        button2 = className("android.widget.Button").text("抽取今日祝福").clickable(true).findOne(1200).click();
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
        sleep(500)
        var a = readfile("/sdcard/pictures/level.txt"); 
        var num = className("android.widget.TextView").textContains("成长值").indexInParent(1).findOne(3000)
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

//小程序版成长值
function level2() { 
        var a = readfile("/sdcard/pictures/level.txt"); 
        var num = className("android.widget.TextView").text("成长值").findOne(3000)
        if (num) {
            var num1 = num.parent().child(1).child(0).text();
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
    var percentageUi = className("android.widget.TextView").textContains("当前签到+1的概率：").findOne(1500)
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
    let qujiaru = className("android.widget.Button").text("去加入").findOne(1500)
    if(qujiaru){
        qujiaru.click()
        let join = className("android.widget.Button").text("加入圈子").findOne(1500).click()
        if(join){
            log("加入圈子成功")
        }else{
            log("未找到加入按钮")
        }
        sleep(2000)
        back()
    }else{
        log("未找到'加入圈子'按钮")
    }
}

function 活动1() {
    let 参加 = className("android.widget.Button").text("去参加").findOne(1500)
    if(参加){
        参加.click()
        let register = className("android.widget.Button").text("立即报名").findOne(1500)
        if(register){
            sleep(500)
            let checkBox = register.parent().child(1).click()
            if(checkBox){
                register.click()
                sleep(2000)
                let x = dwidth * 0.74
                let y = dheight * 0.94
                click(x,y)
                sleep(500)
                }
        }
        解锁()
        sleep(500)
        back()
    }else{
        log("未找到活动入口")
    }
}

//感恩季活动
function ganenji(){
    let qucanyu = className("android.widget.Button").text("去参与").findOne(1500).click();
    if(qucanyu){
        sleep(500)
        解锁()
        sleep(500)
        back()
        sleep(500)
    }else{
        log("未找到活动入口")
    }
    
}

function 解锁() {
    let jpso = className('TextView').text('可解锁').find()
    let count = className("android.widget.Button").text("去提升").findOne(1500).parent().child(1).text()
    if (jpso.size() > 0 && count > 0) {
        for (i = 0; i < jpso.size(); i++) {
            var control = jpso.get(i);
            if(count < 1){
                log("解锁次数不足")
                break;
            }
            control.click();
            log("第" + (i+1) + "次解锁");
            sleep(500)
            let XV = className("android.widget.Image").textContains('_close_box').findOne(1500);
            
            click(XV.bounds().centerX(), XV.bounds().centerY());

            sleep(500)
            if(className("android.widget.TextView").text("可获得1次解锁机会").exists()){
                log("解锁次数不足")
                break
            }
        }
    } else {
        console.log("今日无解锁次数");
    }
}


function 小程序签到(){
   let xxcx= className("android.widget.ImageButton").desc("更多")
    //小米社区5.3以上版本进入小程序
   let v53 = className("android.widget.Button").text("去微信").findOne(1000);
   if(v53){
        while(!xxcx.exists()){    
            v53.click();
            sleep(500)
            // 存在微信分身，选择第1个
            let fenshen = className("android.widget.TextView").textContains("选择")
            if(fenshen.exists()){
                let one= className("android.widget.ImageView").desc("微信").findOne()
                click(one.bounds().centerX(), one.bounds().centerY());
                sleep(1500)
            }
            
        }   
        sleep(1000)
   }
   else{
        home();
        log("小米社区版本低于5.3.0，不支持应用内跳转小程序，")
        log("现在开始尝试从桌面第3屏寻找小程序……")
         //第3屏获取小程序
        let tr = className("android.widget.ImageView").desc("第3屏")
        
        for (let i = 0; i < 20; i++) {
             sleep(200)
             if (tr.exists()) {
                break;
             }
            if(i == 19){
                log("未找到第3屏")
                return
            }
        }
        tr.click()
        
        while(!xxcx.exists()){    
            if(config.坐标点击){
                click(config.x,config.y)
                log("点击" + config.x + "," + config.y)            
            }else{
                let xcx = className("android.widget.ImageView").desc("小米社区").findOne();
                if(!xcx) xcx = className("android.widget.TextView").text("小米社区").findOne();
                if(!xcx){
                    log("没有在第3屏找到小米社区微信小程序，")
                    log("请在微信小程序中，点击右上角，选择'添加到桌面'，")
                    log("然后将图标移动到第3屏。")
                    log("或者自定义配置小程序图标（第3屏）的坐标。")
                    log("现在跳过小米社区微信小程序签到……")
                    return;
                }
            
                click(xcx.bounds().centerX(), xcx.bounds().centerY());
                log("点击小米社区")
            }
            sleep(1000)
        }   
    }
    
    
   
    log("进入小程序")
    sleep(3000)
    log("内容加载完成")
    let edit = textContains('编辑资料')
    let cont = 0
    while (!edit.exists()){
        log("尚未进入我的页面")
        let me = className("android.widget.TextView").text("我的").findOne(4000)
//            if(me) me.parent().click()
        
        click(me.bounds().centerX(), me.bounds().centerY());

       // click(dwidth*3/4,dheight*0.96)
        sleep(500)
        cont ++
        if(cont > 5){
            log("未找到我的页面")
            return
        }
        
    }
    log("进入我的页面")
    sleep(300)
    className("android.widget.TextView").text("每日签到").waitFor()
 
    let signed = className("android.widget.TextView").text("已签到").exists()
    
    while(!signed){
        let qd = className("android.widget.TextView").text("去签到").findOne(5000)
        if (qd) {
            qd.click();
            sleep(200);
            break;
        }
    }
    log("小程序已签到")
}
//跳过广告
function skipAd() {
    let adCloseBtn = className("android.widget.ImageView").desc("关闭").findOne(1500);
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
    var done = textContains("已签到").findOne(1500);
    if (!done) findCenter();
    log("今日已签到");  
}

//主程序
function main() {
    var xmPckageName = "com.xiaomi.vipaccount";
    
    if (!device.isScreenOn()) {
        log("设备已锁定");
        while (!device.isScreenOn()){            
            device.wakeUp()
            sleep(100)
        }
        sleep(500);
        unLock();
    }
    device.keepScreenOn();
    let musicVolume = device.getMusicVolume();
    //关掉声音
    //device.setMusicVolume(0);
    
    killAPP(xmPckageName);
    if(launchAPP(xmPckageName)){
        skipAd(); 
        if (config.浏览帖子) posts(1);
        let sign = className("android.widget.ImageView").desc("签到").findOne(10000).click();
        if (sign){
            log("打开签到页面");
            percentage = logpercentage();
            start();
            // 按配置启用功能
            if (config.双旗舰) 活动1();
            if (config.加入圈子) join();
 //       if (config.感恩季) ganenji();
            if (config.拔萝卜) see(); 
          //  if (config.成长值记录) level();
//        if (config.米粉节) fans();
//        if (config.观看视频) watchVideo();
        }
        
    }
    else{
        log("(*꒦ິ⌓꒦ີ) 为什么我打不开小米社区APP？");
        log("哪里出错了？");
        log("芭比Q了，小米社区里的操作都没完成。");
        
    }
    if (config.小程序签到) 小程序签到();
    if (config.成长值记录) level2();
    killAPP(xmPckageName);
    home();
    log("全部操作已完成");
    device.setMusicVolume(musicVolume);
    device.cancelKeepingAwake();
    exit();
    
}