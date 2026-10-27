(function(){
  var TZ='Europe/Copenhagen';
  function norm(s){return (s||'').replace(/\s+/g,' ').trim();}
  function rawText(el){return String((el&&(el.innerText||el.textContent))||'').replace(/\r/g,'').trim();}
  function nowParts(){var p=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),o={};p.forEach(function(x){o[x.type]=x.value;});return o;}
  function keyFrom(y,m,d,h,min){return (((+y)*10000+(+m)*100+(+d))*1440)+((+h)*60+(+min));}
  function parseDate(s){var m=String(s||'').match(/(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);return m?{d:+m[1],m:+m[2],y:+m[3]}:null;}
  function parseTime(s){var m=String(s||'').match(/(\d{1,2})[:.](\d{2})/);return m?{h:+m[1],min:+m[2]}:null;}
  function displayTime(s){var range=String(s||'').match(/(\d{1,2}[:.]\d{2})\s*(?:-|–|—|til)\s*(\d{1,2}[:.]\d{2})/i);if(range)return range[1].replace('.',':')+'–'+range[2].replace('.',':');var one=String(s||'').match(/(\d{1,2}[:.]\d{2})/);return one?one[1].replace('.',':'):norm(s);}
  function esc(s){return String(s||'').replace(/[&<>\"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];});}
  function shortDayName(y,m,d){var map={mandag:'Man.',tirsdag:'Tir.',onsdag:'Ons.',torsdag:'Tor.',fredag:'Fre.',lørdag:'Lør.',søndag:'Søn.'};var wd=new Intl.DateTimeFormat('da-DK',{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d))).toLowerCase();var dm=new Intl.DateTimeFormat('da-DK',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)));return (map[wd]||wd)+' '+dm;}
  function ensureBox(){var card=document.querySelector('.note-card');if(!card)return null;var box=document.getElementById('next-info-highlight');if(box)return box;box=document.createElement('div');box.id='next-info-highlight';box.className='next-info-box';var head=card.querySelector('.day-head');if(head&&head.nextSibling)card.insertBefore(box,head.nextSibling);else card.appendChild(box);card.classList.add('has-next-info');return box;}

  function cleanItem(s){return String(s||'').trim().replace(/^[•·*]\s*/,'').replace(/^[-–—]\s*/,'').trim();}
  function splitItems(s){
    s=String(s||'').trim();
    if(!s)return [];
    return s.split(/\s+(?:-|–|—)\s+/).map(cleanItem).filter(Boolean);
  }

  function parseChecklist(info){
    var s=String(info||'').replace(/\r/g,'\n').trim();
    if(!s)return [];
    s=s.replace(/(^|\s)([-•·*]?\s*\d{1,2}[:.]\d{2})(?=\s|$)/g,function(_,lead,time){return (lead?'\n':'')+time.trim();});
    var lines=s.split(/\n+/).map(function(x){return x.trim();}).filter(Boolean);
    var groups=[];
    var current=null;
    function startGroup(time){current={time:String(time||'').replace('.',':'),items:[]};groups.push(current);}
    function addItems(text){if(!current)startGroup('');splitItems(text).forEach(function(x){if(x)current.items.push(x);});}
    lines.forEach(function(raw){
      var line=cleanItem(raw);if(!line)return;
      var onlyTime=line.match(/^(\d{1,2}[:.]\d{2})$/);if(onlyTime){startGroup(onlyTime[1]);return;}
      var timeAndText=line.match(/^(\d{1,2}[:.]\d{2})\s*(?:-|–|—|:)\s*(.*)$/);
      if(timeAndText){startGroup(timeAndText[1]);addItems(timeAndText[2]);return;}
      addItems(line);
    });
    groups=groups.filter(function(g){return g.items.length||g.time;});
    return groups.length?groups:[{time:'',items:[norm(s)]}];
  }

  function checklistHtml(info){
    var groups=parseChecklist(info);
    return '<div class="next-info-checklist">'+groups.map(function(g){
      return '<section class="info-group">'+
        (g.time?'<div class="info-time">kl. '+esc(g.time)+'</div>':'')+
        (g.items.length?'<ul>'+g.items.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')+
        '</section>';
    }).join('')+'</div>';
  }

  function render(item,periodLabel){
    var box=ensureBox();if(!box)return;
    var card=box.closest('.note-card');card.classList.remove('dense-note');
    if(!item){box.innerHTML='<div class="next-info-empty">Ingen kommende info '+(periodLabel||'')+'</div>';return;}
    var when=shortDayName(item.date.y,item.date.m,item.date.d)+' · '+item.timeText;
    box.innerHTML='<div class="next-info-when">'+esc(when)+'</div><div class="next-info-title">'+esc(item.title)+'</div>'+checklistHtml(item.info);
    setTimeout(function(){if(box.scrollHeight>box.clientHeight+2||card.scrollHeight>card.clientHeight+2)card.classList.add('dense-note');},80);
  }

  function scanRoot(root){
    var tables=root.querySelectorAll('table');if(!tables.length)return {ready:false,best:null};
    var np=nowParts(),nowKey=keyFrom(np.year,np.month,np.day,np.hour,np.minute),best=null;
    tables.forEach(function(table){
      var currentDate=null,header={};
      [].slice.call(table.querySelectorAll('tr')).forEach(function(tr){
        var txt=norm(tr.textContent),dateInRow=parseDate(txt);
        if(dateInRow&&(!tr.querySelector('td')||!/(\d{1,2})[:.](\d{2})/.test(txt)))currentDate=dateInRow;
        var ths=[].slice.call(tr.querySelectorAll('th'));
        if(ths.length){
          ths.forEach(function(th,i){var t=norm(th.textContent).toLowerCase();if(t.indexOf('dato')>-1)header.date=i;if(t.indexOf('tid')>-1)header.time=i;if(t.indexOf('titel')>-1)header.title=i;if(t.indexOf('info')>-1)header.info=i;});
          return;
        }
        var cells=[].slice.call(tr.cells);if(!cells.length)return;
        var vals=cells.map(function(c){return norm(c.textContent);});
        var ti=header.time!=null?header.time:vals.findIndex(function(v){return /(\d{1,2})[:.](\d{2})/.test(v);});
        if(ti<0)return;
        var time=parseTime(vals[ti]);if(!time)return;
        var date=(header.date!=null?parseDate(vals[header.date]):null)||dateInRow||currentDate;if(!date)return;
        var title=vals[header.title!=null?header.title:ti+1]||'';
        var infoIndex=header.info!=null?header.info:ti+2;
        var infoRaw=cells[infoIndex]?rawText(cells[infoIndex]):(vals[infoIndex]||'');
        if(!norm(infoRaw)||/^(-|ingen|intet)$/i.test(norm(infoRaw)))return;
        var k=keyFrom(date.y,date.m,date.d,time.h,time.min);if(k<nowKey)return;
        var item={key:k,date:date,timeText:displayTime(vals[ti]),title:title,info:infoRaw};
        if(!best||k<best.key)best=item;
      });
    });
    return {ready:true,best:best};
  }

  function scan(){
    var source=document.getElementById('info-source');
    if(source){var a=scanRoot(source);if(a.ready){render(a.best,'i perioden');return true;}}
    var today=document.getElementById('today-bookings');
    if(today){var b=scanRoot(today);if(b.ready){render(b.best,'i dag');return true;}}
    return false;
  }

  var tries=0,t=setInterval(function(){tries++;if(scan()||tries>50)clearInterval(t);},300);
})();