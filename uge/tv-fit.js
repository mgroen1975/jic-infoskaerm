(function(){
  function viewport(){
    var de=document.documentElement||{};
    var b=document.body||{};
    var w=Math.min(
      window.innerWidth||99999,
      de.clientWidth||99999,
      b.clientWidth||99999
    );
    var h=Math.min(
      window.innerHeight||99999,
      de.clientHeight||99999,
      b.clientHeight||99999
    );
    if(!isFinite(w)||w<=0||w===99999)w=1920;
    if(!isFinite(h)||h<=0||h===99999)h=1080;
    return {w:w,h:h};
  }
  function fit(){
    var screen=document.querySelector('.screen');
    var stage=document.getElementById('stage');
    if(!screen||!stage)return;
    var v=viewport();
    var safe=.98;
    var zoom=.95;
    var s=Math.min(v.w/1920,v.h/1080)*safe*zoom;
    var rw=1920*s, rh=1080*s;
    var left=Math.max(0,(v.w-rw)/2);
    var top=Math.max(0,(v.h-rh)/2);
    stage.style.position='fixed';
    stage.style.left='0';stage.style.top='0';stage.style.right='auto';stage.style.bottom='auto';
    stage.style.width=v.w+'px';stage.style.height=v.h+'px';
    stage.style.transform='none';stage.style.overflow='hidden';
    screen.style.position='absolute';
    screen.style.left=left+'px';screen.style.top=top+'px';
    screen.style.width='1920px';screen.style.height='1080px';
    screen.style.transform='scale('+s+')';
    screen.style.transformOrigin='0 0';
  }
  fit();
  window.addEventListener('resize',fit);
  window.addEventListener('orientationchange',function(){setTimeout(fit,100);setTimeout(fit,700);});
  setTimeout(fit,250);setTimeout(fit,1000);setTimeout(fit,2500);setTimeout(fit,5000);
})();
