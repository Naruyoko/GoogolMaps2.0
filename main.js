function dg(s){
  return document.getElementById(s);
}

var Entry=function(line){
  var col = line.content.$t.split(",");
  for (var i=0;i<col.length;i++){
    if (col[i].indexOf(": ")==-1){
      col[i-1]+=","+col[i];
      col.splice(i,1);
      i--;
    }
    if (col[i][0]==" "){
      col[i]=col[i].substring(1);
    }
  }
  console.log(col);
  //sets each listed properties
  var attributes={
    order:"order",
    discoveryear:"year",
    name:"name",
    localname:"lname",
    author:"author",
    localauthor:"lauthor",
    locale:"locale",
    expression:"expression",
    fgh:"fgh",
    evolvedfrom:"evolvedfrom",
    related:"related",
    color:"color",
    equal:"equal",
    definitionurl:"definition",
    isterminated:"termination"
  };
  for (attribute in attributes){
    this[attributes[attribute]]="";
  }
  for (var i=0;i<col.length;i++){
    this[attributes[col[i].split(": ")[0]]]  = col[i]?col[i].split(": ")[1]:"";
  }
  this.evolvedfrom=this.evolvedfrom.split("/");
  this.related=this.related.split("/");
  if (EMPTY.includes(this.expression)){
    this.image=new Image();
  }else{
    var img=new Image();
    img.src=latexToURL(this.expression);
    this.image=img;
  }
  this.x=this.y=this.vx=this.vy=-1;
}
Entry.prototype.toString = function(){
  return this.year + ":" + this.name + "(" + this.order + ") $$" + this.expression + "$$ w/" + this.color;
}
Entry.prototype.pyear = function (){
  if (this.year>9999){
    return (""+this.year).substring(0,4)*1;
  }
  return this.year*1;
}
Entry.prototype.getsub = function (){
  return this.author+", "+this.year;
}
Entry.prototype.drawPos = function (){
  return {
    x:canvas.width/2+(this.x-dg("+x").value)*dg("dx").value,
    y:canvas.height/2+(this.y-dg("+y").value)*dg("dy").value
  };
}
Entry.prototype.totalWidth = function (context){
  var o=context.font;
  context.font="12px Courier";
  var c=context.measureText(this.name).width+this.image.naturalWidth*0.8+4;
  context.font="9px Courier";
  c=Math.max(c,context.measureText(this.getsub()).width);
  context.font=o;
  return c;
}

var data=[];
var expand=function(res){
  var sheet = res.feed.entry;
  var entries = sheet.length;
  data = [];
  var order=-1;
  for(var e=0;e<entries;e++){
    var entry = new Entry(sheet[e]);
    if (entry.equal!=1){
      order++;
    }
    entry.order=order;
    data.push(entry);
  }

  var str="";
  for(var e=0;e<entries;e++){
    str = str + data[e].toString();
    str = str + "\n";
  }
  document.getElementById("debug").innerHTML = str;
}

var entry=function(){
  var spreadsheetId = "11WH6PrhFAcdMEWSTjxSjZ7_rWHg-b8shAvSFn99bdyQ",
    url = "https://spreadsheets.google.com/feeds/list/" +
          spreadsheetId +
          "/od6/public/basic?alt=json";
  data=[];
  $.get({
    url: url,
    success: function(response) {
      expand(response);
    }
  });
};

var latexToURL=function (expression){
  return "https://latex.codecogs.com/gif.latex?"+encodeURIComponent(expression);
}
var URLToimg=function (url){
  return "<img src=\""+url+"\">";
}
var latexToimg=function (expression){
  return URLToimg(latexToURL(expression));
}

var canvas_arrow=function (context, fromx, fromy, tox, toy){
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
}

var canvas;
var ctx;
var holdingitem=-1;
var lastposition;
var lastMousePos;
var trueLastMousePos;
var wasMouseDown=false;
var EMPTY=["-"," ",""];
Array.prototype.clone=function (){
  return this.slice(0);
}

window.onload=function (){
  console.clear();
  entry();
  waitUntilEntry=setInterval(function(){
    if (data.length){
      clearInterval(waitUntilEntry);
    }else{
      return;
    }
    //configure canvas
    can = canvas = dg('canvas');
    ctx = canvas.getContext('2d');
    canvas.width=960;
    canvas.height=640;
    canvas.style.margin="4px";
    //set up canvas interaction functions
    initEvent(canvas);
    handleMouseDown=function (){
      wasMouseDown=false;
      for (var i=0;i<data.length;i++){
        var datum=data[i];
        var dpos={
          x:datum.drawPos().x-1,
          y:datum.drawPos().y-11,
          w:datum.totalWidth(ctx)+6,
          h:24
        };
        var cpos={
          x:mousePos[0],
          y:mousePos[1],
          w:1,
          h:1
        }
        if (intersect(dpos,cpos)){
          holdingitem=i;
          lastMousePos=mousePos.clone();
          trueLastMousePos=mousePos.clone();
          var s="";
          s+="<li>Id: "+i+"</li>";
          s+="<li>Name: "+datum.name+"</li>";
          s+="<li>Local Name: "+datum.lname+"</li>";
          s+="<li>Author: "+datum.author+"</li>";
          s+="<li>Local Author: "+datum.lauthor+"</li>";
          s+="<li>Date: "+datum.year+"</li>";
          s+="<li>Locale: "+datum.locale+"</li>";
          if (EMPTY.includes(datum.expression)){
            s+="<li>Expression: -</li>";
          }else{
            s+="<li>Expression: "+latexToimg(datum.expression)+"</li>";
          }
          if (EMPTY.includes(datum.fgh)){
            s+="<li>FGH: -</li>";
          }else{
            s+="<li>FGH: "+latexToimg(datum.fgh)+"</li>";
          }
          s+="<li>Evolved from: "+datum.evolvedfrom+"</li>";
          s+="<li>Related to: "+datum.related+"</li>";
          s+="<li>Order: "+datum.order+"</li>";
          s+="<li>Color: <span style=\"color:"+datum.color+"\">"+datum.color+"</span></li>";
          if (EMPTY.includes(datum.definition)){
            s+="<li>Definition: -</li>";
          }else{
            s+="<li>Definition: <a href=\""+datum.definition+"\">"+datum.definition+"</a></li>";
          }
          if (datum.termination=="1"){
            s+="<li>Has termination proved: Yes</li>";
          }else if (datum.termination=="0"){
            s+="<li>Has termination proved: No</li>";
          }else{
            s+="<li>Has termination proved: "+datum.termination+"</li>";
          }
          dg("details").innerHTML=s;
          return;
        }
      }
      holdingitem=-1;
      lastMousePos=mousePos.clone();
      trueLastMousePos=mousePos.clone();
      dg("details").innerHTML=""+
        "<li>Id: Not Selected</li>"+
        "<li>Name: Not Selected</li>"+
        "<li>Local Name: Not Selected</li>"+
        "<li>Author: Not Selected</li>"+
        "<li>Local Author: Not Selected</li>"+
        "<li>Date: Not Selected</li>"+
        "<li>Locale: Not Selected</li>"+
        "<li>Expression: Not Selected</li>"+
        "<li>FGH: Not Selected</li>"+
        "<li>Evolved from: Not Selected</li>"+
        "<li>Related to: Not Selected</li>"+
        "<li>Order: Not Selected</li>"+
        "<li>Color: Not Selected</li>"+
        "<li>Definition: Not Selected</li>"+
        "<li>Has termination proved: Not Selected</li>";
    }
    handleMouseUp=function (){
      if (holdingitem!=-1){
        var datum=data[holdingitem];
        datum.vx=(mousePos[0]-lastMousePos[0])/dg("dx").value;
        datum.vy=(mousePos[1]-lastMousePos[1])/dg("dy").value;
      }
      holdingitem=-1;
      wasMouseDown=false;
    }
    handleMouseDragging=function (){
      if (wasMouseDown){
        if (holdingitem==-1){
          dg("+x").value=parseInt(dg("+x").value)-(mousePos[0]-lastMousePos[0])/dg("dx").value;
          dg("+y").value=parseInt(dg("+y").value)-(mousePos[1]-lastMousePos[1])/dg("dy").value;
          lastMousePos=mousePos.clone();
          trueLastMousePos=mousePos.clone();
        }else{
          var datum=data[holdingitem];
          var isholdingfollowing=dg("follow").checked&&(dg("followid").value==holdingitem||dg("followid").value==datum.name||dg("followid").value==datum.lname);
          var x,y;
          x=(mousePos[0]-lastMousePos[0])/dg("dx").value;
          y=(mousePos[1]-lastMousePos[1])/dg("dy").value;
          if (isholdingfollowing){
            x/=10;
            y/=10;
          }
          datum.x+=x;
          datum.y+=y;
          if (!isholdingfollowing){
            lastMousePos=mousePos.clone();
          }
          trueLastMousePos=mousePos.clone();
        }
      }
      wasMouseDown=true;
    }
    handleMouseWheel=function (){
      dg("dx").value*=Math.exp(mouseWheel[1]/1000);
      dg("dy").value*=Math.exp(mouseWheel[1]/1000);
    }
    //initialize simulation
    resetphysics();
    setInterval(draw,1000/60);
  },100);
}
function intersect(b1,b2){
  return Math.abs((b1.x+b1.w/2)-(b2.x+b2.w/2))<(b1.w+b2.w)/2&&
         Math.abs((b1.y+b1.h/2)-(b2.y+b2.h/2))<(b1.h+b2.h)/2;
}

var physicsspeed=1;

function abspow(n,e){
  if (n<0){
    return -Math.pow(-n,e);
  }else{
    return Math.pow(n,e);
  }
}

function draw(){
  procEvent();
  ctx.fillStyle="white";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  //simulate physics
  if (dg("physics").checked){
    for (var i=0;i<data.length-1;i++){
      var datum1=data[i];
      var d1pos={
        x:datum1.x-datum1.totalWidth(ctx)-6,
        y:datum1.y-24,
        w:datum1.totalWidth(ctx)+6,
        h:24
      }
      for (var j=i+1;j<data.length;j++){
        var datum2=data[j];
        var d2pos={
          x:datum2.x-datum2.totalWidth(ctx)-6,
          y:datum2.y-24,
          w:datum2.totalWidth(ctx)+6,
          h:24
        }
        if (intersect(d1pos,d2pos)){
          var angle=Math.atan(((d1pos.x+d1pos.w/2)-(d2pos.x+d2pos.w/2))/((d1pos.y+d1pos.h/2)-(d2pos.y+d2pos.h/2)));
          var distance=Math.sqrt(Math.pow((d1pos.x+d1pos.w/2)-(d2pos.x+d2pos.w/2),2)+Math.pow((d1pos.y+d1pos.h/2)-(d2pos.y+d2pos.h/2),2));
          var force=Math.max(0.4,Math.min(1,1-(distance-100)/200));
          if (distance<30){
            force*=3;
          }
          if (distance<50){
            force*=2;
          }
          if ((d1pos.x+d1pos.w/2)-(d2pos.x+d2pos.w/2)<0){
            if (isNaN(angle)){
              datum1.vy-=physicsspeed*force;
              datum2.vy+=physicsspeed*force;
            }else{
              datum1.vx-=physicsspeed*force*Math.cos(angle);
              datum2.vx+=physicsspeed*force*Math.cos(angle);
              datum1.vy-=physicsspeed*force*Math.sin(angle);
              datum2.vy+=physicsspeed*force*Math.sin(angle);
            }
          }else{
            if (isNaN(angle)){
              datum1.vy+=physicsspeed*force;
              datum2.vy-=physicsspeed*force;
            }else{
              datum1.vx+=physicsspeed*force*Math.cos(angle);
              datum2.vx-=physicsspeed*force*Math.cos(angle);
              datum1.vy+=physicsspeed*force*Math.sin(angle);
              datum2.vy-=physicsspeed*force*Math.sin(angle);
            }
          }
        }
        if (datum1.evolvedfrom.includes(datum2.name)||datum1.evolvedfrom.includes(datum2.lname)){
          datum1.vx+=abspow(d2pos.x+d2pos.w+20-d1pos.x,1.2)/50*physicsspeed;
          datum1.vy+=abspow(d2pos.y-d1pos.y,1.2)/50*physicsspeed;
          datum2.vx-=abspow(d2pos.x+d2pos.w+20-d1pos.x,1.2)/50*physicsspeed*0.5;
          datum2.vy-=abspow(d2pos.y-d1pos.y,1.2)/50*physicsspeed*0.5;
        }
        if (datum2.evolvedfrom.includes(datum1.name)||datum2.evolvedfrom.includes(datum1.lname)){
          datum2.vx+=abspow(d1pos.x+d1pos.w+20-d2pos.x,1.2)/50*physicsspeed;
          datum2.vy+=abspow(d1pos.y-d2pos.y,1.2)/50*physicsspeed;
          datum1.vx-=abspow(d1pos.x+d1pos.w+20-d2pos.x,1.2)/50*physicsspeed*0.5;
          datum1.vy-=abspow(d1pos.y-d2pos.y,1.2)/50*physicsspeed*0.5;
        }
        if (datum1.related.includes(datum2.name)||datum1.related.includes(datum2.lname)){
          datum1.vx+=abspow(d2pos.x+d2pos.w+20-d1pos.x,1.2)/100*physicsspeed;
          datum1.vy+=abspow(d2pos.y-d1pos.y,1.2)/100*physicsspeed;
          datum2.vx-=abspow(d2pos.x+d2pos.w+20-d1pos.x,1.2)/100*physicsspeed*0.5;
          datum2.vy-=abspow(d2pos.y-d1pos.y,1.2)/100*physicsspeed*0.5;
        }
        if (datum2.related.includes(datum1.name)||datum2.related.includes(datum1.lname)){
          datum2.vx+=abspow(d1pos.x+d1pos.w+20-d2pos.x,1.2)/100*physicsspeed;
          datum2.vy+=abspow(d1pos.y-d2pos.y,1.2)/100*physicsspeed;
          datum1.vx-=abspow(d1pos.x+d1pos.w+20-d2pos.x,1.2)/100*physicsspeed*0.5;
          datum1.vy-=abspow(d1pos.y-d2pos.y,1.2)/100*physicsspeed*0.5;
        }
      }
    }
    for (var i=0;i<data.length;i++){
      var datum=data[i];
      var d1pos={
        x:datum.x,
        y:datum.y,
        w:datum.totalWidth(ctx)+6,
        h:24
      }
      var angle=Math.atan((d1pos.x+d1pos.w/2-480)/(d1pos.y+d1pos.h/2-320));
      var distance=Math.sqrt(Math.pow(d1pos.x+d1pos.w/2-480,2)+Math.pow(d1pos.y+d1pos.h/2-320,2));
      var force=(Math.max(0,Math.min(2,distance/300))-0.1)*0.5;
      if (d1pos.x+d1pos.w/2-480>0){
        datum.vx-=force*Math.cos(angle)*physicsspeed;
        datum.vy-=force*Math.sin(angle)*physicsspeed;
      }else{
        datum.vx+=force*Math.cos(angle)*physicsspeed;
        datum.vy+=force*Math.sin(angle)*physicsspeed;
      }
      var x,y;
      x=10+840*datum.order/(data[data.length-1].order);
      if (datum.pyear()<1980){
        y=Math.pow(datum.pyear()-1900,2)*0.01+20;
      }else{
        y=Math.pow(datum.pyear()-1980,2)*0.34+84;
      }
      datum.vx+=abspow(x-datum.x,1.2)/150*physicsspeed;
      datum.vy+=abspow(y-datum.y,1.2)/150*physicsspeed;
      datum.vx+=Math.random()*0.02*physicsspeed;
      datum.vy+=Math.random()*0.02*physicsspeed;
      datum.vx*=Math.pow(0.6,physicsspeed);
      datum.vy*=Math.pow(0.6,physicsspeed);
      if (holdingitem==i){
        datum.vx=0;
        datum.vy=0;
      }
      datum.x+=datum.vx*physicsspeed;
      datum.y+=datum.vy*physicsspeed;
    }
  }
  //find following entry
  var followingid=-1;
  if (dg("follow").checked){
    for (var i=0;i<data.length;i++){
      //get data
      var datum=data[i];
      if (dg("followid").value==i||dg("followid").value==datum.name||dg("followid").value==datum.lname){
        dg("+x").value=dg("+x").min=dg("+x").max=datum.x+datum.totalWidth(ctx)+3;
        dg("+y").value=dg("+y").min=dg("+y").max=datum.y;
        followingid=i;
        break;
      }
    }
  }else{
    dg("+x").min=0;
    dg("+x").max=960;
    dg("+y").min=0;
    dg("+y").max=640;
  }
  //check if followed, holding, but not dragging
  if (followingid==holdingitem&&holdingitem!=-1&&trueLastMousePos+""==mousePos+""){
    handleMouseDragging();
  }
  //draw boxes
  ctx.font="12px Courier";
  ctx.lineWidth="1";
  ctx.fillStyle="white"
  for (var i=0;i<data.length;i++){
    //get data
    var datum=data[i];
    var dpos=datum.drawPos();
    //draw
    ctx.beginPath();
    ctx.strokeStyle=datum.color;
    ctx.rect(dpos.x-2,dpos.y-12,datum.totalWidth(ctx)+6,24);
    ctx.stroke();
  }
  //draw entry
  ctx.strokeStyle="black";
  for (var i=0;i<data.length;i++){
    //get data
    var datum=data[i];
    var dpos=datum.drawPos();
    //draw name
    ctx.fillStyle="black";
    ctx.font="12px Courier";
    ctx.fillText(datum.name,dpos.x,dpos.y);
    //draw image with 80% scale
    ctx.scale(0.8,0.8);
    ctx.drawImage(datum.image,(dpos.x+ctx.measureText(datum.name).width+5)*1.25,(dpos.y-14)*1.25+4);
    ctx.scale(1.25,1.25);
    //draw author and year
    ctx.fillStyle="gray";
    ctx.font="9px Courier";
    ctx.fillText(datum.getsub(),dpos.x,dpos.y+10);
    //evolved from/related handle
    for (var j=0;j<data.length;j++){
      //get other
      var root=data[j-2];
      if (!root){
        continue;
      }
      var rpos=root.drawPos();
      //evolved from
      ctx.font="12px Courier";
      if (datum.evolvedfrom.includes(root.name)||datum.evolvedfrom.includes(root.lname)){
        ctx.beginPath();
        ctx.strokeStyle=datum.color;
        canvas_arrow(ctx,rpos.x+root.totalWidth(ctx)+4,rpos.y,dpos.x-2,dpos.y);
        ctx.stroke();
        ctx.strokeStyle="black";
      }
      //related
      if (datum.related.includes(root.name)||datum.related.includes(root.lname)){
        ctx.setLineDash([5,5]);
        ctx.beginPath();
        ctx.strokeStyle=datum.color;
        canvas_arrow(ctx,rpos.x+root.totalWidth(ctx)+4,rpos.y,dpos.x-2,dpos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle="black";
      }
    }
  }
  if (dg("center").checked){
    //screen center
    ctx.beginPath();
    ctx.strokeStyle="red";
    ctx.lineWidth=2;
    ctx.moveTo(canvas.width/2-10,canvas.height/2);
    ctx.lineTo(canvas.width/2+10,canvas.height/2);
    ctx.moveTo(canvas.width/2,canvas.height/2-10);
    ctx.lineTo(canvas.width/2,canvas.height/2+10);
    ctx.lineTo(canvas.width/2+10,canvas.height/2);
    ctx.lineTo(canvas.width/2,canvas.height/2-10);
    ctx.lineTo(canvas.width/2-10,canvas.height/2);
    ctx.lineTo(canvas.width/2,canvas.height/2+10);
    ctx.stroke();
    //field center
    var x=canvas.width/2+(480-dg("+x").value)*dg("dx").value;
    var y=canvas.height/2+(360-dg("+y").value)*dg("dy").value;
    ctx.beginPath();
    ctx.strokeStyle="blue";
    ctx.moveTo(x-10,y);
    ctx.lineTo(x+10,y);
    ctx.moveTo(x,y-10);
    ctx.lineTo(x,y+10);
    ctx.lineTo(x+10,y);
    ctx.lineTo(x,y-10);
    ctx.lineTo(x-10,y);
    ctx.lineTo(x,y+10);
    ctx.stroke();
    ctx.strokeStyle="black";
    ctx.lineWidth=1;
  }
}
function resize(){
  canvas.style.width=canvas.width=dg("x").value;
  canvas.style.height=canvas.height=dg("y").value;
  draw();
}
function resetscrsize(){
  dg("x").value=960;
  dg("y").value=640;
}
function resetscrzoom(){
  dg("dx").value=1;
  dg("dy").value=1;
}
function resetscrpos(){
  dg("+x").value=480;
  dg("+y").value=320;
}
function resetphysics(){
  for (var i=0;i<data.length;i++){
    var datum=data[i];
    var x,y;
    x=10+840*datum.order/(data[data.length-1].order);
    if (datum.pyear()<1980){
      y=Math.pow(datum.pyear()-1900,2)*0.01+20;
    }else{
      y=Math.pow(datum.pyear()-1980,2)*0.34+84;
    }
    datum.x=x;
    datum.y=y;
    datum.vx=datum.vy=0;
  }
  dg("physics").checked=false;
}
function resetall(){
  resetscrsize();
  resetscrzoom();
  resetscrpos();
  resetphysics();
  dg("center").checked=false;
}
