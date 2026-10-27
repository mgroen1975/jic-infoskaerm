(function(){
  var TZ='Europe/Copenhagen';
  var days=['mandag','tirsdag','onsdag','torsdag','fredag','lørdag','søndag'];
  var aliases={mandag:['mandag','monday'],tirsdag:['tirsdag','tuesday'],onsdag:['onsdag','wednesday'],torsdag:['torsdag','thursday'],fredag:['fredag','friday'],'lørdag':['lørdag','lordag','saturday'],'søndag':['søndag','sondag','sunday']};

  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function raw(el){return String((el&&(el.innerText||el.textContent))||'').replace(/\r/g,'').trim();}
  function esc(s){return String(s||'').replace(/[&<>\"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'})[c];});}
  function scale(){document.documentElement.style.setProperty('--scale',String(Math.min(innerWidth/1920,innerHeight/1080)));}
  scale();addEventListener('resize',scale);

  function localParts(){
    var p=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(new Date()),o={};
    p.forEach(function(x){o[x.type]=x.value;});return o;
  }
  function isoWeek(y,m,d){var x=new Date(Date.UTC(y,m-1,d)),wd=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-wd);var ys=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil((((x-ys)/86400000)+1)/7);}
  function weekMonday(){var p=localParts(),d=new Date(Date.UTC(+p.year,+p.month-1,+p.day));if(p.weekday==='Sun'&&(+p.hour>0||+p.minute>=1))d.setUTCDate(d.getUTCDate()+1);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()||7)-1));return d;}
  function dayOf(text){var s=norm(text).toLowerCase();for(var i=0;i<days.length;i++){var a=aliases[days[i]];for(var j=0;j<a.length;j++)if(s.indexOf(a[j])>-1)return days[i];}return null;}
  function dayFromDate(date){if(!date)return null;return new Intl.DateTimeFormat('da-DK',{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(date.y,date.m-1,date.d))).toLowerCase();}
  function dateForDay(day){var m=weekMonday(),i=days.indexOf(day);if(i<0)return null;var d=new Date(m);d.setUTCDate(m.getUTCDate()+i);return {y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()};}
  function isTime(s){return /\b\d{1,2}[:.]\d{2}(?:\s*(?:-|–|—)\s*\d{1,2}[:.]\d{2})?\b/.test(s||'');}
  function displayTime(s){var r=String(s||'').match(/(\d{1,2}[:.]\d{2})\s*(?:-|–|—|til)\s*(\d{1,2}[:.]\d{2})/i);if(r)return r[1].replace('.',':')+'–'+r[2].replace('.',':');var one=String(s||'').match(/(\d{1,2}[:.]\d{2})/);return one?one[1].replace('.',':'):norm(s);}
  function parseDate(s){var m=String(s||'').match(/(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);return m?{d:+m[1],m:+m[2],y:+m[3]}:null;}
  function shortDay(date){var map={mandag:'Man.',tirsdag:'Tir.',onsdag:'Ons.',torsdag:'Tor.',fredag:'Fre.',lørdag:'Lør.',søndag:'Søn.'};var wd=dayFromDate(date);var dm=new Intl.DateTimeFormat('da-DK',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(Date.UTC(date.y,date.m-1,date.d)));return (map[wd]||wd)+' '+dm;}
  function labels(){var mon=weekMonday(),today=localParts();document.getElementById('week-number').textContent='Uge '+isoWeek(mon.getUTCFullYear(),mon.getUTCMonth()+1,mon.getUTCDate());days.forEach(function(day,i){var d=new Date(mon);d.setUTCDate(mon.getUTCDate()+i);var label=new Intl.DateTimeFormat('da-DK',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(d);var el=document.querySelector('[data-date="'+day+'"]');if(el)el.textContent=label;var card=document.querySelector('[data-day="'+day+'"]');if(card&&d.getUTCFullYear()===+today.year&&d.getUTCMonth()+1===+today.month&&d.getUTCDate()===+today.day)card.classList.add('is-today');});}

  function cleanResource(s){
    s=norm(s);if(!s)return'';
    var g=/\bGamma\b/i.test(s),z=/\bZeta\b/i.test(s);if(g||z){var r=[];if(g)r.push('Gamma');if(z)r.push('Zeta');return r.join(' + ');}
    var p=/25\s*meter|25\s*m\b/i.test(s),w=/varmtvand/i.test(s);if(p&&w)return'25 m + varmtvand';if(p)return'25 m';if(w)return'Varmtvand';
    var h=[];if(/\bHal\s*A\b/i.test(s))h.push('A');if(/\bHal\s*B\b/i.test(s))h.push('B');if(h.length>1)return'Hal '+h.join(' + ');if(h.length===1)return'Hal '+h[0];
    return s.replace(/^Opholdsrum\s+/i,'').replace(/^Mødelokale\s+/i,'').replace(/^Svøm\s+/i,'').replace(/^Springcenter$/i,'Spring');
  }
  function mergeResources(list){var out=[];list.forEach(function(r){r=cleanResource(r);if(r&&out.indexOf(r)<0)out.push(r);});if(out.indexOf('25 m')>-1&&out.indexOf('Varmtvand')>-1){out=out.filter(function(x){return x!=='25 m'&&x!=='Varmtvand';});out.unshift('25 m + varmtvand');}if(out.indexOf('Gamma')>-1&&out.indexOf('Zeta')>-1){out=out.filter(function(x){return x!=='Gamma'&&x!=='Zeta';});out.unshift('Gamma + Zeta');}if(out.indexOf('Hal A')>-1&&out.indexOf('Hal B')>-1){out=out.filter(function(x){return x!=='Hal A'&&x!=='Hal B';});out.unshift('Hal A + B');}return out.join(' · ');}
  function compactInfo(s){s=String(s||'').replace(/\r/g,'\n').trim();if(!s)return'';return s.split(/\n+/).map(function(x){return norm(x).replace(/^[•·*-]\s*/,'');}).filter(Boolean).join(' · ').replace(/\s+(?:-|–|—)\s+/g,' · ');}
  function infoGroups(s){s=String(s||'').replace(/\r/g,'\n').trim();if(!s)return[];s=s.replace(/([^\n])\s+(?=\d{1,2}[:.]\d{2}\s*(?:-|–|—|:))/g,'$1\n');var lines=s.split(/\n+/).map(function(x){return x.trim();}).filter(Boolean),groups=[],cur=null;function start(t){cur={time:String(t||'').replace('.',':'),items:[]};groups.push(cur);}function add(t){t=norm(t).replace(/^[•·*-]\s*/,'');if(!t)return;if(!cur)start('');t.split(/\s+(?:-|–|—)\s+/).map(norm).filter(Boolean).forEach(function(x){cur.items.push(x);});}lines.forEach(function(line){var m=line.match(/^(\d{1,2}[:.]\d{2})\s*(?:-|–|—|:)\s*(.*)$/);if(m){start(m[1]);add(m[2]);}else if(/^\d{1,2}[:.]\d{2}$/.test(line)){start(line);}else add(line);});return groups.filter(function(g){return g.items.length||g.time;});}
  function key(day,time,title){return [day,displayTime(time).toLowerCase(),norm(title).toLowerCase()].join('|');}

  function parseWeek(){
    var root=document.getElementById('week-source');if(!root||!root.querySelector('table'))return null;
    var store={};days.forEach(function(d){store[d]=[];});var current=null;
    root.querySelectorAll('table').forEach(function(tb){var tableDay=dayOf((tb.querySelector('caption')||{}).textContent||'');tb.querySelectorAll('tr').forEach(function(tr){if(tr.querySelector('th')){var hd=dayOf(norm(tr.textContent));if(hd)current=hd;return;}var cells=[].slice.call(tr.cells),rd=dayOf(norm(tr.textContent));if(rd&&cells.length<=2){current=rd;return;}if(tableDay)current=tableDay;if(!current||cells.length<2)return;var all=cells.map(function(c){return norm(c.textContent);}),ti=all.findIndex(isTime);if(ti<0)return;var time=displayTime(all[ti]),title=all[ti+1]||'',resource=all[ti+2]||all[all.length-1]||'';if(!title||/^(tid|titel|ressource)$/i.test(title))return;var list=store[current],found=null;for(var i=0;i<list.length;i++)if(list[i].time===time&&list[i].title===title){found=list[i];break;}if(!found){found={day:current,time:time,title:title,resources:[],info:''};list.push(found);}if(resource)found.resources.push(resource);});});return store;
  }

  function parseInfo(){
    var root=document.getElementById('info-source');if(!root||!root.querySelector('table'))return null;
    var map={},records=[],current=null;
    root.querySelectorAll('table').forEach(function(tb){
      var tableDay=dayOf((tb.querySelector('caption')||{}).textContent||'');
      tb.querySelectorAll('tr').forEach(function(tr){
        var cells=[].slice.call(tr.cells);if(!cells.length){var hd=dayOf(norm(tr.textContent));if(hd)current=hd;return;}
        var all=cells.map(function(c){return norm(c.textContent);});
        var ti=all.findIndex(isTime);if(ti<0){var maybeDay=dayOf(norm(tr.textContent));if(maybeDay)current=maybeDay;return;}
        var rowText=norm(tr.textContent);
        var date=parseDate(all[Math.max(0,ti-1)])||parseDate(rowText);
        var day=(date&&dayFromDate(date))||tableDay||current||dayOf(rowText);
        if(!day)return;
        var title=all[ti+1]||'';
        var infoCell=cells[ti+2]||null;
        var info=infoCell?raw(infoCell):'';
        if(!title||!norm(info)||/^(-|ingen|intet)$/i.test(norm(info)))return;
        var time=displayTime(all[ti]);
        if(!date)date=dateForDay(day);
        var rec={day:day,time:time,title:title,info:info,date:date};
        map[key(day,time,title)]=info;
        records.push(rec);
        current=day;
      });
    });
    return {map:map,records:records};
  }

  function renderWeek(store,infoMap){days.forEach(function(day){var box=document.querySelector('[data-bookings="'+day+'"]');if(!box)return;box.innerHTML='';var items=store[day]||[];items.forEach(function(item){item.info=infoMap[key(day,item.time,item.title)]||'';var row=document.createElement('div');row.className='booking'+(item.info?' has-info':'');row.innerHTML='<div class="booking-time">'+esc(item.time)+'</div><div class="booking-title">'+esc(item.title)+'</div><div class="booking-resource">'+esc(mergeResources(item.resources))+'</div>'+(item.info?'<div class="booking-info">'+esc(compactInfo(item.info))+'</div>':'');box.appendChild(row);});if(!items.length)box.innerHTML='<div class="empty">Ingen bookinger</div>';var c=document.querySelector('[data-count="'+day+'"]');if(c)c.textContent=items.length+' bookinger';fit(box.closest('.day-card'));});}
  function fit(card){if(!card)return;var box=card.querySelector('.bookings');if(!box)return;card.classList.remove('dense','ultra');if(box.scrollHeight>box.clientHeight+2)card.classList.add('dense');if(box.scrollHeight>box.clientHeight+2)card.classList.add('ultra');}

  function renderNext(records){
    var p=localParts(),now=(((+p.year)*10000+(+p.month)*100+(+p.day))*1440)+((+p.hour)*60+(+p.minute)),best=null;
    records.forEach(function(r){if(!r.date)return;var tm=String(r.time).match(/(\d{1,2}):(\d{2})/);if(!tm)return;var k=(((r.date.y*10000+r.date.m*100+r.date.d))*1440)+(+tm[1]*60+ +tm[2]);if(k<now)return;if(!best||k<best.k)best={k:k,r:r};});
    var when=document.getElementById('info-when'),title=document.getElementById('info-title'),sum=document.getElementById('info-summary');
    if(!best){when.textContent='Ingen kommende info';title.textContent='Der er ingen kommende praktiske noter i perioden';sum.innerHTML='';return;}
    var r=best.r;when.textContent=(r.date?shortDay(r.date)+' · ':'')+r.time;title.textContent=r.title;var groups=infoGroups(r.info);sum.innerHTML=groups.map(function(g){return '<div class="info-group">'+(g.time?'<b>kl. '+esc(g.time)+'</b>':'')+g.items.map(function(item){return '<span>'+esc(item)+'</span>';}).join('')+'</div>';}).join('');
  }

  labels();
  var tries=0,t=setInterval(function(){tries++;var week=parseWeek(),info=parseInfo();if(week&&info){clearInterval(t);renderWeek(week,info.map);renderNext(info.records);setTimeout(function(){document.querySelectorAll('.day-card').forEach(fit);},300);}else if(tries>60)clearInterval(t);},300);
  setInterval(function(){location.reload();},300000);
})();
