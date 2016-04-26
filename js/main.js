﻿//parameter对象保存着一个汉字的所有信息
function parameter(){
	this.x=[];//x坐标
	this.y=[];//y坐标
	this.time=[];//时间
	this.speed=[];//速度
	this.pressure=[];//压力
	this.count=0;//数组索引
	this.distance=[];//距离
	this.locks=[];//汉字锁数组，用来防止笔画之间的链接
	//以下是参数设置
	this.gaoss=1.3;//高斯初始值
	this.minPress=0.05;
	this.maxPress=0.2;
	this.width=50;
}
parameter.prototype={
	constructor:parameter,
	pushAll:function(x,y,time){
		this.x.push(x);
		this.y.push(y);
		this.time.push(time);
		this.count++;
		if(!(this.locks[this.count-1])){//加入初试值
			this.pressure.push(this.maxPress);
			this.speed.push(0);
			this.distance.push(0);
		}else{
			this.chars();//速度计算函数，包括计算距离并且加入了距离的值
		}
	},//压入x,y,time进入parameter对象
	gaussian: function(v, gauss) {
		return ((1/(Math.sqrt(2*Math.PI)*gauss))*Math.pow(Math.E,-(v*v)/(2*gauss*gauss)));
	},
	chars:function(){
		var ratio=this.maxPress/this.gaussian(0,this.gaoss);
		var time=this.time[this.count-1]-this.time[this.count-2];
		var distance=Math.sqrt(Math.pow(this.x[this.count-1]-this.x[this.count-2],2)+
			Math.pow(this.y[this.count-1]-this.y[this.count-2],2));
		this.distance.push(distance);
		if(time==0){
			this.speed[this.count-1]=this.speed[this.count-2]
		}else{
			this.speed[this.count-1]=distance/time;
		}
		if(this.count>2){
			this.speed[this.count-1]=this.speed[this.count-1]*0.6+this.speed[this.count-2]*0.3+this.speed[this.count-3]*0.1;
		}
		var speed=this.gaussian(this.speed[this.count-1],this.gaoss);
		this.pressure[this.count-1]=(ratio*speed);
		if(this.pressure[this.count-1]<this.minPress){
			this.pressure[this.count-1]=this.minPress;
		}
		this.pressure[this.count-1]=(this.pressure[this.count-1]+this.pressure[this.count-2])/2;
	},
	clearAll:function(){
		this.x=[];
		this.y=[];
		this.time=[];
		this.speed=[];
		this.pressure=[];
		this.count=0;
		this.distance=[];
		this.locks=[];
	}
};
/************************************************************/
function dl(context,x1,y1,x2,y2,dashLength){
	dashLength=dashLength===undefined?5:dashLength;
	var deltaX=x2-x1;
	var deltaY=y2-y1;
	var numDashes=Math.floor(Math.sqrt(deltaX*deltaX+deltaY*deltaY)/dashLength);
	for(var i=0;i<numDashes;++i){
		context[i%2===0?'moveTo':'lineTo']
		(x1+(deltaX/numDashes)*i,y1+(deltaY/numDashes)*i);
	}
	context.stroke();
}
function qt(ctx){
ctx.beginPath();
ctx.strokeStyle='black';
ctx.lineWidth=1.5;
ctx.moveTo(0,ctx.canvas.height/2);
ctx.lineTo(ctx.canvas.width,ctx.canvas.height/2);
ctx.moveTo(ctx.canvas.width/2,0);
ctx.lineTo(ctx.canvas.width/2,ctx.canvas.height);
ctx.stroke();
ctx.lineWidth=0.5;
dl(ctx,0,0,ctx.canvas.width,ctx.canvas.height,10);
dl(ctx,0,ctx.canvas.height,ctx.canvas.width,0,10);
ctx.closePath();
}
(function (){
function screencanvas(){	
	var canvas=document.getElementById("writing");
	var ctx=canvas.getContext("2d");
	var btnClear=document.getElementById("btnClear");
	canvas.width=document.documentElement.clientWidth;
	canvas.height=document.documentElement.clientHeight-btnClear.offsetHeight-5;
	qt(ctx);
}
window.addEventListener("load",screencanvas,true);
window.addEventListener("resize",screencanvas,true);
})();
/****************************************************************/
(function(){
var canvas=document.getElementById("writing");
var ctx=canvas.getContext("2d");
var image=document.getElementById("model");
document.body.addEventListener('touchmove', function (event) {event.preventDefault();}, false);//固定页面
touch =("createTouch" in document);
StartEvent = touch ? "touchstart" : "mousedown";
MoveEvent = touch ? "touchmove" : "mousemove";
EndEvent = touch ? "touchend" : "mouseup";
var charData=new parameter();
var lock=false;
canvas['on'+StartEvent]=function(e){
 	var t=touch ? e.touches[0] : e; 
	var x=t.pageX-t.target.offsetLeft;
	var y=t.pageY-t.target.offsetTop;
	var time=new Date().getTime();
	charData.locks.push(false);
	charData.pushAll(x,y,time);
	lock=true;
}
canvas['on'+MoveEvent]=function(e){
	if(lock){
	  var t=touch ? e.touches[0] : e;
		var x=t.pageX-t.target.offsetLeft;
		var y=t.pageY-t.target.offsetTop;	  
		var time=new Date().getTime();
		charData.locks.push(true);
		charData.pushAll(x,y,time);
		drawPoint(charData.count-1,charData);
		console.log(charData);
	}
}
canvas.onmouseout=function(e){
	lock=false;
}
canvas['on'+EndEvent]=function(e){
	lock=false;
}
function drawPoint(r,d){
		var sampleNumber=parseInt(d.distance[r]/0.5);
		for(var u=0;u<sampleNumber;u++){
			var t=u/(sampleNumber-1);
			var x=(1.0-t)*d.x[r-1]+t*d.x[r];
			var y=(1.0-t)*d.y[r-1]+t*d.y[r];
			var w=(1.0-t)*d.pressure[r-1]*d.width+t*d.pressure[r]*d.width;	
			ctx.drawImage(image,x-w,y-w,w*2,w*2);  		
		}
}	
function drawPointAll(d){
	for(var r=0;r<d.count;r++){
		if(d.locks[r]){
			var sampleNumber=parseInt(d.distance[r]/0.5);
			for(var u=0;u<sampleNumber;u++){
				var t=u/(sampleNumber-1);
				var x=(1.0-t)*d.x[r-1]+t*d.x[r];
				var y=(1.0-t)*d.y[r-1]+t*d.y[r];
				var w=(1.0-t)*d.pressure[r-1]*d.width+t*d.pressure[r]*d.width;	
				ctx.drawImage(image,x-w,y-w,w*2,w*2);  		
			}
		}
	}
}
var btnClear=document.getElementById("btnClear");
var btnSave=document.getElementById("btnSave");
var renew=document.getElementById("renew");
var nextchars=document.getElementById("nextchars");
//var tip=document.getElementById("tip");
var currentChar=0,totalchar=0;
var div=document.getElementById("tip");
var count=div.firstChild.firstChild;
var canvasURLArray=[];
btnClear.addEventListener("click",function (){
	ctx.clearRect(0,0,canvas.width,canvas.height);
	charData.clearAll();qt(ctx);

},false);
btnSave.addEventListener("click",function(){
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawPointAll(charData);
	var image=canvas.toDataURL("image/png");	
	qt(ctx);
	if(canvasURLArray.length){
		var w=window.open("second.html","_blank"),tmp="";
		//dataURL = image.replace("image/png", "image/octet-stream");
		//document.location.href = dataURL;
		w.onload=function(){
			var wDiv=w.document.getElementById("secWriting");
			for(var i=0;i<canvasURLArray.length;i++){
				tmp+="<img src='"+canvasURLArray[i]+"' width=\"20%\" height=\"20%\" />";
			}
			wDiv.innerHTML=tmp;
		}
	}else{
		alert("没有汉字");
	}
},false);
/*prechars.addEventListener("click",function(){
	if(currentChar>1){
		currentChar--;
		count.nodeValue=currentChar+"/"+(totalchar);
	}else{
		alert("已经到达第一个汉字了！");
	}
},false);*/
nextchars.addEventListener("click",function(){
	currentChar++;
	if(currentChar>totalchar){
		count.nodeValue=currentChar+"/"+(++totalchar);
		//ctx.clearRect(0,0,canvas.width,canvas.height);
		//charData.clearAll();qt(ctx);
	}else{
		count.nodeValue=currentChar+"/"+(totalchar);
	}	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	//charData.clearAll();
	drawPointAll(charData);
	var image=canvas.toDataURL("image/png");	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	charData.clearAll();
	qt(ctx);
	canvasURLArray.push(image);
},false);
renew.addEventListener("click",function(){
	canvasURLArray=[];
	charData.clearAll();
	ctx.clearRect(0,0,canvas.width,canvas.height);
	qt(ctx);currentChar=0;totalchar=0;
	count.nodeValue=currentChar+"/"+(totalchar);
},false);
})();
/*****************************************************************/
