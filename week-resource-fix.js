(function(){
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function esc(s){return String(s||'').replace(/[&<>\"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
  var days=['mandag','tirsdag','onsdag','torsdag','fredag','lørdag','søndag'];
  var aliases={mandag:['mandag','monday'],tirsdag:['tirsdag','tuesday'],onsdag:['onsdag','wednesday'],torsdag:['torsdag','thursday'],fredag:['fredag','friday'],'lørdag':['lørdag','lordag','saturday'],'søndag':['søndag','sondag','sunday']};
  function dayOf(t){t=norm(t).toLowerCase();for(var i=0;i<days.length;i++){for(var j=0;j<aliases[days[i]].length;j++)if(t.indexOf(aliases[days[i]][j])>-1)return days[i];}return null;}
  function isTime(s){return /\b\d{1,2}[:.]\d{2}(?:\s*(?:-|–|—)\s*\d{1,2}[:.]\d{2})?\b/.test(s||'');}
  function cleanOne(s){
    s=norm(s);
    if(!s)return'';
    var hasSpecific=/(?:Gamma|Zeta)/i.test(s);
    if(hasSpecific&&/Karlsvognen/i.test(s)){
      s=s.replace(/Mødelokale\s+Karlsvognen/ig,'').replace(/\bKarlsvognen\b/ig,'').replace(/\s{2,}/g,' ').trim();
    }
    return s;
  }
  function cleanList(list){
    var out=[],hasSpecific=list.some(function(x){return /(?:Gamma|Zeta)/i.test(x);});
    list.forEach(function(x){
      x=cleanOne(x);
      if(!x)return;
      if(hasSpecific&&/Karlsvognen/i.test(x)&&!/(?:Gamma|Zeta)/i.test(x))return;
      if(out.indexOf(x)<0)out.push(x);
    });
    return out;
  }
  function short(s){
    s=norm(s);
    if(!s)return'';
    return s.replace(/^Svøm\s*25\s*meter\s*bassin$/i,'25 m bassin')
      .replace(/^Svøm\s*varmtvandsbassin$/i,'Varmtvand')
      .replace(/^Opholdsrum\s+/i,'')
      .replace(/^Mødelokale\s+/i,'')
      .replace(/^Springcenter$/i,'Spring')
      .replace(/^Svøm\s+/i,'');
  }
  function combine(list){
    var a=list.map(short).filter(Boolean);
    if(a.length===2&&a.indexOf('25 m bassin')>-1&&a.indexOf('Varmtvand')>-1)return'25 m + varmtvand';
    if(a.length===2&&a.indexOf('Gamma')>-1&&a.indexOf('Zeta')>-1)return'Gamma + Zeta';
    if(a.length===2&&/^Hal [A-Z]$/i.test(a[0])&&/^Hal [A-Z]$/i.test(a[1]))return a[0]+' + '+a[1].replace(/^Hal\s+/i,'');
    return a.join(' + ');
  }
  function buildMap(){
    var root=document.getElementById('week-source');
    if(!root||!root.querySelector('table'))return null;
    var map={},cur=null;
    root.querySelectorAll('table').forEach(function(tb){
      var td=dayOf((tb.querySelector('caption')||{}).textContent||'');
      tb.querySelectorAll('tr').forEach(function(tr){
        var cells=[].slice.call(tr.cells).map(function(c){return norm(c.textContent);}).filter(Boolean);
        var rd=dayOf(norm(tr.textContent));
        if(rd&&(tr.querySelector('th')||cells.length<=2)){cur=rd;return;}
        if(td)cur=td;
        if(!cur||cells.length<2||cells.some(function(c){return /^(tid|titel|ressource)$/i.test(c);}))return;
        var i=cells.findIndex(isTime);if(i<0)return;
        var time=cells[i],title=cells[i+1]||'',res=cells[i+2]||cells[cells.length-1]||'';
        if(!time||!title)return;
        var key=cur+'|'+norm(time).toLowerCase()+'|'+norm(title).toLowerCase();
        if(!map[key])map[key]=[];
        if(res&&map[key].indexOf(res)<0)map[key].push(res);
      });
    });
    return map;
  }
  function fix(){
    var map=buildMap();if(!map)return false;
    var changed=false;
    days.forEach(function(day){
      var box=document.querySelector('[data-bookings="'+day+'"]');if(!box)return;
      [].slice.call(box.querySelectorAll('.booking')).forEach(function(row){
        var time=norm((row.querySelector('.booking-time')||{}).textContent||'');
        var title=norm((row.querySelector('.booking-title')||{}).textContent||'');
        var key=day+'|'+time.toLowerCase()+'|'+title.toLowerCase();
        var resources=cleanList(map[key]||[]);if(!resources.length)return;
        var ul=row.querySelector('.resource-list');
        if(!ul){ul=document.createElement('ul');ul.className='resource-list';row.appendChild(ul);}
        ul.innerHTML=resources.map(function(r){return'<li>'+esc(r)+'</li>';}).join('');
        var rs=row.querySelector('.resource-short');
        if(rs)rs.textContent=combine(resources);
        changed=true;
      });
    });
    return changed;
  }
  var tries=0,t=setInterval(function(){tries++;if(fix()||tries>60)clearInterval(t);},250);
  setTimeout(fix,1500);setTimeout(fix,3000);
})();