/* Entry object 
 * Entry is the object of each large number. 
 * line = response.feed.entry[n] */
var Entry=function(line){
  var col = line.content.$t.split(",");
  for (var i=0;i<col.length;i++){
    if (col[i].indexOf(": ")==-1){
      col[i-1]+=","+col[i];
      col.splice(i,1);
      i--;
    }
  }
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
    ctx.fillStyle="white";
    ctx.fillRect(0,0,640,480);
    ctx.fillStyle="black";
    ctx.font="12px Courier";
    console.log(data);
    for (var i=0;i<data.length;i++){
      var datum=data[i];
      ctx.fillText(datum.name+"("+datum.year+")",10+10*datum.order,30+14*i);
    }
  },100);
}
