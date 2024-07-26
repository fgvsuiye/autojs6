/*
原作者  by：PJ小宇    QQ：898811295
修改    by：风中拾叶
V0.5修改内容如下：
1. 增加了滑动解锁功能（模拟手势滑动操作）
2. 增加了米粉节活动
3. 增加了观看视频任务
4. 增加了成长值查看输出
5. 增加了日志输出
6. 修改了浏览帖子正则表达式，使其能匹配（01-01至12-31）日期格式
7. 优化了代码结构 
8. 优化了退出程序功能（功能执行完毕或定时器结束后都会停止脚本）

V0.6修改内容如下：
1. 增加签到+1概率、总成长值及当日获取成长值显示并写入文件
2. 修改滑块识别流程，速度大幅提升。

V0.7修改内容如下：
1. 增加了滑动方式，随机选择由快至慢滑动或贝塞尔曲线滑动。

V0.8修改内容如下：
1. 滑动起始位置不再固定为滑块中心，x与y轴添加随机偏移，并相应的修改滑动终点。

240705:
    添加解锁方式。
240720:
    添加加入圈子活动和感恩季活动
*/
var unlockType = 1 // 根据需求修改，1为图案解锁，2为数字密码解锁，其它任意值默认为上滑解锁。
var password = "000000" //解锁方式为数字密码时，将此处数字修改为自己的解锁密码。
// 解锁方式为图案解锁时，将下列点位修改为自己的图案坐标。
var gestureArray = [[284, 1479], [540, 1479], [540, 1732], [284, 1987], [540, 1987], [792, 1987]]
run();//计时
curTime = new Date();
date = curTime.getFullYear() + "-" + (curTime.getMonth() + 1) + "-" + curTime.getDate();
log(`今天是：${date}`);
sleep(500);
var centerX;
var centerY;
var len;
var done;
var p2;
var rX;//设置全局变量
var watch;
var percentaper;
main();

//解锁
function unLock(){  
    device.keepScreenOn(3600 * 1000);
    log("开始解锁设备");
    sleep(1000);
    gesture(100, [540, 1900], [540, 1200]);    // 滑动解锁
    sleep(1000);
    if (unlockType == 1){
        log("图案解锁")
        gesture(800,gestureArray);  // 模拟滑动操作
    }else if(unlockType == 2){
        log("数字密码解锁")
        for(i = 0; i < password.length; i++){
            desc(password[i]).findOne().click()
        }
    }
    log("解锁完成");
    sleep(1000);
}

//关闭程序
function killAPP(name){
    var packageName=app.getPackageName(name)
    app.openAppSetting(packageName)
    while(true){
       if(text("结束运行"||"强行停止").exists()){
            click("结束运行"||"强行停止");
            sleep(500);
            while(true){
                if(textContains("确定").exists()){
                    !click("确定");
                    log("结束小米社区");
                    sleep(500);
                    break;
                }
                break;
            }
            break;
        }
    }
}

//浏览帖子
function posts(n){
    var regex = /((0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9]))|(0[0-9]|1[0-9]|2[0-3])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])|(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/;
    var textView = className("android.widget.TextView").depth("18").textMatches(regex).clickable(true).findOne(); 
    if (textView) { 
        textView.click(); 
        log("打开帖子");
        sleep(13000);
        log("浏览10s完成");
        back();
        return
    }
    else{
        log("第"+n+"次重试")
        swipe(device.width*4/5,device.height*3/4,device.width*2/5,device.height*1/4, 1500)
        if(n > 3){
            log("打开帖子失败")      
            return;
        }
        if(n <= 3){
            return posts(n+1);
        }
    }
}

//寻找坐标
function findCenter() {
    textContains("立即签到").findOne(2000).click();
    log("开始签到");
    if (!images.requestScreenCapture()) {
        log('请求截图失败');
        exit();
    } 
    sleep(2000)
    var pictures2 = images.clip(captureScreen(),0,0,device.width,device.height);
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
        // 如果没有找到小图
        log("没有找到滑块");
    }
    sleep(1000);
}

//签到
function qd() {   
    if (!images.requestScreenCapture()) {
        log('请求截图失败');
        exit();
    }
    var img2 =images.read("/sdcard/Pictures/pictures2.png");
    var pictures = images.clip(img2,rX,device.height*1/3+30,device.width*5/6-rX,pY-device.height*1/3-30);
    images.save(pictures,"/sdcard/Pictures/pictures.png","png",100);
    img2.recycle();
    var img =images.read("/sdcard/Pictures/pictures.png");
    var g = images.grayscale(img);
    var result =images.threshold(g, 110, 155);
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
            var ss = color == "#9B9B9B"?1:0;
            s+= ss;
        }
        files.append(path, s +"\n");
        var matches = s.match(/10(0{50,})1/g)
        if (matches) {
            var sum = 0;
            for (let i = 0;i < matches[0].length;i++){
                if ( matches[0][i] == 0 ){
                    sum += 1
                }
            }
            log("缺口长度为" + sum + "*2")
            length = matches[0].length - 1;
            image.recycle();
            break;
        }
    }
    len =-1;
        var index = s.indexOf(matches);
        if (index >-1){
            len = rX+index*2+length;
            log("缺口中心:"+len);
        }
    if (len > -1) {
        log("开始模拟滑动");
        var random1 = parseInt(random(-30,30))
        let xyDis = len - centerX;
        let sx = centerX + random1;
        let ex = sx + xyDis;
        let sy = centerY + random1;
        let ey = centerY + parseInt(random(-30,30));
        if(parseInt(random(1,2)) == 1){
            log("由快至慢滑动");
            swipeFastToslow(sx, sy, ex, ey);
        }else{
            log("贝塞尔曲线滑动");
            swipeBezier(sx, sy, ex, ey);
        }
        var done = textContains("已签到").findOne(4000);
        if (done) {
            log("签到完成");
            return;
        } else{
            log("签到失败");  
        }
    }
    else{
        log("签到失败");
    }
}

// 由快至慢滑动
function swipeFastToslow(x1, y1, x2, y2) {
    swipe2(x1, y1, x2, y2);
    function swipe2(x1, y1, x2, y2) {
        
        let x4 = (x2 - 100) < x1 ? x1 : x2 - 100
        let times = (parseInt((x4 - x1) / 3) + 200 + (x2 - x4) * 5) * 5
        //console.log("滑动用时:"+times);
        let posArr = [0,times]; //滑动坐标数组

        for(let i=x1;i <=x4;i+=3){
            posArr.push(pushPosArr(i,y2))
        }

        let stayX = posArr[posArr.length-1][0];
        for(let i = stayX;i <= (stayX+2);i+=0.01){
        posArr.push([i,y2]);
        }

        x4 = x4 + 2;
        for(let i = x4; i <= x2; i+=0.2){
        posArr.push(pushPosArr(i,y2))
        }

        gestures(posArr);
    }
    function pushPosArr(x,y){
        let y2 = randomNum(y-5, y+5);
        return [x,y2];
    }

    function randomNum(min, max) {
        // console.log(min,max);
        let r = Math.floor(Math.random() * (max - min + 1) + min);
        // console.log(r);
        return r;
    }
}
// 贝塞尔曲线滑动
function swipeBezier(sx, sy, ex, ey){
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
        log([sx, sy, ex, ey]);
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
    var button = textContains("去看看").findOne(1500).click();
    if (button) {
        log("拔萝卜活动签到");
        sleep(500);
        back();
    }
}

//米粉节活动
function fans() {
    var button = className("android.widget.Button").text("去参与").findOne(1000).click();
    if (button) {
        log("打开米粉节活动")
        var dianl = className("android.widget.Button").text("点亮今日足迹").findOne(1200);
        var chouka = className("android.widget.Button").text("抽取今日祝福").findOne(1200);
        if (dianl || chouka){
            clickAndLog(dianl || chouka);
            back();
        } else {
            console.log("未找米粉节参与按钮");
        }
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
        log("未找到浏览视频入口"); 
    } 
} 

//成长值
function level() { 
    button = className("android.widget.TextView").text("社区成长等级").findOne(1500).click(); 
    if (button) { 
        sleep(1000)
        var a = readfile("/sdcard/pictures/level.txt"); 
        var num = textContains("成长值").find()[1]; 
        if (num) { 
            var num1 = num.text().split(" ")[1].split("/")[0]; 
            var numValue = parseInt(num1); 
            var b = numValue - a; 
            log("今日获得成长值：" + b); 
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
    var percentageUi = className("android.widget.TextView").textContains("当前签到+1的概率：").findOne()
    var percentageText = percentageUi.text()
    var regex = "\\d{1,3}(?:\\.\\d{1,3}?%)";
    var percentage = percentageText.match(regex)[0]
    log("当前签到+1的概率：" + percentage)
    return percentage;
}
//加入圈子活动
function join(){
    let qujiaru = className("android.widget.Button").text("去加入").findOne(3000)
    if(qujiaru){
        qujiaru.click()
        let join = className("android.widget.Button").text("加入圈子").findOne(3000).click()
        if(join){
            log("加入圈子成功")
        }else{
            log("未找到加入按钮")
        }
        sleep(2000)
        back()
    }
}
//感恩季活动
function ganenji(){
    let qucanyu = className("android.widget.Button").text("去参加").findOne(3000).click();
    if(qucanyu){
        sleep(2000)
        let jpso = className('TextView').text('可解锁').find()
        let count = className("android.widget.Button").text("去提升").findOne(3000).parent().child(1).text()
        if (jpso.size() > 0 && count > 0) {
            for (var i = 0; i < jpso.size(); i++) {
                var control = jpso.get(i);
                if(count < 1){
                    log("解锁次数不足")
                    break;
                }
                control.click();
                log("第" + (i+1) + "次解锁")
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
    back()
    }else{
        log("未找到活动入口")
    }
    
}
//运行时间
function run() { 
    threads.start(function(){ 
        starttime = new Date().getTime(); 
        setInterval(function(time){ 
            endtime = new Date().getTime(); 
            let runtime = Math.floor((endtime - time) / 1000) 
            //log("运行时间：" + runtime + "秒"); 
            if ( runtime >= 200 ){ 
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
function main(){
    if (!device.isScreenOn()) {
        log("设备已锁定");
        sleep(500);
        unLock();
    } else {
        log("设备未锁定");
    } 
    device.keepScreenOn();
    var musicvolume = device.getMusicVolume();
    device.setMusicVolume(0);
    killAPP("小米社区")    
    launchApp("小米社区")
    log("打开小米社区");
    var tg = className("android.widget.TextView").textContains("跳过").findOne(2000);
    if (tg) {
        tg.click();
        console.log("跳过了广告");
    }
    posts(1);
    className("android.widget.ImageView").desc("签到").findOne().click();
    log("打开签到页面");
    percentage = logpercentage();
    start();
    join()
    ganenji();
    see();
    level();
    //fans();
    //watchVideo();   
    killAPP("小米社区");
    home();
    log("全部操作已完成");
    device.setMusicVolume(musicvolume);
    device.cancelKeepingAwake();
    exit();
}
