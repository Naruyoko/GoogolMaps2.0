function dg(s){
  return document.getElementById(s);
}
var displayFont="Courier";

var Entry=function(line){
  //console.log(line);
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
  //console.log(col);
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
    isterminated:"termination",
    abbreviation:"abbreviation"
  };
  for (var attribute in attributes){
    this[attributes[attribute]]="";
  }
  for (var i=0;i<col.length;i++){
    this[attributes[col[i].split(": ")[0]]]  = col[i]?col[i].split(": ")[1]:"";
  }
  if (this.evolvedfrom){
    this.evolvedfrom=this.evolvedfrom.split("/");
  }else{
    this.evolvedfrom=[];
  }
  if (this.related){
    this.related=this.related.split("/");
  }else{
    this.related=[];
  }
  if (EMPTY.includes(this.expression)){
    this.image=new Image();
  }else{
    var img=new Image();
    img.src=latexToURL(this.expression);
    this.image=img;
  }
  if (!this.abbreviation) this.abbreviation="";
  this.x=this.y=this.vx=this.vy=-1;
  this.id=-1;
}
Entry.prototype.toString = function(){
  return this.year + ":" + this.name + "(" + this.order + ") $$" + this.expression + "$$ w/" + this.color;
}
Entry.prototype.dname = function (){
  return showabbreviation&&this.abbreviation?this.abbreviation:this.name;
}
Entry.prototype.pyear = function (){
  return this.fyear().split("/")[0]*1;
}
Entry.prototype.fyear = function (){
  var s="";
  var y=this.year;
  if (y[0]=="-"){
    s="-";
    y=y.substring(1);
  }
  if (y.length>6){
    return s+y.substring(0,4)+"/"+y.substring(4,6)+"/"+y.substring(6,8);
  }else if (y.length>4){
    return s+y.substring(0,4)+"/"+y.substring(4,6);
  }else{
    return s+y.substring(0,4);
  }
}
Entry.prototype.ryear = function (){
  var y=this.fyear().split("/");
  y=[y[0]*1,y[1]*1,y[2]*1];
  if (isNaN(y[1])){
    y[1]=1;
  }
  if (isNaN(y[2])){
    y[2]=1;
  }
  return y[0]+(y[1]-1)/12+(y[2]-1)/365;
}
Entry.prototype.getsub = function (){
  return this.author+", "+this.pyear();
}
Entry.prototype.defPos = function (){
  var x,y;
  x=10+840*this.order/(data[data.length-1].order);
  var r=this.ryear();
  if (r<1900){
    y=32-Math.log(1900+Math.exp(4)-r)*3;
  }else if (r<1980){
    y=Math.pow(r-1900,2)*0.01+20;
  }else{
    y=Math.pow(r-1980,2)*0.34+84;
  }
  return {x:x*physicsfield[0]/960,y:y*physicsfield[1]/640};
}
Entry.prototype.drawPos = function (){
  return {
    x:Math.round(canvas.width/2+(this.x-dg("+x").value)*dg("dx").value),
    y:Math.round(canvas.height/2+(this.y-dg("+y").value)*dg("dy").value)
  };
}
Entry.prototype.nameWidth = function (){
  return Math.round(showabbreviation&&this.abbreviation?this.abbreviationBufferWidth:this.nameBufferWidth);
}
Entry.prototype.totalWidth = function (){
  return Math.ceil(Math.max(this.nameWidth()+(drawimage&&this.image.src?this.imageBufferWidth+4:0),this.subBufferWidth));
}
Entry.prototype.drawTextBuffer = function (){
  tbctx.clearRect(0,45*this.id+2,tbcanvas.width,45);
  tbctx.fillStyle="black";
  tbctx.font="12px "+displayFont;
  this.nameBufferY=45*this.id+0;
  this.nameBufferWidth=tbctx.measureText(this.name).width;
  tbctx.fillText(this.name,0,this.nameBufferY+15);
  this.abbreviationBufferWidth=tbctx.measureText(this.abbreviation).width;
  this.abbreviationBufferY=45*this.id+15;
  tbctx.fillText(this.abbreviation,0,this.abbreviationBufferY+15);
  tbctx.fillStyle="gray";
  tbctx.font="9px "+displayFont;
  this.subBufferY=45*this.id+30;
  this.subBufferWidth=tbctx.measureText(this.getsub()).width;
  tbctx.fillText(this.getsub(),0,this.subBufferY+15);
}
Entry.prototype.drawImageBuffer = function (){
  ibctx.clearRect(0,45*this.id,ibcanvas.width,45);
  if (this.image.src){
    this.imageBufferY=45*this.id;
    this.imageBufferWidth=0.8*this.image.width;
    ibctx.drawImage(this.image,0,45*this.id,0.8*this.image.width,0.8*this.image.height);
  }
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
    entry.id=data.length;
    data.push(entry);
  }
  for (var i=0;i<data.length;i++){
    var datum=data[i];
    datum.evolvedfromID=[];
    for (var j=0;j<datum.evolvedfrom.length;j++){
      datum.evolvedfromID[j]=IDFromName(datum.evolvedfrom[j]);
    }
    datum.relatedID=[];
    for (var j=0;j<datum.related.length;j++){
      datum.relatedID[j]=IDFromName(datum.related[j]);
    }
  }
  for (var i=0;i<data.length;i++){
    var datum1=data[i];
    datum1.evolvesto=[];
    datum1.evolvestoID=[];
    datum1.predecesses=[];
    datum1.predecessesID=[];
    for (var j=0;j<data.length;j++){
      var datum2=data[j];
      if (datum2.evolvedfromID.includes(i)){
        datum1.evolvesto.push(datum2.name);
        datum1.evolvestoID.push(j);
      }
      if (datum2.relatedID.includes(i)){
        datum1.predecesses.push(datum2.name);
        datum1.predecessesID.push(j);
      }
    }
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
      research();
    }
  });
};

var latexToURL=function (expression){
  return "https://math.now.sh?from="+encodeURIComponent(expression);
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

var drawTextBuffers=function (){
  tbcanvas.height=45*data.length+5;
  for(var i=0;i<data.length;i++) data[i].drawTextBuffer();
}
var drawImageBuffers=function (){
  ibcanvas.height=45*data.length;
  for(var i=0;i<data.length;i++){
    data[i].imageBufferWidth=0;
    if (data[i].image.src){
      if (data[i].image.complete) data[i].drawImageBuffer();
      else data[i].image.onload=(function (i){return function (){data[i].drawImageBuffer();};})(i);
    }
  }
}

var canvas;
var ctx;
var tbcanvas;
var tbctx;
var holdingitem=-1;
var selecteditem=-1;
var lastposition;
var lastMousePos;
var trueLastMousePos;
var lastLastMousePos=[];
var lastLastMousePosLim=3;
var wasMouseDown=false;
var EMPTY=["-"," ",""];
Array.prototype.clone=function (){
  return this.slice(0);
}
var isfollowing=function (id){
  var datum=data[id];
  var f=dg("followid").value.toLowerCase();
  return f&&dg("follow").checked&&(f==id||f==datum.name.toLowerCase()||f==datum.lname.toLowerCase()||f==datum.abbreviation.toLowerCase());
}
var IDFromName=function (s){
  var s=s.toLowerCase();
  for (var i=0;i<data.length;i++){
    var datum=data[i];
    if (s==datum.name.toLowerCase()||s==datum.lname.toLowerCase()||s==datum.abbreviation.toLowerCase()){
      return i;
    }
  }
  return -1;
}

var showDetails=function (id){
  var s="";
  if (id==-1){
    s="<button class=\"unavailable\">Follow this</button>"+
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
      "<li>Evolves to: Not Selected</li>"+
      "<li>Predecesses: Not Selected</li>"+
      "<li>Order: Not Selected</li>"+
      "<li>Color: Not Selected</li>"+
      "<li>Definition: Not Selected</li>"+
      "<li>Has termination proved: Not Selected</li>";
  }else{
    var datum=data[id];
    s+="<button onclick=\"dg(&quot;followid&quot;).value=&quot;"+datum.name+"&quot;;dg(&quot;follow&quot;).checked=true;\">Follow this</button>";
    s+="<li>Id: "+id+"</li>";
    s+="<li>Name: "+datum.name+"</li>";
    s+="<li>Local Name: "+datum.lname+"</li>";
    s+="<li>Author: "+datum.author+"</li>";
    s+="<li>Local Author: "+datum.lauthor+"</li>";
    s+="<li>Date: "+datum.fyear()+"</li>";
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
    if (datum.evolvedfrom.length){
      s+="<li>Evolved from: ";
      for (var i=0;i<datum.evolvedfrom.length;i++){
        s+="<fake-link onclick=\"showDetails("+datum.evolvedfromID[i]+")\">"+datum.evolvedfrom[i]+"</fake-link>";
        if (i!=datum.evolvedfrom.length-1){
          s+=", ";
        }
      }
      s+="</li>";
    }else{
      s+="<li>Evolved from: -</li>";
    }
    if (datum.related.length){
      s+="<li>Related to: ";
      for (var i=0;i<datum.related.length;i++){
        s+="<fake-link onclick=\"showDetails("+datum.relatedID[i]+")\">"+datum.related[i]+"</fake-link>";
        if (i!=datum.related.length-1){
          s+=", ";
        }
      }
      s+="</li>";
    }else{
      s+="<li>Related to: -</li>";
    }
    if (datum.evolvesto.length){
      s+="<li>Evolves to: ";
      for (var i=0;i<datum.evolvesto.length;i++){
        s+="<fake-link onclick=\"showDetails("+datum.evolvestoID[i]+")\">"+datum.evolvesto[i]+"</fake-link>";
        if (i!=datum.evolvesto.length-1){
          s+=", ";
        }
      }
      s+="</li>";
    }else{
      s+="<li>Evolved from: -</li>";
    }
    if (datum.predecesses.length){
      s+="<li>Predecesses: ";
      for (var i=0;i<datum.predecesses.length;i++){
        s+="<fake-link onclick=\"showDetails("+datum.predecessesID[i]+")\">"+datum.predecesses[i]+"</fake-link>";
        if (i!=datum.predecesses.length-1){
          s+=", ";
        }
      }
      s+="</li>";
    }else{
      s+="<li>Predecesses to: -</li>";
    }
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
  }
  dg("details").innerHTML=s;
  selecteditem=id;
  if (!noupdatehidden) research();
}
var lastTime=new Date().getTime();

window.onload=function (){
  if (console.clear) console.clear();
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
    canvas.textBuffer = tbcanvas = document.createElement('canvas');
    tbctx = tbcanvas.getContext('2d');
    tbcanvas.width=960;
    tbcanvas.height=900;
    tbcanvas.style.border="1px solid black";
    //document.body.appendChild(tbcanvas);
    drawTextBuffers();
    canvas.imageBuffer = ibcanvas = document.createElement('canvas');
    ibctx = ibcanvas.getContext('2d');
    ibcanvas.width=960;
    ibcanvas.height=900;
    ibcanvas.style.border="1px solid black";
    //document.body.appendChild(ibcanvas);
    drawImageBuffers();
    //set up canvas interaction functions
    initEvent(canvas);
    handleMouseDown=function (){
      wasMouseDown=false;
      for (var i=0;i<connecteddata.length;i++){
        if (checkSelection(connecteddata[i])){
          selectItem(connecteddata[i].id);
          return;
        }
      }
      if (!completelyhideifhidden){
        for (var i=0;i<unconnecteddata.length;i++){
          if (checkSelection(unconnecteddata[i])){
            selectItem(unconnecteddata[i].id);
            return;
          }
        }
      }
      selectItem(-1);
      return;
    }
    handleMouseUp=function (){
      if (holdingitem!=-1){
        var datum=data[holdingitem];
        datum.vx=physicsspeed&&(lastLastMousePos[0][0]-lastLastMousePos[lastLastMousePos.length-1][0])/lastLastMousePos.length/dg("dx").value/physicsspeed;
        datum.vy=physicsspeed&&(lastLastMousePos[0][1]-lastLastMousePos[lastLastMousePos.length-1][1])/lastLastMousePos.length/dg("dy").value/physicsspeed;
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
          var isholdingfollowing=isfollowing(holdingitem);
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
    requestAnimationFrame(draw);
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

function checkSelection(datum){
  var dpos={
    x:datum.drawPos().x-1,
    y:datum.drawPos().y-11,
    w:datum.totalWidth()+6,
    h:24
  };
  var cpos={
    x:mousePos[0],
    y:mousePos[1],
    w:1,
    h:1
  }
  return intersect(dpos,cpos);
}

function selectItem(i){
  holdingitem=i;
  lastMousePos=mousePos.clone();
  trueLastMousePos=mousePos.clone();
  showDetails(i);
}

function doCollisionPhysics(datum1,d1pos,datum2,d2pos){
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
}

var showabbreviation=false;
var drawimage=true;
var completelyhideifhidden=false;
var noupdatehidden=false;
var hidecategory="none";
var hidesearchdepth=0;
var connecteddata=[];
var unconnecteddata=[];
var pastframes=[];
var physicsfield=[960,640];

function draw(){
  procEvent();
  if (lastMousePos) lastLastMousePos.unshift(lastMousePos.clone());
  if (lastLastMousePos.length>lastLastMousePosLim) lastLastMousePos.pop();
  ctx.fillStyle="white";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  //get configuration
  showabbreviation=dg("showabbreviation").checked;
  drawimage=dg("drawimage").checked;
  noupdatehidden=dg("noupdatehidden").checked;
  completelyhideifhidden=dg("completelyhideifhidden").checked;
  physicsspeed=+dg("physicsspeed").value;
  //simulate physics
  if (dg("physics").checked){
    //divide screen vertically
    var dividedObjects=[];
    for (var i=0;i<physicsfield[1]/24;i++){
      dividedObjects.push([]);
    }
    for (var i=0;i<data.length-1;i++){
      var datum=data[i];
      dividedObjects[Math.max(0,Math.min(dividedObjects.length-1,Math.floor((datum.y-24)/24)))].push(datum);
    }
    //collision
    for (var i=0;i<dividedObjects.length;i++){
      for (var j=0;j<dividedObjects[i].length;j++){
        var datum1=dividedObjects[i][j];
        var d1pos={
          x:datum1.x-datum1.totalWidth()-6,
          y:datum1.y-24,
          w:datum1.totalWidth()+6,
          h:24
        }
        for (var k=0;k<dividedObjects[i].length;k++){
          var datum2=dividedObjects[i][k];
          var d2pos={
            x:datum2.x-datum2.totalWidth()-6,
            y:datum2.y-24,
            w:datum2.totalWidth()+6,
            h:24
          }
          doCollisionPhysics(datum1,d1pos,datum2,d2pos);
        }
        if (i!=dividedObjects.length-1){
          for (var k=0;k<dividedObjects[i+1].length;k++){
            var datum2=dividedObjects[i+1][k];
            var d2pos={
              x:datum2.x-datum2.totalWidth()-6,
              y:datum2.y-24,
              w:datum2.totalWidth()+6,
              h:24
            }
            doCollisionPhysics(datum1,d1pos,datum2,d2pos);
          }
        }
      }
    }
    //evolved from and related to string physics
    for (var i=0;i<data.length;i++){
      var datum1=data[i];
      var d1pos={
        x:datum1.x-datum1.totalWidth()-6,
        y:datum1.y-24,
        w:datum1.totalWidth()+6,
        h:24
      }
      for (var j=0;j<datum1.evolvedfromID.length;j++){
        var datum2=data[datum1.evolvedfromID[j]];
        var d2pos={
          x:datum2.x-datum2.totalWidth()-6,
          y:datum2.y-24,
          w:datum2.totalWidth()+6,
          h:24
        }
        datum1.vx+=abspow(d2pos.x+d2pos.w+20-d1pos.x,1.2)/50*physicsspeed;
        datum1.vy+=abspow(d2pos.y-d1pos.y,1.2)/50*physicsspeed;
        datum2.vx-=abspow(d2pos.x+d2pos.w+20-d1pos.x,1.2)/50*physicsspeed*0.5;
        datum2.vy-=abspow(d2pos.y-d1pos.y,1.2)/50*physicsspeed*0.5;
      }
      for (var j=0;j<datum1.relatedID.length;j++){
        var datum2=data[datum1.relatedID[j]];
        var d2pos={
          x:datum2.x-datum2.totalWidth()-6,
          y:datum2.y-24,
          w:datum2.totalWidth()+6,
          h:24
        }
        datum1.vx+=abspow(d2pos.x+d2pos.w+20-d1pos.x,1.2)/100*physicsspeed;
        datum1.vy+=abspow(d2pos.y-d1pos.y,1.2)/100*physicsspeed;
        datum2.vx-=abspow(d2pos.x+d2pos.w+20-d1pos.x,1.2)/100*physicsspeed*0.5;
        datum2.vy-=abspow(d2pos.y-d1pos.y,1.2)/100*physicsspeed*0.5;
      }
    }
    //environment physics
    for (var i=0;i<data.length;i++){
      var datum=data[i];
      var d1pos={
        x:datum.x,
        y:datum.y,
        w:datum.totalWidth()+6,
        h:24
      }
      var angle=Math.atan((d1pos.x+d1pos.w/2-physicsfield[0]/2)/(d1pos.y+d1pos.h/2-physicsfield[1]/2));
      var distance=Math.sqrt(Math.pow(d1pos.x+d1pos.w/2-physicsfield[0]/2,2)+Math.pow(d1pos.y+d1pos.h/2-physicsfield[1]/2,2));
      var force=(Math.max(0,Math.min(2,distance/300))-0.1)*0.5;
      if (d1pos.x+d1pos.w/2-physicsfield[0]/2>0){
        datum.vx-=force*Math.cos(angle)*physicsspeed;
        datum.vy-=force*Math.sin(angle)*physicsspeed;
      }else{
        datum.vx+=force*Math.cos(angle)*physicsspeed;
        datum.vy+=force*Math.sin(angle)*physicsspeed;
      }
      var epos=datum.defPos();
      datum.vx+=abspow(epos.x-datum.x,1.2)/150*physicsspeed;
      datum.vy+=abspow(epos.y-datum.y,1.2)/150*physicsspeed;
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
      if (isfollowing(i)){
        dg("+x").value=dg("+x").min=dg("+x").max=datum.x+(datum.totalWidth()+3)/2/dg("dx").value;
        dg("+y").value=dg("+y").min=dg("+y").max=datum.y;
        followingid=i;
        break;
      }
    }
  }else{
    dg("+x").min=0;
    dg("+x").max=physicsfield[0];
    dg("+y").min=0;
    dg("+y").max=physicsfield[1];
  }
  //check if followed, holding, but not dragging
  if (followingid==holdingitem&&holdingitem!=-1&&trueLastMousePos+""==mousePos+""){
    handleMouseDragging();
  }
  //highlight selected/following item
  ctx.font="12px "+displayFont;
  ctx.lineWidth="1";
  if (selecteditem!=-1){
    //get data
    var datum=data[selecteditem];
    var dpos=datum.drawPos();
    //draw
    ctx.fillStyle="#ffd2bf";
    ctx.fillRect(dpos.x-2,dpos.y-12,datum.totalWidth()+6,24);
  }
  if (followingid!=-1){
    //get data
    var datum=data[followingid];
    var dpos=datum.drawPos();
    //draw
    if (selecteditem==followingid){
      ctx.fillStyle="#ddb0ae";
    }else{
      ctx.fillStyle="#ddddee";
    }
    ctx.fillRect(dpos.x-2,dpos.y-12,datum.totalWidth()+6,24);
  }
  //draw data
  for (var i=0;i<connecteddata.length;i++) drawDatumBox(connecteddata[i]);
  for (var i=0;i<unconnecteddata.length;i++) drawDatumBox(unconnecteddata[i]);
  for (var i=0;i<connecteddata.length;i++) drawDatumBody(connecteddata[i]);
  for (var i=0;i<unconnecteddata.length;i++) drawDatumBody(unconnecteddata[i]);
  ctx.globalAlpha=1;
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
    var x=canvas.width/2+(physicsfield[0]/2-dg("+x").value)*dg("dx").value;
    var y=canvas.height/2+(physicsfield[1]/2-dg("+y").value)*dg("dy").value;
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
  //frame time
  var now=new Date().getTime();
  var dif=now-lastTime;
  pastframes.push(now);
  while (pastframes.length>=4&&now-pastframes[0]>=1000) pastframes.shift();
  dg("time").textContent=dif;
  dg("frame").textContent=(1000*(pastframes.length-1)/(now-pastframes[0])).toFixed(1);
  lastTime=now;
  requestAnimationFrame(draw);
}
function drawDatumBox(datum){
  if (completelyhideifhidden&&!connecteddata.includes(datum)) return;
  if (!connecteddata.includes(datum)) ctx.globalAlpha=0.2;
  else ctx.globalAlpha=1;
  var dpos=datum.drawPos();
  //draw boxes
  ctx.beginPath();
  ctx.strokeStyle=datum.color;
  ctx.rect(dpos.x-2,dpos.y-12,datum.totalWidth()+6,24);
  ctx.stroke();
}
function drawDatumBody(datum){
  if (completelyhideifhidden&&!connecteddata.includes(datum)) return;
  if (!connecteddata.includes(datum)) ctx.globalAlpha=0.2;
  else ctx.globalAlpha=1;
  var dpos=datum.drawPos();
  //draw entry
  ctx.strokeStyle="black";
  //draw name
  if (showabbreviation&&datum.abbreviation) ctx.drawImage(tbcanvas,0,datum.abbreviationBufferY+3,datum.abbreviationBufferWidth,15,dpos.x,dpos.y-12,datum.abbreviationBufferWidth,15);
  else ctx.drawImage(tbcanvas,0,datum.nameBufferY+3,datum.nameBufferWidth,15,dpos.x,dpos.y-12,datum.nameBufferWidth,15);
  if (drawimage&&datum.imageBufferWidth){
    //draw image with 80% scale
    ctx.drawImage(ibcanvas,0,datum.imageBufferY,datum.imageBufferWidth,45,dpos.x+datum.nameWidth()+5,dpos.y-10,datum.imageBufferWidth,45);
  }
  //draw author and year
  ctx.drawImage(tbcanvas,0,datum.subBufferY+3,datum.subBufferWidth,15,dpos.x,dpos.y-2,datum.subBufferWidth,15);
  //evolved from
  for (var j=0;j<datum.evolvedfrom.length;j++){
    //get other
    var root=data[datum.evolvedfromID[j]];
    if (!root){
      continue;
    }
    if (completelyhideifhidden&&!connecteddata.includes(root)) continue;
    if (!connecteddata.includes(root)) ctx.globalAlpha=0.2;
    var rpos=root.drawPos();
    ctx.beginPath();
    ctx.strokeStyle=datum.color;
    canvas_arrow(ctx,rpos.x+root.totalWidth()+4,rpos.y,dpos.x-2,dpos.y);
    ctx.stroke();
    ctx.strokeStyle="black";
  }
  //related
  for (var j=0;j<datum.related.length;j++){
    //get other
    var root=data[datum.relatedID[j]];
    if (!root){
      continue;
    }
    if (completelyhideifhidden&&!connecteddata.includes(root)) continue;
    if (!connecteddata.includes(root)) ctx.globalAlpha=0.2;
    var rpos=root.drawPos();
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    ctx.strokeStyle=datum.color;
    canvas_arrow(ctx,rpos.x+root.totalWidth()+4,rpos.y,dpos.x-2,dpos.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle="black";
  }
}
function resize(){
  physicsfield=[dg("fx").value,dg("fy").value];
  canvas.style.width=canvas.width=dg("x").value;
  canvas.style.height=canvas.height=dg("y").value;
}
function research(){
  hidecategory=dg("hidecategory").value;
  hidesearchdepth=+dg("hidesearchdepth").value;
  if (hidesearchdepth===0) hidesearchdepth=Infinity;
  connecteddata=[];
  if (hidecategory=="none"||selecteditem==-1){
    connecteddata=data;
    unconnecteddata=[];
  }else{
    function additems(a){
      for (var i=0;i<a.length;i++){
        if (!connecteddata.includes(data[a[i]])){
          connecteddata.push(data[a[i]]);
          nextchildrentobetested.push(data[a[i]]);
        }
      }
    }
    //evolution forward, evolution backward, relation forward, relation backward
    var stuff={
      evolutiononeway:[1,0,0,0],
      relationoneway:[0,0,1,0],
      bothoneway:[1,0,1,0],
      evolution:[1,1,0,0],
      relation:[0,0,1,1],
      both:[1,1,1,1]
    };
    connecteddata.push(data[selecteditem]);
    var childrentobetested=[data[selecteditem]];
    var categories=stuff[hidecategory];
    for (var i=0;i<hidesearchdepth;i++){
      var nextchildrentobetested=[];
      for (var j=0;j<childrentobetested.length;j++){
        var datum=childrentobetested[j];
        if (!datum) continue;
        if (categories[0]) additems(datum.evolvestoID);
        if (categories[1]) additems(datum.evolvedfromID);
        if (categories[2]) additems(datum.predecessesID);
        if (categories[3]) additems(datum.relatedID);
      }
      if (!nextchildrentobetested.length) break;
      childrentobetested=nextchildrentobetested;
    }
    unconnecteddata=[];
    for (var i=0;i<data.length;i++){
      if (!connecteddata.includes(data[i])) unconnecteddata.push(data[i]);
    }
  }
}

function resetscrsize(){
  dg("x").value=physicsfield[0];
  dg("y").value=physicsfield[1];
}
function resetscrzoom(){
  dg("dx").value=1;
  dg("dy").value=1;
}
function resetscrpos(){
  dg("+x").value=physicsfield[0]/2;
  dg("+y").value=physicsfield[1]/2;
}
function resetfieldsize(){
  dg("fx").value=960;
  dg("fy").value=640;
}
function resetphysics(){
  for (var i=0;i<data.length;i++){
    var datum=data[i];
    var epos=datum.defPos();
    datum.x=epos.x;
    datum.y=epos.y;
    datum.vx=datum.vy=0;
  }
  dg("physics").checked=false;
  dg("physicsspeed").value=1;
}
function resetall(){
  resetfieldsize();
  resetscrsize();
  resetscrzoom();
  resetscrpos();
  resetphysics();
  research();
  dg("showabbreviation").checked=false;
  dg("drawimage").checked=true;
  dg("center").checked=false;
}