(function(){
  var TZ='Europe/Copenhagen';
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function raw(el){return String((el&&(el.innerText||el.textContent))||'').replace(/\r/g,'').trim();}
  function esc(s){return String(s||'').replace(/[&<>\"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[c];});}
  function viewportSize(){var vv=window.visualViewport;return {w:(vv&&vv.width)||document.documentElement.clientWidth||window.innerWidth||1920,h:(vv&&vv.height)||document.documentElement.clientHeight||window.innerHeight||1080};}
  function scale(){var v=viewportSize();document.documentElement.style.setProperty('--scale',String(Math.min(v.w/1920,v.h/1080)));}
  scale();addEventListener('resize',scale);addEventListener('orientationchange',function(){setTimeout(scale,100);setTimeout(scale,500);});if(window.visualViewport)window.visualViewport.addEventListener('resize',scale);setTimeout(scale,250);setTimeout(scale,1000);setTimeout(scale,2500);

  function localParts(){var p=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),o={};p.forEach(function(x){o[x.type]=x.value;});return o;}
  function todayUTC(){var p=localParts();return new Date(Date.UTC(+p.year,+p.month-1,+p.day));}
  function dateObj(d){return {y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()};}
  function dateKey(x){return x.y+'-'+String(x.m).padStart(2,'0')+'-'+String(x.d).padStart(2,'0');}
  function parseDate(s){var m=String(s||'').match(/(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);return m?{d:+m[1],m:+m[2],y:+m[3]}:null;}
  function targetDates(){var start=todayUTC(),out=[];for(var i=0;i<7;i++){var d=new Date(start);d.setUTCDate(start.getUTCDate()+i);out.push(dateObj(d));}return out;}
  function isTime(s){return /\b\d{1,2}[:.]\d{2}(?:\s*(?:-|–|—)\s*\d{1,2}[:.]\d{2})?\b/.test(s||'');}
  function displayTime(s){var r=String(s||'').match(/(\d{1,2}[:.]\d{2})\s*(?:-|–|—|til)\s*(\d{1,2}[:.]\d{2})/i);if(r)return r[1].replace('.',':')+'–'+r[2].replace('.',':');var one=String(s||'').match(/(\d{1,2}[:.]\d{2})/);return one?one[1].replace('.',':'):norm(s);}
  function dayName(x){return new Intl.DateTimeFormat('da-DK',{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(x.y,x.m-1,x.d))).replace(/^./,function(c){return c.toUpperCase();});}
  function shortDate(x){return new Intl.DateTimeFormat('da-DK',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(Date.UTC(x.y,x.m-1,x.d)));}
  function shortDay(x){var n=dayName(x).slice(0,3)+'.';return n+' '+shortDate(x);}

  function setupSlots(){var dates=targetDates();document.querySelectorAll('[data-slot]').forEach(function(card){var i=+card.getAttribute('data-slot'),d=dates[i];card.setAttribute('data-key',dateKey(d));var t=card.querySelector('[data-title]'),de=card.querySelector('[data-date]');if(t)t.textContent=dayName(d);if(de)de.textContent=shortDate(d);if(i===0)card.classList.add('is-today');});return dates;}

  function cleanResource(s){s=norm(s);if(!s)return'';var g=/\bGamma\b/i.test(s),z=/\bZeta\b/i.test(s);if(g||z){var r=[];if(g)r.push('Gamma');if(z)r.push('Zeta');return r.join(' + ');}var p=/25\s*meter|25\s*m\b/i.test(s),w=/varmtvand/i.test(s);if(p&&w)return'25 m + varmtvand';if(p)return'25 m';if(w)return'Varmtvand';var h=[];if(/\bHal\s*A\b/i.test(s))h.push('A');if(/\bHal\s*B\b/i.test(s))h.push('B');if(h.length>1)return'Hal '+h.join(' + ');if(h.length===1)return'Hal '+h[0];return s.replace(/^Opholdsrum\s+/i,'').replace(/^Mødelokale\s+/i,'').replace(/^Svøm\s+/i,'').replace(/^Springcenter$/i,'Spring');}
  function mergeResources(list){var out=[];list.forEach(function(r){r=cleanResource(r);if(r&&out.indexOf(r)<0)out.push(r);});if(out.indexOf('25 m')>-1&&out.indexOf('Varmtvand')>-1){out=out.filter(function(x){return x!=='25 m'&&x!=='Varmtvand';});out.unshift('25 m + varmtvand');}if(out.indexOf('Gamma')>-1&&out.indexOf('Zeta')>-1){out=out.filter(function(x){return x!=='Gamma'&&x!=='Zeta';});out.unshift('Gamma + Zeta');}if(out.indexOf('Hal A')>-1&&out.indexOf('Hal B')>-1){out=out.filter(function(x){return x!=='Hal A'&&x!=='Hal B';});out.unshift('Hal A + B');}return out.join(' · ');}
  function compactInfo(s){return String(s||'').replace(/\r/g,'\n').split(/\n+/).map(function(x){return norm(x).replace(/^[•·*-]\s*/,'');}).filter(Boolean).join(' · ').replace(/\s+(?:-|–|—)\s+/g,' · ');}
  function infoGroups(s){s=String(s||'').replace(/\r/g,'\n').trim();if(!s)return[];s=s.replace(/([^\n])\s+(?=\d{1,2}[:.]\d{2}\s*(?:-|–|—|:))/g,'$1\n');var lines=s.split(/\n+/).map(function(x){return x.trim();}).filter(Boolean),groups=[],cur=null;function start(t){cur={time:String(t||'').replace('.',':'),items:[]};groups.push(cur);}function add(t){t=norm(t).replace(/^[•·*-]\s*/,'');if(!t)return;if(!cur)start('');t.split(/\s+(?:-|–|—)\s+/).map(norm).filter(Boolean).forEach(function(x){cur.items.push(x);});}lines.forEach(function(line){var m=line.match(/^(\d{1,2}[:.]\d{2})\s*(?:-|–|—|:)\s*(.*)$/);if(m){start(m[1]);add(m[2]);}else add(line);});return groups;}
  function itemKey(k,time,title){return [k,displayTime(time).toLowerCase(),norm(title).toLowerCase()].join('|');}

  function allowedKeys(){var m={};targetDates().forEach(function(d){m[dateKey(d)]=true;});return m;}
  function parseWeek(){var root=document.getElementById('week-source');if(!root||!root.querySelector('table'))return null;var allowed=allowedKeys(),store={};Object.keys(allowed).forEach(function(k){store[k]=[];});root.querySelectorAll('tr').forEach(function(tr){if(tr.querySelector('th'))return;var cells=[].slice.call(tr.cells);if(cells.length<2)return;var vals=cells.map(function(c){return norm(c.textContent);}),ti=vals.findIndex(isTime);if(ti<0)return;var date=parseDate(vals[Math.max(0,ti-1)])||parseDate(tr.textContent);if(!date)return;var dk=dateKey(date);if(!allowed[dk])return;var time=displayTime(vals[ti]),title=vals[ti+1]||'',resource=vals[ti+2]||vals[vals.length-1]||'';if(!title)return;var list=store[dk],found=null;for(var i=0;i<list.length;i++)if(list[i].time===time&&list[i].title===title){found=list[i];break;}if(!found){found={date:date,time:time,title:title,resources:[]};list.push(found);}if(resource)found.resources.push(resource);});return store;}
  function parseInfo(){var root=document.getElementById('info-source');if(!root||!root.querySelector('table'))return null;var allowed=allowedKeys(),map={},records=[];root.querySelectorAll('tr').forEach(function(tr){if(tr.querySelector('th'))return;var cells=[].slice.call(tr.cells);if(!cells.length)return;var vals=cells.map(function(c){return norm(c.textContent);}),ti=vals.findIndex(isTime);if(ti<0)return;var date=parseDate(vals[Math.max(0,ti-1)])||parseDate(tr.textContent);if(!date)return;var dk=dateKey(date);if(!allowed[dk])return;var title=vals[ti+1]||'',info=cells[ti+2]?raw(cells[ti+2]):'';if(!title||!norm(info)||/^(-|ingen|intet)$/i.test(norm(info)))return;var time=displayTime(vals[ti]);map[itemKey(dk,time,title)]=info;records.push({date:date,time:time,title:title,info:info,key:dk});});return {map:map,records:records};}

  // Readability fix: rather than shrinking text into an unreadable "ultra" tier,
  // cap visible bookings and surface the remainder as a "+N mere" line.
  function truncateToFit(box){
    var rows=Array.prototype.slice.call(box.querySelectorAll('.booking'));
    var more=box.querySelector('.more-indicator');
    if(!more){more=document.createElement('div');more.className='more-indicator';box.appendChild(more);}
    more.style.display='none';
    rows.forEach(function(r){r.style.display='';});
    if(box.scrollHeight<=box.clientHeight+2)return;
    more.style.display='block';more.textContent='+ ';
    var hidden=0;
    for(var i=rows.length-1;i>0;i--){
      rows[i].style.display='none';hidden++;
      if(box.scrollHeight<=box.clientHeight+2)break;
    }
    if(hidden>0)more.textContent='+ '+hidden+' mere';else more.style.display='none';
  }
  function fit(card){
    if(!card)return;
    var box=card.querySelector('.bookings');
    if(!box)return;
    card.classList.remove('dense');
    var more=box.querySelector('.more-indicator');if(more)more.style.display='none';
    box.querySelectorAll('.booking').forEach(function(r){r.style.display='';});
    if(box.scrollHeight>box.clientHeight+2)card.classList.add('dense');
    if(box.scrollHeight>box.clientHeight+2)truncateToFit(box);
  }
  function renderWeek(store,infoMap){document.querySelectorAll('[data-slot]').forEach(function(card){var dk=card.getAttribute('data-key'),box=card.querySelector('[data-bookings]'),items=store[dk]||[];box.innerHTML='';items.forEach(function(item){var info=infoMap[itemKey(dk,item.time,item.title)]||'',row=document.createElement('div');row.className='booking'+(info?' has-info':'');row.innerHTML='<div class="booking-time">'+esc(item.time)+'</div><div class="booking-title">'+esc(item.title)+'</div><div class="booking-resource">'+esc(mergeResources(item.resources))+'</div>'+(info?'<div class="booking-info">'+esc(compactInfo(info))+'</div>':'');box.appendChild(row);});if(!items.length)box.innerHTML='<div class="empty">Ingen bookinger</div>';var c=card.querySelector('[data-count]');if(c)c.textContent=items.length+' bookinger';fit(card);});}
  function renderNext(records){var p=localParts(),now=(((+p.year)*10000+(+p.month)*100+(+p.day))*1440)+(+p.hour*60+ +p.minute),best=null;records.forEach(function(r){var tm=r.time.match(/(\d{1,2}):(\d{2})/);if(!tm)return;var k=((r.date.y*10000+r.date.m*100+r.date.d)*1440)+(+tm[1]*60+ +tm[2]);if(k<now)return;if(!best||k<best.k)best={k:k,r:r};});var when=document.getElementById('info-when'),title=document.getElementById('info-title'),sum=document.getElementById('info-summary');if(!best){when.textContent='Ingen kommende info';title.textContent='Der er ingen kommende praktiske noter i perioden';sum.innerHTML='';return;}var r=best.r;when.textContent=shortDay(r.date)+' · '+r.time;title.textContent=r.title;sum.innerHTML=infoGroups(r.info).map(function(g){return '<div class="info-group">'+(g.time?'<b>kl. '+esc(g.time)+'</b>':'')+g.items.map(function(x){return '<span>'+esc(x)+'</span>';}).join('')+'</div>';}).join('');}

  var dayKey=dateKey(dateObj(todayUTC()));setupSlots();
  var tries=0,t=setInterval(function(){tries++;var week=parseWeek(),info=parseInfo();if(week&&info){clearInterval(t);renderWeek(week,info.map);renderNext(info.records);setTimeout(function(){document.querySelectorAll('.day-card').forEach(fit);scale();},300);}else if(tries>60)clearInterval(t);},300);
  setInterval(function(){location.reload();},300000);
  setInterval(function(){var k=dateKey(dateObj(todayUTC()));if(k!==dayKey)location.reload();},15000);
})();
