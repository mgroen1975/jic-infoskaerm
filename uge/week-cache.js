(function(){
  var PREFIX='jic-week-cache-v2:';
  var OLD_PREFIX='jic-week-cache-v1:';
  var days=['mandag','tirsdag','onsdag','torsdag','fredag','lørdag','søndag'];

  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function pad(n){return String(n).padStart(2,'0');}
  function isoFromLabel(label){
    var m=String(label||'').match(/(\d{1,2})[.\/-](\d{1,2})/);if(!m)return'';
    var now=new Date(),y=now.getFullYear(),month=+m[2],day=+m[1];
    return y+'-'+pad(month)+'-'+pad(day);
  }
  function cacheKey(date){return PREFIX+date;}
  function clearOld(){
    try{for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf(OLD_PREFIX)===0)localStorage.removeItem(k);}}catch(e){}
  }
  function saveOrRestore(){
    days.forEach(function(day){
      var box=document.querySelector('[data-bookings="'+day+'"]');
      var dateEl=document.querySelector('[data-date="'+day+'"]');
      if(!box||!dateEl)return;
      var date=isoFromLabel(norm(dateEl.textContent));if(!date)return;
      var key=cacheKey(date);
      var hasBookings=box.querySelectorAll('.booking').length>0;
      if(hasBookings){
        try{localStorage.setItem(key,box.innerHTML);}catch(e){}
        return;
      }
      var cached=null;try{cached=localStorage.getItem(key);}catch(e){}
      if(cached){box.innerHTML=cached;var card=box.closest('.day-card');if(card)card.classList.add('from-cache');}
    });
  }

  clearOld();
  var tries=0,timer=setInterval(function(){tries++;saveOrRestore();if(tries>30)clearInterval(timer);},400);
  setTimeout(saveOrRestore,2500);setTimeout(saveOrRestore,6000);
})();
