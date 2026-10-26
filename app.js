(function(){
  var TZ='Europe/Copenhagen';
  var days=['mandag','tirsdag','onsdag','torsdag','fredag','lørdag','søndag'];
  var aliases={
    mandag:['mandag','monday'],
    tirsdag:['tirsdag','tuesday'],
    onsdag:['onsdag','wednesday'],
    torsdag:['torsdag','thursday'],
    fredag:['fredag','friday'],
    'lørdag':['lørdag','lordag','saturday'],
    'søndag':['søndag','sondag','sunday']
  };

  function scaleScreen(){
    var s=Math.min(window.innerWidth/1080,window.innerHeight/1920);
    document.documentElement.style.setProperty('--scale',String(s));
  }
  scaleScreen();
  window.addEventListener('resize',scaleScreen);

  function cp(){
    var parts=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(new Date());
    var o={};
    parts.forEach(function(p){o[p.type]=p.value;});
    return o;
  }
  function isoWeek(y,m,d){
    var x=new Date(Date.UTC(y,m-1,d));
    var wd=x.getUTCDay()||7;
    x.setUTCDate(x.getUTCDate()+4-wd);
    var ys=new Date(Date.UTC(x.getUTCFullYear(),0,1));
    return Math.ceil((((x-ys)/86400000)+1)/7);
  }
  function effectiveMonday(){
    var p=cp();
    var d=new Date(Date.UTC(+p.year,+p.month-1,+p.day));
    var sunday=(p.weekday==='Sun' && (+p.hour>0 || +p.minute>=1));
    if(sunday)d.setUTCDate(d.getUTCDate()+1);
    var wd=d.getUTCDay()||7;
    d.setUTCDate(d.getUTCDate()-(wd-1));
    return d;
  }
  function labels(){
    var mon=effectiveMonday();
    document.getElementById('week-number').textContent='Uge '+isoWeek(mon.getUTCFullYear(),mon.getUTCMonth()+1,mon.getUTCDate());
    days.forEach(function(day,i){
      var d=new Date(mon);
      d.setUTCDate(mon.getUTCDate()+i);
      var el=document.querySelector('[data-date="'+day+'"]');
      if(el){ el.textContent=new Intl.DateTimeFormat('da-DK',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(d); }
    });
    var t=new Intl.DateTimeFormat('da-DK',{timeZone:TZ,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
    document.getElementById('today-date').textContent=t.charAt(0).toUpperCase()+t.slice(1);
  }
  function norm(s){ return (s||'').replace(/\s+/g,' ').trim(); }
  function whichDay(text){
    var s=norm(text).toLowerCase();
    for(var i=0;i<days.length;i++){
      var day=days[i];
      var arr=aliases[day];
      for(var j=0;j<arr.length;j++) if(s.indexOf(arr[j])>-1) return day;
    }
    return null;
  }
  function isTime(s){ return /\b\d{1,2}[:.]\d{2}(?:\s*-\s*\d{1,2}[:.]\d{2})?\b/.test(s||''); }
  function getDayMap(){
    var map={};
    days.forEach(function(d){ map[d]=[]; });
    return map;
  }
  function pushGrouped(day,time,title,resource,store){
    if(!day || !time || !title) return;
    if(!store[day]) store[day]=[];
    var list=store[day];
    var existing=null;
    for(var i=0;i<list.length;i++){
      if(list[i].time===time && list[i].title===title){ existing=list[i]; break; }
    }
    if(!existing){
      existing={time:time,title:title,resources:[]};
      list.push(existing);
    }
    if(resource && existing.resources.indexOf(resource)===-1){
      existing.resources.push(resource);
    }
  }
  function parseWeek(){
    var root=document.getElementById('week-source');
    if(!root) return false;
    var dayMap=getDayMap();
    var current=null;
    var count=0;
    var tables=root.querySelectorAll('table');
    tables.forEach(function(table){
      var cap=table.querySelector('caption');
      var tableDay=whichDay(cap ? cap.textContent : '');
      table.querySelectorAll('tr').forEach(function(tr){
        var txt=norm(tr.textContent);
        var rowDay=whichDay(txt);
        var cells=[].slice.call(tr.cells).map(function(c){ return norm(c.textContent); }).filter(Boolean);
        if(rowDay && (tr.querySelector('th') || cells.length<=2)){
          current=rowDay;
          return;
        }
        if(tableDay) current=tableDay;
        if(!current || cells.length<2) return;
        if(cells.some(function(c){ return /^(tid|titel|ressource)$/i.test(c); })) return;
        var ti=cells.findIndex(isTime);
        if(ti<0) return;
        var time=cells[ti];
        var title=cells[ti+1]||'';
        var resource=cells[ti+2]||cells[cells.length-1]||'';
        pushGrouped(current,time,title,resource,dayMap);
        count++;
      });
    });
    if(!count){
      var lines=(root.innerText||'').split(/\n+/).map(norm).filter(Boolean);
      var currentDay=null;
      for(var i=0;i<lines.length;i++){
        var d=whichDay(lines[i]);
        if(d){ currentDay=d; continue; }
        if(!currentDay || !isTime(lines[i])) continue;
        pushGrouped(currentDay, lines[i], lines[i+1]||'', lines[i+2]||'', dayMap);
        i+=2;
        count++;
      }
    }
    renderWeek(dayMap);
    return count>0;
  }
  function renderWeek(dayMap){
    days.forEach(function(day){
      var box=document.querySelector('[data-bookings="'+day+'"]');
      if(!box) return;
      box.innerHTML='';
      var items=dayMap[day]||[];
      if(!items.length){
        box.innerHTML='<div class="empty">Ingen bookinger</div>';
      }else{
        items.forEach(function(item){
          var row=document.createElement('div');
          row.className='booking';
          var resourcesHtml='';
          var resources=(item.resources||[]).slice();
          var hasSpecific=resources.some(function(r){ return /(?:Gamma|Zeta)/i.test(r); });
          if(hasSpecific){
            resources=resources.filter(function(r){ return !/Karlsvognen/i.test(r); });
          }
          if(resources.length){
            resourcesHtml='<ul class="resource-list">'+resources.map(function(r){ return '<li>'+escapeHtml(r)+'</li>'; }).join('')+'</ul>';
          }
          row.innerHTML='<div class="booking-line"><div class="booking-time">'+escapeHtml(item.time)+'</div><div class="booking-title">'+escapeHtml(item.title)+'</div></div>'+resourcesHtml;
          box.appendChild(row);
        });
      }
      var card=box.closest('.day-card');
      card.classList.remove('dense','very-dense');
      var rows=(dayMap[day]||[]).length;
      if(rows>=15) card.classList.add('very-dense');
      else if(rows>=11) card.classList.add('dense');
    });
    fitWeekCards();
  }
  function fitWeekCards(){
    document.querySelectorAll('.day-card').forEach(function(card){
      if(card.classList.contains('note-card')) return;
      var box=card.querySelector('.bookings');
      if(!box) return;
      card.classList.remove('dense','very-dense');
      if(box.scrollHeight>box.clientHeight+2) card.classList.add('dense');
      if(box.scrollHeight>box.clientHeight+2) card.classList.add('very-dense');
    });
  }
  function processTodayTable(){
    var root=document.getElementById('today-bookings');
    if(!root) return false;
    var tables=root.querySelectorAll('table');
    if(!tables.length) return false;
    var bookingRows=0;

    tables.forEach(function(table){
      var headerMap={};
      var headerRows=table.querySelectorAll('tr');
      for(var hr=0;hr<headerRows.length;hr++){
        var ths=[].slice.call(headerRows[hr].querySelectorAll('th'));
        if(!ths.length) continue;
        ths.forEach(function(th,i){
          var t=norm(th.textContent).toLowerCase();
          if(t.indexOf('dato')>-1) headerMap.date=i;
          if(t.indexOf('tid')>-1) headerMap.time=i;
          if(t.indexOf('titel')>-1) headerMap.title=i;
          if(t.indexOf('info')>-1) headerMap.info=i;
          if(t.indexOf('kategori')>-1) headerMap.category=i;
          if(t.indexOf('ressource')>-1) headerMap.resource=i;
        });
        if(Object.keys(headerMap).length) break;
      }

      var ix={
        date: headerMap.date!=null ? headerMap.date : 1,
        time: headerMap.time!=null ? headerMap.time : 2,
        title: headerMap.title!=null ? headerMap.title : 3,
        info: headerMap.info!=null ? headerMap.info : 4,
        category: headerMap.category!=null ? headerMap.category : 5,
        resource: headerMap.resource!=null ? headerMap.resource : 6
      };

      var records=[];
      [].slice.call(table.querySelectorAll('tr')).forEach(function(tr){
        if(tr.querySelector('th')) return;
        var cells=[].slice.call(tr.cells);
        if(cells.length<4) return;
        var texts=cells.map(function(c){ return norm(c.textContent); });
        var time=texts[ix.time]||'';
        if(!isTime(time)) return;
        var title=texts[ix.title]||'';
        if(!title) return;
        var date=texts[ix.date]||'';
        var info=texts[ix.info]||'';
        var category=texts[ix.category]||'';
        var resource=texts[ix.resource]||'';
        var logicalKey=[date,time,title,info,category].map(function(v){return norm(v).toLowerCase();}).join('|');
        var resourceKey=norm(resource).toLowerCase();
        records.push({tr:tr,cells:cells,key:logicalKey,resource:resource,resourceKey:resourceKey,resourceIndex:ix.resource});
        bookingRows++;
      });

      var seen={};
      records.forEach(function(r){
        var k=r.key+'|'+r.resourceKey;
        if(seen[k]) r.tr.style.display='none';
        else seen[k]=true;
      });

      var groups={};
      records.forEach(function(r){
        if(r.tr.style.display==='none') return;
        if(!groups[r.key]) groups[r.key]=[];
        groups[r.key].push(r);
      });
      Object.keys(groups).forEach(function(k){
        var group=groups[k];
        var hasGammaOrZeta=group.some(function(r){ return /(?:Gamma|Zeta)/i.test(r.resource); });
        if(!hasGammaOrZeta) return;
        group.forEach(function(r){
          var hasKarls=/Karlsvognen/i.test(r.resource);
          var hasSpecific=/(?:Gamma|Zeta)/i.test(r.resource);
          if(hasKarls && !hasSpecific){
            r.tr.style.display='none';
          }else if(hasKarls && hasSpecific && r.cells[r.resourceIndex]){
            var cleaned=r.resource
              .replace(/Mødelokale\s+Karlsvognen/ig,'')
              .replace(/\bKarlsvognen\b/ig,'')
              .replace(/\s{2,}/g,' ')
              .trim();
            if(cleaned) r.cells[r.resourceIndex].textContent=cleaned;
          }
        });
      });
    });

    fitToday();
    return bookingRows>0 || tables.length>0;
  }
  function fitToday(){
    var el=document.getElementById('today-bookings');
    if(!el) return;
    el.classList.remove('dense','very-dense');
    if(el.scrollHeight>el.clientHeight+4) el.classList.add('dense');
    if(el.scrollHeight>el.clientHeight+4) el.classList.add('very-dense');
  }
  function storeNotes(){
    var key='jic_infoskaerm_notes';
    var area=document.getElementById('notes');
    if(!area) return;
    try{ area.value=localStorage.getItem(key)||''; }catch(e){}
    area.addEventListener('input',function(){ try{ localStorage.setItem(key,area.value); }catch(e){} });
  }
  function escapeHtml(str){
    return String(str||'').replace(/[&<>\"]/g,function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]; });
  }

  labels();
  storeNotes();
  var tries=0;
  var weekReady=false;
  var todayReady=false;
  var timer=setInterval(function(){
    tries++;
    if(!weekReady) weekReady=parseWeek();
    if(!todayReady) todayReady=processTodayTable();
    if((weekReady && todayReady) || tries>50){
      clearInterval(timer);
      setTimeout(function(){ fitWeekCards(); fitToday(); },250);
      setTimeout(function(){ fitWeekCards(); fitToday(); },1200);
    }
  },300);
  setTimeout(function(){ fitWeekCards(); fitToday(); },2000);
  setInterval(function(){ location.reload(); },300000);
})();
