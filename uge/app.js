(function(){
  var TZ='Europe/Copenhagen';
  var days=['mandag','tirsdag','onsdag','torsdag','fredag','lørdag','søndag'];
  var aliases={mandag:['mandag','monday'],tirsdag:['tirsdag','tuesday'],onsdag:['onsdag','wednesday'],torsdag:['torsdag','thursday'],fredag:['fredag','friday'],'lørdag':['lørdag','lordag','saturday'],'søndag':['søndag','sondag','sunday']};

  function scale(){document.documentElement.style.setProperty('--scale',String(Math.min(innerWidth/1920,innerHeight/1080)));}
  scale();addEventListener('resize',scale);
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function raw(c){return String((c&&(c.innerText||c.textContent))||'').replace(/\r/g,'').trim();}
  function esc(s){return String(s||'').replace(/[&<>\"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
  function parts(){var p=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(new Date()),o={};p.forEach(function(x){o[x.type]=x.value;});return o;}
  function isoWeek(y,m,d){var x=new Date(Date.UTC(y,m-1,d)),wd=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-wd);var ys=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil((((x-ys)/86400000)+1)/7);}
  function monday(){var p=parts(),d=new Date(Date.UTC(+p.year,+p.month-1,+p.day));if(p.weekday==='Sun'&&(+p.hour>0||+p.minute>=1))d.setUTCDate(d.getUTCDate()+1);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()||7)-1));return d;}
  function labels(){var m=monday();document.getElementById('week-number').textContent='Uge '+isoWeek(m.getUTCFullYear(),m.getUTCMonth()+1,m.getUTCDate());days.forEach(function(day,i){var d=new Date(m);d.setUTCDate(m.getUTCDate()+i);var el=document.querySelector('[data-date="'+day+'"]');if(el)el.textContent=new Intl.DateTimeFormat('da-DK',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(d);});}
  function dayOf(s){s=norm(s).toLowerCase();for(var i=0;i<days.length;i++){var a=aliases[days[i]];for(var j=0;j<a.length;j++)if(s.indexOf(a[j])>-1)return days[i];}return null;}
  function isTime(s){return /\b\d{1,2}[:.]\d{2}(?:\s*(?:-|–|—)\s*\d{1,2}[:.]\d{2})?\b/.test(s||'');}
  function displayTime(s){var r=String(s||'').match(/(\d{1,2}[:.]\d{2})\s*(?:-|–|—|til)\s*(\d{1,2}[:.]\d{2})/i);if(r)return r[1].replace('.',':')+'–'+r[2].replace('.',':');var one=String(s||'').match(/(\d{1,2}[:.]\d{2})/);return one?one[1].replace('.',':'):norm(s);}

  function cleanResource(s){
    s=norm(s);if(!s)return'';
    var hasGamma=/\bGamma\b/i.test(s),hasZeta=/\bZeta\b/i.test(s);
    if(hasGamma||hasZeta){var rooms=[];if(hasGamma)rooms.push('Gamma');if(hasZeta)rooms.push('Zeta');return rooms.join(' + ');}
    var has25=/25\s*meter|25\s*m\b/i.test(s),hasWarm=/varmtvand/i.test(s);
    if(has25&&hasWarm)return'25 m + varmtvand';
    if(has25)return'25 m';
    if(hasWarm)return'Varmtvand';
    var halls=[];if(/\bHal\s*A\b/i.test(s))halls.push('A');if(/\bHal\s*B\b/i.test(s))halls.push('B');if(halls.length>1)return'Hal '+halls.join(' + ');if(halls.length===1)return'Hal '+halls[0];
    return s.replace(/^Opholdsrum\s+/i,'').replace(/^Mødelokale\s+/i,'').replace(/^Svøm\s+/i,'').replace(/^Springcenter$/i,'Spring');
  }
  function mergeResources(list){
    var out=[];list.forEach(function(r){r=cleanResource(r);if(r&&out.indexOf(r)<0)out.push(r);});
    if(out.indexOf('25 m')>-1&&out.indexOf('Varmtvand')>-1){out=out.filter(function(x){return x!=='25 m'&&x!=='Varmtvand';});out.unshift('25 m + varmtvand');}
    if(out.indexOf('Gamma')>-1&&out.indexOf('Zeta')>-1){out=out.filter(function(x){return x!=='Gamma'&&x!=='Zeta';});out.unshift('Gamma + Zeta');}
    if(out.indexOf('Hal A')>-1&&out.indexOf('Hal B')>-1){out=out.filter(function(x){return x!=='Hal A'&&x!=='Hal B';});out.unshift('Hal A + B');}
    return out.join(' · ');
  }

  function headerMap(table){
    var map={};
    [].slice.call(table.querySelectorAll('tr')).some(function(tr){
      var ths=[].slice.call(tr.querySelectorAll('th'));if(!ths.length)return false;
      ths.forEach(function(th,i){var t=norm(th.textContent).toLowerCase();if(t.indexOf('dato')>-1)map.date=i;if(t.indexOf('tid')>-1)map.time=i;if(t.indexOf('titel')>-1)map.title=i;if(t.indexOf('info')>-1)map.info=i;if(t.indexOf('ressource')>-1)map.resource=i;});
      return Object.keys(map).length>0;
    });
    return map;
  }
  function compactInfo(text){
    var s=String(text||'').replace(/\r/g,'\n').trim();if(!s)return'';
    var lines=s.split(/\n+/).map(function(x){return norm(x).replace(/^[•·*-]\s*/,'');}).filter(Boolean);
    s=lines.join(' · ').replace(/\s+(?:-|–|—)\s+/g,' · ').replace(/\s*·\s*/g,' · ');
    return s;
  }
  function infoKey(day,time,title){return [day,displayTime(time),norm(title).toLowerCase()].join('|');}

  function buildInfoMap(){
    var root=document.getElementById('info-source');if(!root)return {ready:false,map:{}};
    var tables=root.querySelectorAll('table');if(!tables.length)return {ready:false,map:{}};
    var map={},current=null;
    tables.forEach(function(table){
      var tableDay=dayOf((table.querySelector('caption')||{}).textContent||''),h=headerMap(table);
      table.querySelectorAll('tr').forEach(function(tr){
        var rowText=norm(tr.textContent),rowDay=dayOf(rowText);
        if(rowDay&&(tr.querySelector('th')||tr.cells.length<=2)){current=rowDay;return;}
        if(tableDay)current=tableDay;
        if(tr.querySelector('th')||!current)return;
        var cells=[].slice.call(tr.cells);if(!cells.length)return;
        var ti=h.time!=null?h.time:cells.map(function(c){return norm(c.textContent);}).findIndex(isTime);if(ti<0||!cells[ti])return;
        var title=h.title!=null&&cells[h.title]?norm(cells[h.title].textContent):norm(cells[ti+1]&&cells[ti+1].textContent);
        if(!title)return;
        var info='';
        if(h.info!=null&&cells[h.info])info=compactInfo(raw(cells[h.info]));
        if(!info){
          var cellTexts=cells.map(function(c){return raw(c);});
          var resourceText=h.resource!=null&&cells[h.resource]?norm(cells[h.resource].textContent):'';
          for(var i=0;i<cellTexts.length;i++){
            var v=compactInfo(cellTexts[i]);
            if(!v||i===ti||v===title||v===resourceText||/\d{1,2}[-./]\d{1,2}[-./]\d{4}/.test(v))continue;
            if(i>ti+1&&i<cells.length-1){info=v;break;}
          }
        }
        if(info)map[infoKey(current,norm(cells[ti].textContent),title)]=info;
      });
    });
    return {ready:true,map:map};
  }

  function parseWeek(infoMap){
    var root=document.getElementById('week-source');if(!root)return false;
    var store={};days.forEach(function(d){store[d]=[];});var current=null,count=0;
    root.querySelectorAll('table').forEach(function(table){
      var tableDay=dayOf((table.querySelector('caption')||{}).textContent||''),h=headerMap(table);
      table.querySelectorAll('tr').forEach(function(tr){
        if(tr.querySelector('th')){var hd=dayOf(norm(tr.textContent));if(hd)current=hd;return;}
        var cells=[].slice.call(tr.cells),rowDay=dayOf(norm(tr.textContent));
        if(rowDay&&cells.length<=2){current=rowDay;return;}if(tableDay)current=tableDay;if(!current||cells.length<2)return;
        var ti=h.time!=null?h.time:cells.map(function(c){return norm(c.textContent);}).findIndex(isTime);if(ti<0||!cells[ti])return;
        var time=displayTime(norm(cells[ti].textContent));
        var title=h.title!=null&&cells[h.title]?norm(cells[h.title].textContent):norm(cells[ti+1]&&cells[ti+1].textContent);
        if(!title||/^(tid|titel)$/i.test(title))return;
        var resource=h.resource!=null&&cells[h.resource]?norm(cells[h.resource].textContent):norm(cells[cells.length-1]&&cells[cells.length-1].textContent);
        var info=infoMap[infoKey(current,time,title)]||'';
        var list=store[current],found=null,key=time+'|'+title+'|'+info;
        for(var i=0;i<list.length;i++)if(list[i].key===key){found=list[i];break;}
        if(!found){found={key:key,time:time,title:title,info:info,resources:[]};list.push(found);}if(resource)found.resources.push(resource);count++;
      });
    });
    if(count)render(store);return count>0;
  }

  function render(store){
    days.forEach(function(day){
      var box=document.querySelector('[data-bookings="'+day+'"]');if(!box)return;box.innerHTML='';var items=store[day]||[];
      if(!items.length){box.innerHTML='<div class="empty">Ingen bookinger</div>';return;}
      items.forEach(function(item){
        var res=mergeResources(item.resources),row=document.createElement('div');row.className='booking'+(item.info?' has-info':'');
        row.innerHTML='<div class="booking-time">'+esc(item.time)+'</div><div class="booking-main"><div class="booking-title">'+esc(item.title)+'</div>'+(item.info?'<div class="booking-info"><span>INFO</span>'+esc(item.info)+'</div>':'')+'</div><div class="booking-resource">'+esc(res||'')+'</div>';
        box.appendChild(row);
      });
      fit(box.closest('.day-card'));
    });
  }
  function fit(card){if(!card||card.classList.contains('note-card'))return;var box=card.querySelector('.bookings');card.classList.remove('dense','very-dense');if(box.scrollHeight>box.clientHeight+2)card.classList.add('dense');if(box.scrollHeight>box.clientHeight+2)card.classList.add('very-dense');}
  function fitAll(){document.querySelectorAll('.day-card').forEach(fit);}

  labels();
  var tries=0,tm=setInterval(function(){
    tries++;
    var infoState=buildInfoMap();
    if(infoState.ready&&parseWeek(infoState.map)){
      clearInterval(tm);setTimeout(fitAll,350);setTimeout(fitAll,1200);
    }else if(tries>60){clearInterval(tm);}
  },300);
  setInterval(function(){location.reload();},300000);
})();