(function(){
  function norm(s){return (s||'').replace(/\s+/g,' ').trim();}

  function loadNextInfo(){
    if(!document.getElementById('next-info-css')){
      var link=document.createElement('link');
      link.id='next-info-css';
      link.rel='stylesheet';
      link.href='next-info.css';
      document.head.appendChild(link);
    }
    if(!document.getElementById('next-info-js')){
      var script=document.createElement('script');
      script.id='next-info-js';
      script.src='next-info.js';
      document.body.appendChild(script);
    }
  }

  function cleanKarlsvognen(){
    var root=document.getElementById('today-bookings');
    if(!root) return false;
    var rows=root.querySelectorAll('tr');
    if(!rows.length) return false;

    Array.prototype.forEach.call(rows,function(tr){
      if(tr.querySelector('th')) return;
      var cells=Array.prototype.slice.call(tr.cells||[]);
      if(!cells.length) return;

      var rowText=norm(tr.textContent);
      var hasKarls=/Karlsvognen/i.test(rowText);
      var hasSpecific=/(?:Gamma|Zeta)/i.test(rowText);
      if(!hasKarls || !hasSpecific) return;

      cells.forEach(function(cell){
        var txt=norm(cell.textContent);
        if(!/Karlsvognen/i.test(txt)) return;

        var cleaned=txt
          .replace(/Mødelokale\s+Karlsvognen/ig,'')
          .replace(/\bKarlsvognen\b/ig,'')
          .replace(/\s{2,}/g,' ')
          .trim();

        cell.textContent=cleaned;
      });
    });
    return true;
  }

  loadNextInfo();
  var tries=0;
  var timer=setInterval(function(){
    tries++;
    if(cleanKarlsvognen() || tries>50) clearInterval(timer);
  },300);

  setTimeout(cleanKarlsvognen,1500);
  setTimeout(cleanKarlsvognen,3000);
})();