(function(){
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function shortResource(s){
    s=norm(s);
    if(!s)return'';
    s=s.replace(/^Svøm\s*25\s*meter\s*bassin$/i,'25 m bassin')
       .replace(/^Svøm\s*varmtvandsbassin$/i,'Varmtvand')
       .replace(/^Opholdsrum\s+/i,'')
       .replace(/^Mødelokale\s+/i,'')
       .replace(/^Springcenter$/i,'Spring')
       .replace(/^Svøm\s+/i,'');
    return s;
  }
  function combined(resources){
    var a=resources.map(shortResource).filter(Boolean);
    if(a.length===2 && a.indexOf('25 m bassin')>-1 && a.indexOf('Varmtvand')>-1)return'25 m + varmtvand';
    if(a.length===2 && /^Hal [A-Z]$/i.test(a[0]) && /^Hal [A-Z]$/i.test(a[1]))return a[0]+' + '+a[1].replace(/^Hal\s+/i,'');
    return a.join(' + ');
  }
  function addStyles(){
    if(document.getElementById('week-polish-style'))return;
    var st=document.createElement('style');
    st.id='week-polish-style';
    st.textContent='\n.resource-short{display:none}\n.day-card.dense .resource-list,.day-card.very-dense .resource-list{display:none!important}\n.day-card.dense .resource-short,.day-card.very-dense .resource-short{display:block;max-width:78px;text-align:right;color:#607889;font-size:8.9px;font-weight:700;line-height:1.05;white-space:normal;overflow:hidden}\n.day-card.very-dense .resource-short{font-size:8.4px}\n.day-card.dense .booking,.day-card.very-dense .booking{grid-template-columns:minmax(0,1fr) 78px!important}\n.day-card.dense .booking{font-size:10.3px!important}\n.day-card.very-dense .booking{font-size:9.6px!important}\n';
    document.head.appendChild(st);
  }
  function polish(){
    var rows=document.querySelectorAll('.day-card:not(.note-card) .booking');
    if(!rows.length)return false;
    rows.forEach(function(row){
      if(row.querySelector('.resource-short'))return;
      var resources=[].slice.call(row.querySelectorAll('.resource-list li')).map(function(li){return norm(li.textContent);}).filter(Boolean);
      if(!resources.length)return;
      var el=document.createElement('div');
      el.className='resource-short';
      el.textContent=combined(resources);
      row.appendChild(el);
    });
    return true;
  }
  addStyles();
  var tries=0,t=setInterval(function(){tries++;if(polish()||tries>60)clearInterval(t);},250);
  setTimeout(polish,1500);
  setTimeout(polish,3000);
})();