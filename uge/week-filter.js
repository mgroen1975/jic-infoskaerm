(function(){
  var TZ='Europe/Copenhagen';
  function localParts(){
    var p=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),o={};
    p.forEach(function(x){o[x.type]=x.value;});
    return o;
  }
  function parseDate(s){
    var m=String(s||'').match(/(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);
    return m?new Date(Date.UTC(+m[3],+m[2]-1,+m[1])):null;
  }
  function currentWeekRange(){
    var p=localParts();
    var d=new Date(Date.UTC(+p.year,+p.month-1,+p.day));
    var wd=d.getUTCDay()||7;
    d.setUTCDate(d.getUTCDate()-(wd-1));
    var start=new Date(d);
    var end=new Date(d);end.setUTCDate(end.getUTCDate()+6);
    return {start:start.getTime(),end:end.getTime()};
  }
  function filter(){
    var root=document.getElementById('week-source');
    if(!root||!root.querySelector('table'))return false;
    var range=currentWeekRange();
    root.querySelectorAll('tr').forEach(function(tr){
      if(tr.querySelector('th'))return;
      var d=parseDate(tr.textContent||'');
      /* Bevar rækker uden sikker dato. Kun eksplicit daterede rækker uden for ugeintervallet fjernes. */
      if(!d)return;
      var t=d.getTime();
      if(t<range.start||t>range.end)tr.remove();
    });
    return true;
  }
  var tries=0,t=setInterval(function(){
    tries++;
    if(filter()||tries>60)clearInterval(t);
  },100);
})();
