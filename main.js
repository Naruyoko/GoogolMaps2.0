var Entry=function(line){
  var col = line.content.$t.split(",");
  for (var i=0;i<col.length;i++){
    if (col[i].indexOf(": ")==-1){
      col[i-1]+=","+col[i];
      col.splice(i,1);
      i--;
    }
  }
  console.log(col)
  var attributes="order,year,name,lname,author,lauthor,locale,expression".split(",");
  for (var i=0;i<attributes.length;i++){
    this[attributes[i]]  = col[i]?col[i].split(": ")[1]:"";
  }
}
Entry.prototype.toString = function(){
  return this.year + ":" + this.name + "(" + this.order + ") $$" + this.expression + "$$";
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

window.onload=function (){
  entry();
  waitUntilEntry=setInterval(function(){
    if (data.length){
      clearInterval(waitUntilEntry);
    }else{
      return;
    }
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width=960;
    canvas.height=640;
    ctx.fillStyle="white";
    ctx.fillRect(0,0,960,640);
    console.log(data);
    for (var i=0;i<data.length;i++){
      var datum=data[i];
      var basex=10+50*datum.order;
      var year=datum.year;
      if (year>9999){
        year=(""+year).substring(0,4)*1;
      }
      var basey=Math.pow(year-1900,2)/100*3+20;
      var label=datum.name+"("+year+")";
      ctx.fillStyle="black";
      ctx.font="12px Courier";
      ctx.fillText(label,basex,basey);
      var img=new Image;
      img.src="https://latex.codecogs.com/gif.latex?"+encodeURIComponent(datum.expression);
      ctx.scale(0.8,0.8);
      ctx.drawImage(img,(basex+ctx.measureText(label).width)*1.25,(basey-14)*1.25);
      ctx.scale(1.25,1.25);
      ctx.fillStyle="gray";
      ctx.font="9px Courier";
      ctx.fillText(datum.author,basex,basey+10);
    }
  },100);
}
