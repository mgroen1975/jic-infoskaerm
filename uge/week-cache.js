(function(){
  var PREFIX='jic-week-cache-v1:';
  var days=['mandag','tirsdag','onsdag','torsdag','fredag','lørdag','søndag'];

  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function cacheKey(day,date){return PREFIX+day+':'+date;}

  function saveOrRestore(){
    days.forEach(function(day){
      var box=document.querySelector('[data-bookings="'+day+'"]');
      var dateEl=document.querySelector('[data-date="'+day+'"]');
      if(!box||!dateEl)return;
      var date=norm(dateEl.textContent);
      if(!date)return;
      var key=cacheKey(day,date);
      var hasBookings=box.querySelectorAll('.booking').length>0;
      if(hasBookings){
        try{localStorage.setItem(key,box.innerHTML);}catch(e){}
        return;
      }
      var cached=null;
      try{cached=localStorage.getItem(key);}catch(e){}
      if(cached){
        box.innerHTML=cached;
        var card=box.closest('.day-card');
        if(card)card.classList.add('from-cache');
      }
    });
  }

  var tries=0;
  var timer=setInterval(function(){
    tries++;
    saveOrRestore();
    if(tries>30)clearInterval(timer);
  },400);

  setTimeout(saveOrRestore,2500);
  setTimeout(saveOrRestore,6000);
})();
