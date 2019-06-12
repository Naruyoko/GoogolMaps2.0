var Entry=function(line){
  var col = line.content.$t.split(",");
  for (var i=0;i<col.length;i++){
    if (col[i].indexOf(": ")==-1){
      col[i-1]+=","+col[i];
      col.splice(i,1);
      i--;
    }
  }
  console.log(col);
  var attributes="order,year,name,lname,author,lauthor,locale,expression,fgh,evolvedfrom,related".split(",");
  for (var i=0;i<attributes.length;i++){
    this[attributes[i]]  = col[i]?col[i].split(": ")[1]:"";
  }
  this.evolvedfrom=this.evolvedfrom.split("/");
  this.related=this.related.split("/");
}
Entry.prototype.toString = function(){
  return this.year + ":" + this.name + "(" + this.order + ") $$" + this.expression + "$$";
}
Entry.prototype.pyear = function (){
  if (this.year>9999){
    return (""+this.year).substring(0,4)*1;
  }
  return this.year*1;
}
Entry.prototype.drawPos=function (){
  var x,y;
  x=10+740*this.order/(data[data.length-1].order);
  if (this.pyear()<1980){
    y=Math.pow(this.pyear()-1900,2)*0.01+20;
  }else{
    y=Math.pow(this.pyear()-1980,2)*0.34+84;
  }
  return {
    x:x,
    y:y
  };
}

var data=[];
var expand=function(res){
  var sheet = res.feed.entry;
  var entries = sheet.length;
  for(var e=0;e<entries;e++){
    var entry = new Entry(sheet[e]);
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
  $.get({
    url: url,
    success: function(response) {
      expand(response);
    }
  });
};

function canvas_arrow(context, fromx, fromy, tox, toy){
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
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
    draw()
    setTimeout(draw,5000);
  },100);
}

function draw(){
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  canvas.width=960;
  canvas.height=640;
  ctx.fillStyle="white";
  ctx.fillRect(0,0,960,640);
  for (var i=0;i<data.length;i++){
    var datum=data[i];
    var pos=datum.drawPos();
    ctx.fillStyle="black";
    ctx.font="12px Courier";
    ctx.fillText(datum.name,pos.x,pos.y);
    var img=new Image();
    img.src="https://latex.codecogs.com/gif.latex?"+encodeURIComponent(datum.expression);
    ctx.scale(0.8,0.8);
    ctx.drawImage(img,(pos.x+ctx.measureText(datum.name).width+5)*1.25,(pos.y-14)*1.25+4);
    ctx.scale(1.25,1.25);
    ctx.fillStyle="gray";
    ctx.font="9px Courier";
    ctx.fillText(datum.author+", "+datum.year,pos.x,pos.y+10);
    if (datum.evolvedfrom)
    for (var j=0;j<data.length;j++){
      var root=data[j-2];
      if (!root){
        continue;
      }
      ctx.font="12px Courier";
      if (datum.evolvedfrom.includes(root.name)||datum.evolvedfrom.includes(root.lname)){
        ctx.beginPath();
        canvas_arrow(ctx,root.drawPos().x+ctx.measureText(root.name).width,root.drawPos().y,pos.x,pos.y);
        ctx.stroke();
      }
      if (datum.related.includes(root.name)||datum.related.includes(root.lname)){
        ctx.setLineDash([5,5]);
        ctx.beginPath();
        canvas_arrow(ctx,root.drawPos().x+ctx.measureText(root.name).width,root.drawPos().y,pos.x,pos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
}
