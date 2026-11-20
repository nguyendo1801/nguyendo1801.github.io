/* Nguyen Do · site effects. Progressive enhancement: without JS the page is complete and static.
   Concept: "from noise to structure". Motion respects prefers-reduced-motion and the pause button. */
(function(){
'use strict';
var root=document.documentElement,body=document.body;
var mq=matchMedia('(prefers-reduced-motion: reduce)');
var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
var $=function(s,c){return (c||document).querySelector(s);};
var $$=function(s,c){return [].slice.call((c||document).querySelectorAll(s));};
var clamp=function(v,a,b){return v<a?a:v>b?b:v;};
var lerp=function(a,b,k){return a+(b-a)*k;};

/* ---------- motion preference + pause ---------- */
var saved=null;try{saved=localStorage.getItem('nd-motion');}catch(e){}
var mbtn=$('#motion');
function setOff(off,persist){
  root.classList.toggle('nomo',off);
  if(mbtn){mbtn.setAttribute('aria-pressed',String(off));mbtn.title=off?'Play animation':'Pause animation';var s=$('.sr',mbtn);if(s)s.textContent=mbtn.title;}
  if(persist){try{localStorage.setItem('nd-motion',off?'off':'on');}catch(e){}}
  dispatchEvent(new CustomEvent('motionchange',{detail:{off:off}}));
}
window.MOTION={off:function(){return mq.matches||root.classList.contains('nomo');}};
var still=function(){return window.MOTION.off();};
if(mq.matches){root.classList.add('nomo');if(mbtn)mbtn.hidden=true;}
else{if(saved==='off')setOff(true,false);if(mbtn)mbtn.addEventListener('click',function(){setOff(!root.classList.contains('nomo'),true);});}
var yr=$('#yr');if(yr)yr.textContent=new Date().getFullYear();

/* ---------- text splitting: letters (name), words (section titles) ---------- */
$$('[data-letters]').forEach(function(el){
  var t=el.textContent,i=0;el.setAttribute('aria-label',t);el.textContent='';
  t.split('').forEach(function(c){if(c===' '){el.appendChild(document.createTextNode(' '));return;}var s=document.createElement('span');s.className='ch';s.setAttribute('aria-hidden','true');s.textContent=c;s.style.setProperty('--i',i++);el.appendChild(s);});
});
$$('[data-words]').forEach(function(el){
  var i=0;
  (function walk(n){[].slice.call(n.childNodes).forEach(function(c){
    if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(' '));return;}var o=document.createElement('span'),s=document.createElement('span');o.className='wd';s.textContent=w;s.style.setProperty('--i',i++);o.appendChild(s);f.appendChild(o);});n.replaceChild(f,c);}
    else if(c.nodeType===1)walk(c);});})(el);
});

/* ---------- loader (first visit per session only) ---------- */
var loader=$('.loader'),heroStart=null;
function finishLoad(){
  root.classList.add('ready');
  if(loader){loader.classList.add('done');setTimeout(function(){if(loader&&loader.parentNode)loader.parentNode.removeChild(loader);},1300);}
  if(heroStart)heroStart();
}
(function(){
  var seen=false;try{seen=sessionStorage.getItem('nd-seen')==='1';sessionStorage.setItem('nd-seen','1');}catch(e){}
  if(!loader||still()||seen){if(loader&&loader.parentNode)loader.parentNode.removeChild(loader);loader=null;requestAnimationFrame(function(){root.classList.add('ready');if(heroStart)heroStart();});return;}
  var n=$('.ld-n b',loader),bar=$('.ld-bar',loader),t0=performance.now(),D=1000;
  (function f(t){
    var p=clamp((t-t0)/D,0,1),e=1-Math.pow(1-p,3);
    n.textContent=String(Math.round(1000*(1-e))).padStart(4,'0');bar.style.setProperty('--p',e.toFixed(3));
    if(p<1)requestAnimationFrame(f);else setTimeout(finishLoad,120);
  })(t0);
  setTimeout(function(){if(loader&&!loader.classList.contains('done'))finishLoad();},3500);
})();

/* ---------- scroll: progress bar, header hide/show, scroll-spy ---------- */
var hd=$('.hd'),bar=$('.progress i'),lastY=0,scrollers=[];
function onScroll(){
  var y=scrollY,h=root.scrollHeight-innerHeight;
  if(bar)bar.style.setProperty('--p',(h>0?y/h:0).toFixed(4));
  if(hd){hd.classList.toggle('solid',y>30);if(y>innerHeight*.8&&y>lastY+3)hd.classList.add('away');else if(y<lastY-3||y<innerHeight*.8)hd.classList.remove('away');}
  lastY=y;
  for(var i=0;i<scrollers.length;i++)scrollers[i]();
}
var ticking=false;
addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(function(){ticking=false;onScroll();});}},{passive:true});
addEventListener('resize',function(){requestAnimationFrame(onScroll);});
(function(){
  var links=$$('.nav a[href^="#"]');if(!links.length||!('IntersectionObserver' in window))return;
  var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;links.forEach(function(a){a.classList.remove('on');});if(map[e.target.id])map[e.target.id].classList.add('on');});},{rootMargin:'-45% 0px -50% 0px'});
  ['top','news','about','research','projects','publications','honors','trajectory','contact'].forEach(function(id){var el=$('#'+id);if(el)io.observe(el);});
})();

/* ---------- mobile menu ---------- */
(function(){
  var b=$('.burger'),m=$('#mnav');if(!b||!m)return;
  function set(o){
    b.setAttribute('aria-expanded',String(o));m.hidden=false;
    requestAnimationFrame(function(){m.classList.toggle('open',o);});
    if(hd)hd.classList.toggle('menu-open',o);body.style.overflow=o?'hidden':'';
    if(!o)setTimeout(function(){if(!m.classList.contains('open'))m.hidden=true;},700);
  }
  b.addEventListener('click',function(){set(b.getAttribute('aria-expanded')!=='true');});
  $$('a',m).forEach(function(a){a.addEventListener('click',function(){set(false);});});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&m.classList.contains('open')){set(false);b.focus();}});
})();

/* ---------- cursor, magnets, tilt (fine pointers only) ---------- */
if(fine){
  root.classList.add('has-cursor');
  var cur=$('.cursor');
  if(cur){
    var dot=$('.c-dot'),ring=$('.c-ring'),lab=$('.c-ring em'),mx=-100,my=-100,rx=-100,ry=-100;
    addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY;dot.style.setProperty('--x',mx+'px');dot.style.setProperty('--y',my+'px');cur.classList.remove('hide');},{passive:true});
    document.addEventListener('pointerleave',function(){cur.classList.add('hide');});
    (function loop(){rx=lerp(rx,mx,still()?1:.2);ry=lerp(ry,my,still()?1:.2);ring.style.setProperty('--x',rx.toFixed(1)+'px');ring.style.setProperty('--y',ry.toFixed(1)+'px');requestAnimationFrame(loop);})();
    document.addEventListener('pointerover',function(e){
      var t=e.target.closest&&e.target.closest('a,button');
      cur.classList.remove('link','label');if(!t)return;
      var l=t.closest('.plist')?'open':t.classList.contains('orb')?'say hi':null;
      if(l){lab.textContent=l;cur.classList.add('label');}else cur.classList.add('link');
    });
  }
  $$('[data-magnet]').forEach(function(el){
    el.addEventListener('pointermove',function(e){if(still())return;var r=el.getBoundingClientRect();
      el.style.setProperty('--mx',((e.clientX-r.left-r.width/2)*.28).toFixed(1)+'px');el.style.setProperty('--my',((e.clientY-r.top-r.height/2)*.35).toFixed(1)+'px');});
    el.addEventListener('pointerleave',function(){el.style.setProperty('--mx','0px');el.style.setProperty('--my','0px');});
  });
  $$('[data-tilt]').forEach(function(el){
    var max=parseFloat(el.dataset.tilt)||5;
    el.addEventListener('pointermove',function(e){
      var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      el.style.setProperty('--gx',(x*100).toFixed(1)+'%');el.style.setProperty('--gy',(y*100).toFixed(1)+'%');el.classList.add('hot');
      if(still())return;
      el.style.setProperty('--ry',((x-.5)*2*max).toFixed(2)+'deg');el.style.setProperty('--rx',((.5-y)*2*max).toFixed(2)+'deg');
    });
    el.addEventListener('pointerleave',function(){el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg');el.classList.remove('hot');});
  });
}

/* ---------- scramble: labels "decode" out of noise when they enter, and again on hover ---------- */
var GLY='▖▘▝▗▚▞░▒#%&*+=<>/\\';
function scramble(el){
  if(still())return;
  var final=el.dataset.final||(el.dataset.final=el.textContent),n=final.length,f=0,F=26;
  if(el._sc)cancelAnimationFrame(el._sc);
  (function tick(){
    var out='';
    for(var i=0;i<n;i++){var c=final[i];if(c===' '||i<(f/F)*n)out+=c;else out+=GLY[(Math.random()*GLY.length)|0];}
    el.textContent=out;f++;
    if(f<=F)el._sc=requestAnimationFrame(tick);else{el.textContent=final;el._sc=0;}
  })();
}
$$('[data-scramble]').forEach(function(el){el.addEventListener('pointerenter',function(){scramble(el);});});

/* ---------- reveal on scroll, counters ---------- */
function count(el){
  var to=parseFloat(el.dataset.count),t0=null,D=1500;
  if(still()||!isFinite(to)){el.textContent=el.dataset.count+(el.dataset.suffix||'');return;}
  var dec=parseInt(el.dataset.dec||'0',10),suf=el.dataset.suffix||'';(function f(t){if(t0===null)t0=t;var p=clamp((t-t0)/D,0,1);el.textContent=(to*(1-Math.pow(1-p,4))).toFixed(dec)+suf;if(p<1)requestAnimationFrame(f);})(performance.now());
}
(function(){
  [$$('.bento [data-reveal]'),$$('.nlist [data-reveal]')].forEach(function(g){g.forEach(function(el,i){el.style.setProperty('--d',(Math.min(i,8)*.08)+'s');});});
  $$('.plist li').forEach(function(el,i){el.style.transitionDelay=(Math.min(i,10)*.04)+'s';});
  var els=$$('[data-reveal],.plist li,.ft,[data-words],.lbl,[data-scramble]');
  if(!('IntersectionObserver' in window)||still()){els.forEach(function(e){e.classList.add('in');});$$('[data-count]').forEach(function(e){e.textContent=e.dataset.count+(e.dataset.suffix||'');});return;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return;var t=e.target;t.classList.add('in');
    if(t.hasAttribute('data-scramble'))setTimeout(function(){scramble(t);},t.closest('.hero')?500:0);
    $$('[data-count]',t).forEach(count);io.unobserve(t);
  });},{threshold:.12,rootMargin:'0px 0px -5% 0px'});
  els.forEach(function(e){io.observe(e);});
  addEventListener('motionchange',function(e){if(e.detail.off){els.forEach(function(x){x.classList.add('in');});$$('[data-count]').forEach(function(x){x.textContent=x.dataset.count;});}});
})();

/* ---------- ticker: duplicate the set so the loop is seamless ---------- */
$$('.tk-track').forEach(function(t){var s=t.firstElementChild;if(!s)return;var c=s.cloneNode(true);c.setAttribute('aria-hidden','true');t.appendChild(c);});

/* ---------- HERO: Gaussian noise is carried along straight optimal-transport paths onto a 3D point cloud of the
   portrait (generated from the photo with Hunyuan3D-2 and registered to it), which turns a full circle, settles facing
   the camera, becomes the halftone of the original photo, sharpens into the photo, and then flows back to noise.
   t = 1 is pure noise, t = 0 is the clean photo; the 3D stage sits at t = .32, where the halftone forms. ---------- */
(function(){
  var cv=$('#noise');if(!cv||!cv.getContext)return;
  var frame=cv.parentNode,ctx=cv.getContext('2d'),W=0,H=0,P=[],M=[],ORD=[],run=true,raf=0,last=0,
      t=1,mouse={x:-9999,y:-9999,vx:0,vy:0,on:false},
      tEl=$('#tstep'),sEl=$('#sig'),slider=$('#tslider'),replay=$('.replay'),src=null,imgMode=!!cv.dataset.img,
      small=document.createElement('canvas'),sc=small.getContext('2d'),gap=6,cols=0,rows=0,lastShown=-1,
      model=null,zf=0,t3d=$('#t3d'),lastU=-1,DUST=null;
  /* ST: path position (1 = at its noise sample) and opacity of the photo's foreground/background dots and of the
     3D points (sm, am), plus the 3D pose; persp blends perspective out so the frontal pose matches the halftone */
  var ST={sFg:1,sBg:1,aFg:1,aBg:1,sm:1,am:0,yaw:0,pitch:0,persp:1};
  var PAL=[[51,70,211],[112,72,232],[214,51,108],[14,159,142]];
  function pal(u){u=clamp(u,0,.999)*(PAL.length-1);var i=Math.floor(u),f=u-i,a=PAL[i],b=PAL[i+1];return 'rgb('+Math.round(lerp(a[0],b[0],f))+','+Math.round(lerp(a[1],b[1],f))+','+Math.round(lerp(a[2],b[2],f))+')';}
  function gauss(){var u=1-Math.random(),v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v);}
  function particle(x,y,c,r){return {tx:x,ty:y,a:Math.random()*6.2832,m:Math.abs(gauss())*.5+.15,da:(Math.random()-.5)*.8,ex:0,ey:0,c:c,r:r,fg:false,s:1};}
  function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
  /* 2D stages: noise (s) for t in [.32,1]; the halftone gives way to a blurred photo (k) for t in [.24,.32];
     detail then builds up slowly (d) for t in [0,.24], so the photo visibly comes into focus */
  function noiseOf(t){return Math.pow(clamp((t-.32)/.68,0,1),1.25);}
  function sharpOf(t){var x=clamp((.32-t)/.32,0,1);return imgMode?Math.min(1,x/.08)*(.3+.7*Math.pow(x,1.5)):0;}
  function detailOf(t){return imgMode?clamp((.32-t)/.32,0,1):0;}
  function build(){
    var r=frame.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;if(!W||!H)return;
    cv.width=Math.round(W*d);cv.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);P=[];
    var off=document.createElement('canvas'),oc=off.getContext('2d');
    if(imgMode&&src){
      gap=Math.max(4,Math.round(W/92));cols=Math.ceil(W/gap);rows=Math.ceil(H/gap);
      off.width=cols;off.height=rows;
      var s=Math.min(src.naturalWidth,src.naturalHeight);oc.drawImage(src,(src.naturalWidth-s)/2,(src.naturalHeight-s)/2,s,s,0,0,cols,rows);
      var px=oc.getImageData(0,0,cols,rows).data;
      for(var y=0;y<rows;y++)for(var x=0;x<cols;x++){
        var k=(y*cols+x)*4,R=px[k],G=px[k+1],B=px[k+2],lum=(.2126*R+.7152*G+.0722*B)/255;
        P.push(particle(x*gap+gap/2,y*gap+gap/2,'rgb('+R+','+G+','+B+')',Math.min(gap*.62,gap*.5*(.38+.7*(1-lum)))));
      }
    }else{
      off.width=Math.ceil(W);off.height=Math.ceil(H);
      var text=cv.dataset.text||'ND';oc.font='600 100px Newsreader, Georgia, serif';
      var fs=Math.min(100*(W*.82)/oc.measureText(text).width,H*.6);
      oc.font='600 '+fs.toFixed(0)+'px Newsreader, Georgia, serif';oc.textAlign='center';oc.textBaseline='middle';oc.fillStyle='#000';oc.fillText(text,W/2,H*.52);
      var im=oc.getImageData(0,0,off.width,off.height).data,g2=Math.max(3,Math.round(W/120));
      for(var y2=0;y2<off.height;y2+=g2)for(var x2=0;x2<off.width;x2+=g2)if(im[(y2*off.width+x2)*4+3]>128)P.push(particle(x2,y2,pal(x2/W*.8+Math.random()*.2),1.3+Math.random()*1.1));
    }
    DUST=imgMode&&src?[1.7,2.8,4.6].map(function(f){return grain(Math.max(1.3,gap/f));}):null;
    couple();bindModel();
  }
  /* a pre-rendered halftone of the photo at a finer grid: the dots shrink through these layers while the photo
     underneath comes into focus, until only a fine grain is left and then the clean photo */
  function grain(g){
    var d=Math.min(devicePixelRatio||1,2),c=document.createElement('canvas'),x=c.getContext('2d'),gc=Math.ceil(W/g),gr=Math.ceil(H/g),
        o=document.createElement('canvas'),oc=o.getContext('2d'),s=Math.min(src.naturalWidth,src.naturalHeight);
    c.width=Math.round(W*d);c.height=Math.round(H*d);x.scale(d,d);o.width=gc;o.height=gr;
    oc.drawImage(src,(src.naturalWidth-s)/2,(src.naturalHeight-s)/2,s,s,0,0,gc,gr);var px=oc.getImageData(0,0,gc,gr).data;
    for(var j=0;j<gr;j++)for(var i=0;i<gc;i++){var k=(j*gc+i)*4,lum=(.2126*px[k]+.7152*px[k+1]+.0722*px[k+2])/255,
        r=g*.5*(.4+.75*(1-lum)),cx=(i+.5+(Math.random()-.5)*.7)*g,cy=(j+.5+(Math.random()-.5)*.7)*g;
      x.fillStyle='rgb('+px[k]+','+px[k+1]+','+px[k+2]+')';
      if(r*d<1.6)x.fillRect(cx-r,cy-r,2*r,2*r);else{x.beginPath();x.arc(cx,cy,r,0,6.2832);x.fill();}}
    return c;
  }
  function dust(x){
    for(var i=0;i<DUST.length;i++){var w=Math.max(0,1-Math.abs(x-[.24,.5,.76][i])/.3),a=Math.min(1,w*1.25)*Math.min(1,(1-x)*5);
      if(a>.01){ctx.globalAlpha=a;ctx.drawImage(DUST[i],0,0,W,H);}}
    ctx.globalAlpha=1;
  }
  /* OT-style coupling between Gaussian samples and the image's dots: both sets are sorted into matching
     x-strips, then by y inside each strip (a monotone Knothe-Rosenblatt map), so paths are short straight
     lines that rarely cross. The image side is keyed on a blurred (noised) position, as in minibatch OT,
     so the starting cloud reads as noise instead of a warped copy of the photo. */
  function couple(){
    var n=P.length;if(!n)return;
    var S=[],i;for(i=0;i<n;i++)S.push([W/2+gauss()*W*.27,H/2+gauss()*H*.27]);
    var T=P.slice();for(i=0;i<n;i++){T[i].kx=T[i].tx+gauss()*W*.32;T[i].ky=T[i].ty+gauss()*H*.32;}
    S.sort(function(a,b){return a[0]-b[0];});T.sort(function(a,b){return a.kx-b.kx;});
    var C=Math.max(1,Math.round(Math.sqrt(n))),bs=Math.ceil(n/C);
    for(var b=0;b<n;b+=bs){var s1=S.slice(b,b+bs).sort(function(a,c){return a[1]-c[1];}),t1=T.slice(b,b+bs).sort(function(a,c){return a.ky-c.ky;});
      for(i=0;i<t1.length;i++){t1[i].nx=s1[i][0];t1[i].ny=s1[i][1];}}
  }
  /* the 3D points: each one is tied to the halftone dot it covers when the model faces the camera and starts from
     that dot's noise sample, so noise -> 3D and 3D -> photo are both continuous */
  function bindModel(){
    M=[];ORD=[];if(!model||!imgMode||!cols)return;
    var Wg=cols*gap,Hg=rows*gap,stride=W<300?2:1,zs=[];
    for(var i=0;i<model.n;i+=stride){
      var u=model.px+model.xyz[i*3],v=model.py+model.xyz[i*3+1],
          q=P[clamp(Math.floor(v*rows),0,rows-1)*cols+clamp(Math.floor(u*cols),0,cols-1)];q.fg=true;
      M.push({ox:model.xyz[i*3]*Wg,oy:model.xyz[i*3+1]*Hg,oz:model.xyz[i*3+2]*Wg,nx:model.nrm[i*3],ny:model.nrm[i*3+1],nz:model.nrm[i*3+2],
        c:model.col[i],sx:q.nx+gauss()*gap*.7,sy:q.ny+gauss()*gap*.7,a:Math.random()*6.2832,m:Math.abs(gauss())*.5+.15,f:1,px:0,py:0,pz:0,pr:1});
      zs.push(model.xyz[i*3+2]*Wg);
    }
    zs.sort(function(a,b){return a-b;});zf=zs[Math.floor(zs.length*.85)]||0;
    ORD=M.map(function(_,k){return k;});
  }
  function parseModel(buf){
    var h=new Float32Array(buf,0,4),n=h[0]|0,k=h[1]/32767,q=new Int16Array(buf,16,n*3),c=new Uint8Array(buf,16+n*6,n*3),r=new Int8Array(buf,16+n*9,n*3),
        xyz=new Float32Array(n*3),nrm=new Float32Array(n*3),col=[];
    for(var i=0;i<n*3;i++){xyz[i]=q[i]*k;nrm[i]=r[i]/127;}
    for(i=0;i<n;i++)col.push('rgb('+c[i*3]+','+c[i*3+1]+','+c[i*3+2]+')');
    return {n:n,px:h[2],py:h[3],xyz:xyz,nrm:nrm,col:col};
  }
  /* the loop. A: noise -> 3D while turning; R: finish a full turn; B: face the camera and become the photo's halftone;
     K: sharpen into the photo; H: hold; C: photo -> noise; Z: hold. Without the model: F (noise -> photo), H, C, Z. */
  var DA=3.6,DR=5.4,DB=1.8,DK=5.4,DH=2.6,DC=2.8,DZ=.7,CYC={on:false,t0:0,pe:0,frozen:false,timer:0};
  function segs(){return M.length?[['A',DA],['R',DR],['B',DB],['K',DK],['H',DH],['C',DC],['Z',DZ]]:[['F',3.4],['H',DH],['C',DC],['Z',DZ]];}
  function clock(){return performance.now()/1000;}
  function flat(){ST.am=0;ST.sm=1;ST.aFg=ST.aBg=1;ST.sFg=ST.sBg=noiseOf(t);ST.yaw=ST.pitch=0;ST.persp=1;}
  function spin(x){var w=x*x*(3-2*x);ST.yaw=-6.2832*(1-w);ST.pitch=.1*Math.sin(Math.PI*x);}
  function at(e){
    var S=segs(),L=0,i;for(i=0;i<S.length;i++)L+=S[i][1];e=((e%L)+L)%L;
    for(i=0;i<S.length-1&&e>=S[i][1];i++)e-=S[i][1];var id=S[i][0],p=clamp(e/S[i][1],0,1),q=ease(p);
    if(id==='A'){ST.sm=1-q;ST.am=clamp(p/.15,0,1);ST.aFg=1-ST.am;ST.aBg=lerp(1,.12,q);ST.sFg=ST.sBg=1;ST.persp=1;t=lerp(.32,1,ST.sm);spin(e/(DA+DR));}
    else if(id==='R'){ST.sm=0;ST.am=1;ST.aFg=0;ST.aBg=.12;ST.sFg=ST.sBg=1;ST.persp=1;t=.32;spin((DA+e)/(DA+DR));}
    else if(id==='B'){ST.sm=0;ST.am=1-q;ST.aFg=q;ST.sFg=0;ST.sBg=1-q;ST.aBg=lerp(.12,1,q);ST.persp=1-q;ST.yaw=ST.pitch=0;t=.32;}
    else{t=id==='K'?.32*(1-p):id==='F'?1-q:id==='H'?0:id==='C'?q:1;flat();}
  }
  function eForT(v){var S=segs(),e=0;for(var i=0;S[i][0]!=='C';i++)e+=S[i][1];var lo=0,hi=1;for(i=0;i<24;i++){var m=(lo+hi)/2;if(ease(m)<v)lo=m;else hi=m;}return e+lo*DC;}
  function startCycle(e){if(still()){t=0;flat();draw();return;}CYC.on=true;CYC.frozen=false;CYC.t0=clock()-(e||0);kick();}
  function freeze(){if(CYC.on&&!CYC.frozen){CYC.frozen=true;CYC.pe=clock()-CYC.t0;}}
  function unfreeze(e){if(!CYC.on)return;CYC.frozen=false;CYC.t0=clock()-(e==null?CYC.pe:e);kick();}
  function step(dt){
    if(CYC.on&&!CYC.frozen)at(clock()-CYC.t0);
    var R=70,R2=R*R,i;
    for(i=0;i<P.length;i++){var p=P[i];p.a+=p.da*dt;
      if(mouse.on&&sharpOf(t)<.6){var dx=p.tx+p.ex-mouse.x,dy=p.ty+p.ey-mouse.y,d2=dx*dx+dy*dy;
        if(d2<R2){var d=Math.sqrt(d2)||1,f=1-d/R;p.ex+=dx/d*f*5+(Math.random()-.5)*f*8+mouse.vx*f*.2;p.ey+=dy/d*f*5+(Math.random()-.5)*f*8+mouse.vy*f*.2;}}
      p.ex*=.92;p.ey*=.92;
    }
    if(ST.am>0)for(i=0;i<M.length;i++)M[i].a+=.6*dt;
    mouse.vx*=.8;mouse.vy*=.8;
  }
  /* photo dots slide along their straight OT paths between the halftone and their Gaussian samples */
  function placeP(){
    for(var i=0;i<P.length;i++){var p=P[i],s=p.fg?ST.sFg:ST.sBg,J=s*(1-s)*4;p.s=s;
      p.px=lerp(p.tx,p.nx,s)+p.ex+Math.cos(p.a)*p.m*(4+10*J);
      p.py=lerp(p.ty,p.ny,s)+p.ey+Math.sin(p.a)*p.m*(4+10*J);}
  }
  /* 3D points: turn (yaw, then pitch) about the head's vertical axis, project, and slide towards the noise by sm */
  function placeM(){
    var cy=Math.cos(ST.yaw),sy=Math.sin(ST.yaw),cp=Math.cos(ST.pitch),sp=Math.sin(ST.pitch),F=W*2.6,s=ST.sm,J=s*(1-s)*4,
        ox=model.px*cols*gap,oy=model.py*rows*gap,rr=gap*.56;
    for(var i=0;i<M.length;i++){var m=M[i],x1=m.ox*cy+m.oz*sy,z1=-m.ox*sy+m.oz*cy,y1=m.oy*cp-z1*sp,z2=m.oy*sp+z1*cp,
        k=lerp(1,(F-zf)/(F-z2),ST.persp),w=Math.cos(m.a)*m.m*(1.5+10*J),v=Math.sin(m.a)*m.m*(1.5+10*J);
      m.f=m.ny*sp+(-m.nx*sy+m.nz*cy)*cp;
      m.px=lerp(ox+x1*k,m.sx,s)+w;m.py=lerp(oy+y1*k,m.sy,s)+v;m.pz=z2;m.pr=lerp(rr*k,gap*.24,s);}
    ORD.sort(function(a,b){return M[a].pz-M[b].pz;});
  }
  function dotsP(live,rs){
    var cur=-1;
    for(var j=0;j<P.length;j++){var p=P[j];if(p.px<-6||p.py<-6||p.px>W+6||p.py>H+6)continue;
      var a=(.35+.65*(1-p.s*.85))*live*(p.fg?ST.aFg:ST.aBg);if(a<.02)continue;
      if(a!==cur){ctx.globalAlpha=a;cur=a;}ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.px,p.py,p.r*rs,0,6.2832);ctx.fill();}
    ctx.globalAlpha=1;
  }
  function dotsM(){
    var s=ST.sm,base=(.35+.65*(1-s*.85))*ST.am;
    for(var j=0;j<ORD.length;j++){var m=M[ORD[j]],f=m.f,
        shade=f<-.12?0:.78+.22*clamp(f,0,1),a=base*lerp(shade,1,s*s);if(a<.03)continue;
      ctx.globalAlpha=a;ctx.fillStyle=m.c;ctx.beginPath();ctx.arc(m.px,m.py,m.pr,0,6.2832);ctx.fill();}
    ctx.globalAlpha=1;
  }
  /* the transport plan: a sparse set of couplings drawn as faint straight segments while dots are in flight */
  function plan(){
    var i,p,in3=ST.am>0,s=in3?ST.sm:ST.sBg,a=Math.sin(Math.PI*clamp(s,0,1));if(a<.03)return;
    var L=in3?M:P,stp=in3?37:29;
    ctx.strokeStyle='rgba(51,70,211,'+(.16*a).toFixed(3)+')';ctx.lineWidth=.7;ctx.beginPath();
    for(i=0;i<L.length;i+=stp){p=L[i];if(in3)ctx.moveTo(p.sx,p.sy);else{if(p.fg&&ST.sFg<.01)continue;ctx.moveTo(p.nx,p.ny);}ctx.lineTo(p.px,p.py);}
    ctx.stroke();
    ctx.fillStyle='rgba(255,93,59,'+(.5*a).toFixed(3)+')';
    for(i=0;i<L.length;i+=stp){p=L[i];if(in3)ctx.fillRect(p.sx-1,p.sy-1,2,2);else if(!(p.fg&&ST.sFg<.01))ctx.fillRect(p.nx-1,p.ny-1,2,2);}
  }
  function photo(k){
    /* coarse-to-fine: resolution grows geometrically with d, so detail arrives evenly and is full at t = 0 */
    var s=Math.min(src.naturalWidth,src.naturalHeight),res=Math.round(16*Math.pow(Math.max(W,H)*1.5/16,detailOf(t)));
    small.width=small.height=res;sc.imageSmoothingEnabled=true;sc.imageSmoothingQuality='high';ctx.imageSmoothingQuality='high';sc.drawImage(src,(src.naturalWidth-s)/2,(src.naturalHeight-s)/2,s,s,0,0,res,res);
    ctx.globalAlpha=k;ctx.imageSmoothingEnabled=true;ctx.drawImage(small,0,0,W,H);ctx.globalAlpha=1;
  }
  function lens(){ /* the halftone the photo was built from */
    var R=78,R2=(R+4)*(R+4);ctx.save();ctx.beginPath();ctx.arc(mouse.x,mouse.y,R,0,6.2832);ctx.clip();
    ctx.fillStyle='#fff';ctx.fillRect(mouse.x-R,mouse.y-R,2*R,2*R);
    for(var j=0;j<P.length;j++){var p=P[j],dx=p.tx-mouse.x,dy=p.ty-mouse.y;if(dx*dx+dy*dy>R2)continue;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.tx,p.ty,p.r,0,6.2832);ctx.fill();}
    ctx.restore();ctx.strokeStyle='rgba(51,70,211,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mouse.x,mouse.y,R,0,6.2832);ctx.stroke();
  }
  function draw(){
    if(!W)return;
    /* focus stage (t .32 -> 0, x 0 -> 1): the photo sharpens underneath while the dots on top shrink into ever
       finer grain and fade out */
    var k=ST.am>0?0:sharpOf(t),x=ST.am>0?0:detailOf(t),lp=clamp(x/.3,0,1),live=1-ease(lp);
    ctx.clearRect(0,0,W,H);
    if(k>0&&src)photo(k);
    if(x>0&&DUST)dust(x);
    if(live>.01){placeP();if(ST.am>0)placeM();plan();dotsP(live,lerp(1,.7,lp));if(ST.am>0)dotsM();}
    if(k>.5&&mouse.on)lens();
    var shown=Math.round(t*1000);
    if(shown!==lastShown){lastShown=shown;if(tEl)tEl.textContent=String(shown).padStart(4,'0');if(sEl)sEl.textContent=t.toFixed(3);
      if(slider&&document.activeElement!==slider){slider.value=shown;}if(slider)slider.style.setProperty('--tp',(shown/10)+'%');}
    var su=Math.round(ST.am*100);if(su!==lastU){lastU=su;if(t3d){t3d.style.opacity=(.25+.75*ST.am).toFixed(2);t3d.classList.toggle('on',ST.am>.5);}}
  }
  function loop(ts){raf=0;if(!run)return;var dt=last?Math.min(.05,(ts-last)/1000):.016;last=ts;if(!still())step(dt);draw();
    if(!still()&&((CYC.on&&!CYC.frozen)||mouse.on||t>.32||settling>0)){settling--;raf=requestAnimationFrame(loop);}}
  var settling=0;
  function kick(){settling=90;if(!raf&&run){last=0;raf=requestAnimationFrame(loop);}}
  function startIntro(){if(!CYC.on)startCycle(0);}
  frame.addEventListener('pointermove',function(e){var r=frame.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(mouse.on){mouse.vx=x-mouse.x;mouse.vy=y-mouse.y;}mouse.x=x;mouse.y=y;mouse.on=true;kick();if(still())draw();});
  frame.addEventListener('pointerleave',function(){mouse.on=false;mouse.x=mouse.y=-9999;kick();if(still())draw();});
  if(slider)slider.addEventListener('input',function(){freeze();t=slider.value/1000;flat();clearTimeout(CYC.timer);CYC.timer=setTimeout(function(){CYC.timer=0;unfreeze(eForT(t));},4000);kick();if(still())draw();});
  if(replay)replay.addEventListener('click',function(){clearTimeout(CYC.timer);CYC.timer=0;startCycle(0);});
  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){build();draw();},180);});
  new IntersectionObserver(function(es){run=es[0].isIntersecting;if(run)kick();}).observe(frame);
  addEventListener('motionchange',function(e){if(e.detail.off){CYC.on=false;t=0;flat();draw();}else if(heroStart)startCycle(0);});
  function go(){
    build();
    if(still()){t=0;flat();draw();return;}
    t=1;flat();draw();
    heroStart=startIntro;
    if(root.classList.contains('ready'))startIntro();
  }
  if(imgMode){
    var pm=cv.dataset.model&&window.fetch?fetch(cv.dataset.model).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer();}).then(parseModel).catch(function(){return null;}):Promise.resolve(null);
    var pi=new Promise(function(res){src=new Image();src.decoding='async';src.onload=function(){res(true);};src.onerror=function(){imgMode=false;src=null;res(false);};src.src=cv.dataset.img;});
    Promise.all([pi,pm]).then(function(r){model=r[0]?r[1]:null;go();});
  }
  else{var fr=document.fonts&&document.fonts.load?Promise.race([document.fonts.load('600 100px Newsreader'),new Promise(function(r){setTimeout(r,1500);})]):Promise.resolve();fr.then(go,go);}
})();

/* ---------- highlighted project: synced before/after comparison drawn from one stacked video ---------- */
(function(){
  var box=$('[data-cmp]');if(!box)return;
  var v=$('.cmp-src',box),cv=$('.cmp-cv',box),ctx=cv.getContext('2d'),range=$('.cmp-range',box),lab=$('.cmp-l',box),
      play=$('.cmp-play'),split=.5,W=0,H=0,raf=0,vis=false,userPaused=false,PANES=2;
  v.removeAttribute('controls');box.classList.add('live');
  function size(){var r=box.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=Math.round(W*d);cv.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);}
  function draw(){
    if(!v.videoWidth||!W)return;
    var pw=v.videoWidth,ph=v.videoHeight/PANES,sx=split*W;
    ctx.drawImage(v,0,0,pw,ph,0,0,W,H);
    ctx.save();ctx.beginPath();ctx.rect(sx,0,W-sx,H);ctx.clip();ctx.drawImage(v,0,ph,pw,ph,0,0,W,H);ctx.restore();
  }
  function loop(){raf=0;draw();if(vis&&!v.paused)raf=requestAnimationFrame(loop);}
  function kick(){if(!raf)raf=requestAnimationFrame(loop);}
  function setSplit(x){split=clamp(x,0,1);box.style.setProperty('--sx',(split*100).toFixed(2)+'%');lab.style.opacity=split<.18?0:1;$('.cmp-r',box).style.opacity=split>.82?0:1;draw();}
  range.addEventListener('input',function(){setSplit(range.value/1000);});
  function setPlaying(p){if(p){var q=v.play();if(q&&q.catch)q.catch(function(){});}else v.pause();if(play){play.textContent=p?'Pause':'Play';play.setAttribute('aria-pressed',String(!p));}}
  if(play)play.addEventListener('click',function(){userPaused=!v.paused;setPlaying(v.paused);});
  v.addEventListener('play',kick);['loadeddata','canplay','seeked'].forEach(function(e){v.addEventListener(e,draw);});v.addEventListener('loadedmetadata',function(){if(v.paused&&v.currentTime===0){try{v.currentTime=0.01;}catch(e){}}});
  new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis){if(!still()&&!userPaused)setPlaying(true);else draw();}else v.pause();},{threshold:.25}).observe(box);
  addEventListener('motionchange',function(e){if(e.detail.off)setPlaying(false);});
  addEventListener('resize',function(){size();draw();});
  size();setSplit(.5);
  if(still()&&play){play.textContent='Play';}
  /* intro sweep so visitors see it is draggable */
  var swept=false;new IntersectionObserver(function(es,o){if(!es[0].isIntersecting||swept||still())return;swept=true;o.disconnect();
    var t0=performance.now();(function f(n){var p=clamp((n-t0)/1600,0,1);setSplit(.5+Math.sin(p*Math.PI*2)*.22*(1-p));if(p<1)requestAnimationFrame(f);})(t0);},{threshold:.6}).observe(box);
})();

/* ---------- videos that play only while on screen (and never with reduced motion) ---------- */
$$('video[data-auto]').forEach(function(v){
  v.removeAttribute('controls');v.preload='metadata';
  new IntersectionObserver(function(es){if(es[0].isIntersecting&&!still()){var q=v.play();if(q&&q.catch)q.catch(function(){});}else v.pause();},{threshold:.3}).observe(v);
  v.addEventListener('click',function(){if(v.paused){v.play();}else v.pause();});
  addEventListener('motionchange',function(e){if(e.detail.off){v.pause();v.setAttribute('controls','');}});
  if(still())v.setAttribute('controls','');
});

/* ---------- lightbox for figures ---------- */
(function(){
  var dlg=$('.lbox');if(!dlg||typeof dlg.showModal!=='function')return;
  var img=$('img',dlg),opener=null;
  $$('.zoom').forEach(function(b){b.addEventListener('click',function(){opener=b;img.src=b.dataset.full;img.alt=($('img',b)||{}).alt||'';dlg.showModal();});});
  $('.lb-x',dlg).addEventListener('click',function(){dlg.close();});
  dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close();});
  dlg.addEventListener('close',function(){if(opener)opener.focus();});
})();

/* ---------- about: words light up as you read down ---------- */
(function(){
  var el=$('[data-scrub]');if(!el)return;
  (function walk(n){[].slice.call(n.childNodes).forEach(function(c){
    if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(w));return;}var s=document.createElement('span');s.className='sw';s.textContent=w;f.appendChild(s);});n.replaceChild(f,c);}
    else if(c.nodeType===1)walk(c);});})(el);
  var words=$$('.sw',el),lit=-1;
  function upd(){
    if(still()){words.forEach(function(w){w.classList.add('lit');});return;}
    var r=el.getBoundingClientRect(),p=clamp((innerHeight*.85-r.top)/(r.height+innerHeight*.25),0,1),n=Math.round(p*words.length);
    if(n===lit)return;lit=n;for(var i=0;i<words.length;i++)words[i].classList.toggle('lit',i<n);
  }
  scrollers.push(upd);upd();addEventListener('motionchange',upd);
})();

/* ---------- research: pinned section that scrolls sideways ---------- */
(function(){
  var sec=$('.research'),track=$('.rs-track'),idx=$('.rs-i'),prog=$('.rs-prog');if(!sec||!track)return;
  var cards=$$('.th',track),wide=false,dist=0;
  function measure(){
    wide=false; /* research is now a static grid */
    if(!wide){sec.style.removeProperty('--rs-h');track.style.removeProperty('--rx');return;}
    dist=Math.max(0,track.scrollWidth-innerWidth);
    sec.style.setProperty('--rs-h',(innerHeight+dist*1.1)+'px');upd();
  }
  function upd(){
    if(!wide)return;
    var r=sec.getBoundingClientRect(),p=clamp(-r.top/Math.max(1,r.height-innerHeight),0,1);
    track.style.setProperty('--rx',(-p*dist).toFixed(1)+'px');
    if(prog)prog.style.setProperty('--rp',p.toFixed(3));
    if(idx)idx.textContent=String(Math.min(cards.length,1+Math.floor(p*cards.length*.999))).padStart(2,'0');
  }
  scrollers.push(upd);addEventListener('resize',measure);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);measure();
})();

/* ---------- publications: filter + preview card that follows the cursor ---------- */
(function(){
  var list=$('#plist'),btns=$$('.flt button');if(!list)return;
  $$('li',list).forEach(function(li){li.style.setProperty('--c',li.dataset.c||'#3346d3');});
  btns.forEach(function(b){b.addEventListener('click',function(){
    btns.forEach(function(x){x.setAttribute('aria-pressed',String(x===b));});
    var f=b.dataset.f;
    $$('li',list).forEach(function(li){var ok=f==='all'||(' '+li.dataset.k+' ').indexOf(' '+f+' ')>=0;li.hidden=!ok;if(ok)li.classList.add('in');});
  });});
  if(!fine)return;
  var pk=$('.peek');if(!pk)return;
  var pv=$('.pk-v',pk),pt=$('.pk-t',pk),po=$('.pk-o',pk),x=0,y=0,tx=0,ty=0,on=false,raf=0;
  function loop(){raf=0;x=lerp(x,tx,still()?1:.18);y=lerp(y,ty,still()?1:.18);pk.style.setProperty('--x',x.toFixed(1)+'px');pk.style.setProperty('--y',y.toFixed(1)+'px');if(on||Math.abs(x-tx)>.5)raf=requestAnimationFrame(loop);}
  function aim(e){var w=pk.offsetWidth,h=pk.offsetHeight;tx=e.clientX+28;ty=e.clientY+20;if(tx+w>innerWidth-12)tx=e.clientX-w-28;if(ty+h>innerHeight-12)ty=e.clientY-h-20;if(!raf)raf=requestAnimationFrame(loop);}
  $$('li',list).forEach(function(li){
    li.addEventListener('pointerenter',function(e){
      pv.textContent=(li.dataset.venue||$('.pv',li).textContent)+(li.dataset.k.indexOf('first')>=0?' · ★ first / co-first':'');
      pt.textContent=li.dataset.tldr||'';po.textContent=/scholar\.google/.test(($('a',li)||{}).href||'')?'search on Google Scholar ↗':'click to open ↗';
      pk.style.setProperty('--pc',li.dataset.c||'#3346d3');
      if(!on){x=tx=e.clientX+28;y=ty=e.clientY+20;}on=true;pk.classList.add('on');aim(e);
    });
    li.addEventListener('pointermove',aim);
    li.addEventListener('pointerleave',function(){on=false;pk.classList.remove('on');});
  });
})();

/* ---------- experience: an RL rollout drawn through the career states ---------- */
(function(){
  var tj=$('.tj'),svg=$('.tj-path');if(!tj||!svg)return;
  var bg=$('.bg',svg),fg=$('.fg',svg),ag=$('.agent',svg),ha=$('.halo',svg),steps=$$('.st',tj),pts=[],L=0;
  function lenAtY(y){var lo=0,hi=L;for(var i=0;i<22;i++){var m=(lo+hi)/2;if(fg.getPointAtLength(m).y<y)lo=m;else hi=m;}return lo;}
  function build(){
    var R=tj.getBoundingClientRect(),narrow=innerWidth<=800;if(!R.height)return;
    svg.setAttribute('viewBox','0 0 '+R.width.toFixed(0)+' '+R.height.toFixed(0));var lg=svg.querySelector('#tjg');if(lg)lg.setAttribute('y2',R.height.toFixed(0));
    pts=steps.map(function(s,i){var r=s.getBoundingClientRect(),y=r.top-R.top+r.height/2;return {x:narrow?(r.left-R.left-22):(i%2===0?r.right-R.left+34:r.left-R.left-34),y:y};});
    if(!pts.length)return;
    var top={x:narrow?pts[0].x:R.width/2,y:0},d='M'+top.x+' '+top.y,prev=top;
    pts.forEach(function(p){var my=(prev.y+p.y)/2;d+=' C'+prev.x+' '+my+' '+p.x+' '+my+' '+p.x+' '+p.y;prev=p;});
    var end={x:narrow?prev.x:R.width/2,y:R.height},my2=(prev.y+end.y)/2;d+=' C'+prev.x+' '+my2+' '+end.x+' '+my2+' '+end.x+' '+end.y;
    bg.setAttribute('d',d);fg.setAttribute('d',d);L=fg.getTotalLength();fg.style.strokeDasharray=L;
    pts.forEach(function(p){p.l=lenAtY(p.y);});upd();
  }
  function upd(){
    if(!L)return;
    var r=tj.getBoundingClientRect(),ty=innerHeight*.55-r.top,l=still()||ty>=r.height?L:lenAtY(clamp(ty,0,r.height));
    fg.style.strokeDashoffset=(L-l).toFixed(1);
    var p=fg.getPointAtLength(l);ag.setAttribute('cx',p.x);ag.setAttribute('cy',p.y);ha.setAttribute('cx',p.x);ha.setAttribute('cy',p.y);
    steps.forEach(function(s,i){s.classList.toggle('in',still()||l>=pts[i].l-2);});
  }
  scrollers.push(upd);
  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(build,150);});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(build);
  addEventListener('load',build);build();addEventListener('motionchange',upd);
})();

/* ---------- footer: a drifting constellation that links up around the cursor ---------- */
(function(){
  var cv=$('#fnet');if(!cv)return;
  var host=cv.parentNode,ctx=cv.getContext('2d'),W,H,N=[],m={x:-999,y:-999},run=false,raf=0;
  function build(){var r=host.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);
    var n=Math.round(Math.min(80,W*H/16000));N=[];for(var i=0;i<n;i++)N.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:1+Math.random()*1.6});}
  function draw(){ctx.clearRect(0,0,W,H);
    for(var i=0;i<N.length;i++){var a=N[i];
      for(var j=i+1;j<N.length;j++){var b=N[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<120){ctx.strokeStyle='rgba(143,160,255,'+(1-d/120)*.2+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
      var dm=Math.hypot(a.x-m.x,a.y-m.y);if(dm<170){ctx.strokeStyle='rgba(143,160,255,'+(1-dm/170)*.6+')';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(m.x,m.y);ctx.stroke();}
      ctx.fillStyle='rgba(185,195,255,.8)';ctx.beginPath();ctx.arc(a.x,a.y,a.r*(dm<170?1.7:1),0,6.283);ctx.fill();}}
  function step(){N.forEach(function(a){a.x+=a.vx;a.y+=a.vy;if(a.x<0||a.x>W)a.vx*=-1;if(a.y<0||a.y>H)a.vy*=-1;});}
  function loop(){raf=0;if(!run)return;if(!still())step();draw();if(!still())raf=requestAnimationFrame(loop);}
  host.addEventListener('pointermove',function(e){var r=host.getBoundingClientRect();m.x=e.clientX-r.left;m.y=e.clientY-r.top;if(still())draw();});
  host.addEventListener('pointerleave',function(){m.x=m.y=-999;if(still())draw();});
  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){build();draw();},150);});
  new IntersectionObserver(function(es){run=es[0].isIntersecting;if(run&&!raf)raf=requestAnimationFrame(loop);}).observe(host);
  addEventListener('motionchange',function(){if(run&&!raf)raf=requestAnimationFrame(loop);});
  build();draw();
})();

onScroll();
})();
