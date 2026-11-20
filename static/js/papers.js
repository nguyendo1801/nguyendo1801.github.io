/* Animated method figures for the A* papers. Each figure is a canvas drawn in a 640 x 360 logical space and loops over its
   stages; the stage chips under it jump to a stage and pause. Figures play only while visible, and stay still (at a
   representative frame) under reduced motion or the site's pause control. Built from each paper's method section. */
(function(){
'use strict';
var $=function(s,c){return (c||document).querySelector(s);},$$=function(s,c){return [].slice.call((c||document).querySelectorAll(s));};
var still=function(){return window.MOTION?window.MOTION.off():matchMedia('(prefers-reduced-motion: reduce)').matches;};
var TAU=Math.PI*2,LW=640,LH=360;
var clamp=function(v,a,b){return v<a?a:v>b?b:v;},lerp=function(a,b,k){return a+(b-a)*k;};
function ph(t,a,b){return clamp((t-a)/(b-a),0,1);}
function E(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
function rng(s){return function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};}
function gauss(r){var u=1-r(),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);}
var K={ink:[232,235,255],acc:[143,160,255],pink:[255,92,154],teal:[47,224,204],gold:[255,209,102],violet:[177,151,252],orange:[255,138,76],blue:[91,140,255],grey:[150,160,200]};
function C(a,al){return 'rgba('+a[0]+','+a[1]+','+a[2]+','+(al==null?1:al)+')';}
function T(c,s,x,y,col,size,align,w){c.font=(w||400)+' '+(size||11)+'px "Geist Mono",ui-monospace,monospace';c.fillStyle=col;c.textAlign=align||'left';c.textBaseline='middle';c.fillText(s,x,y);}
function TS(c,s,x,y,col,size,align){c.font='italic 400 '+(size||14)+'px Newsreader,Georgia,serif';c.fillStyle=col;c.textAlign=align||'left';c.textBaseline='middle';c.fillText(s,x,y);}
function dot(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,Math.max(0,r),0,TAU);c.fill();}
function ring(c,x,y,r,col,w){c.strokeStyle=col;c.lineWidth=w||1.5;c.beginPath();c.arc(x,y,Math.max(0,r),0,TAU);c.stroke();}
function glow(c,x,y,r,a,al){var g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,C(a,al));g.addColorStop(1,C(a,0));c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function ln(c,x1,y1,x2,y2,col,w,dash,off){c.strokeStyle=col;c.lineWidth=w||1;c.setLineDash(dash||[]);c.lineDashOffset=off||0;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);}
function arrow(c,x1,y1,x2,y2,col,w,head){ln(c,x1,y1,x2,y2,col,w);var a=Math.atan2(y2-y1,x2-x1),h=head||6;c.fillStyle=col;c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-h*Math.cos(a-.45),y2-h*Math.sin(a-.45));c.lineTo(x2-h*Math.cos(a+.45),y2-h*Math.sin(a+.45));c.closePath();c.fill();}
function rr(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);}
function panel(c,x,y,w,h,title,al){rr(c,x,y,w,h,10);c.fillStyle='rgba(255,255,255,'+(.025*(al==null?1:al))+')';c.fill();c.strokeStyle='rgba(255,255,255,'+(.12*(al==null?1:al))+')';c.lineWidth=1;c.stroke();if(title)T(c,title,x+10,y+13,'rgba(232,235,255,'+(.55*(al==null?1:al))+')',9.5);}
function box(c,x,y,w,h,label,col,on,size){rr(c,x,y,w,h,7);c.fillStyle=on?C(col,.22):'rgba(255,255,255,.04)';c.fill();c.strokeStyle=on?C(col,.95):'rgba(255,255,255,.18)';c.lineWidth=on?1.6:1;c.stroke();if(label)T(c,label,x+w/2,y+h/2,on?C(K.ink):'rgba(232,235,255,.6)',size||10,'center');}
function bar(c,x,y,w,h,f,col,label){rr(c,x,y,w,h,h/2);c.fillStyle='rgba(255,255,255,.08)';c.fill();if(f>0){rr(c,x,y,Math.max(h,w*clamp(f,0,1)),h,h/2);c.fillStyle=C(col);c.fill();}if(label)T(c,label,x,y-8,'rgba(232,235,255,.7)',9.5);}
var now=function(){return performance.now()/1000;};

/* shared multiplex drawing (REM, MIM-Reasoner) */
function mkGraph(seed,n,layers,p){
  var r=rng(seed),N=[],L=[];for(var i=0;i<n;i++)N.push([.06+r()*.88,.08+r()*.84]);
  for(var l=0;l<layers;l++){var E2=[],rl=rng(seed*7+l*131);
    for(var a=0;a<n;a++)for(var b=a+1;b<n;b++){var d=Math.hypot(N[a][0]-N[b][0],N[a][1]-N[b][1]);if(d<.36&&rl()<p)E2.push([a,b]);}
    L.push(E2);}
  return {N:N,L:L};
}
function proj(u,v,i,o){return [o.x+u*o.w+v*o.sk,o.y+v*o.h+i*o.gap];}
function plane(c,i,o,col,al,label){var a=proj(0,0,i,o),b=proj(1,0,i,o),d=proj(1,1,i,o),e=proj(0,1,i,o);
  c.beginPath();c.moveTo(a[0]-6,a[1]-6);c.lineTo(b[0]+6,b[1]-6);c.lineTo(d[0]+6,d[1]+6);c.lineTo(e[0]-6,e[1]+6);c.closePath();
  c.fillStyle=C(col,.07*al);c.fill();c.strokeStyle=C(col,.4*al);c.lineWidth=1;c.stroke();if(label)T(c,label,e[0]-4,e[1]+16,C(col,.85*al),9.5);}
function bfs(G,l,seeds,skip){var d={},q=[];seeds.forEach(function(s){d[s]=0;q.push(s);});
  while(q.length){var u=q.shift();G.L[l].forEach(function(e){var v=e[0]===u?e[1]:e[1]===u?e[0]:-1;if(v<0||d[v]!=null||(skip&&skip[v]))return;d[v]=d[u]+1;q.push(v);});}return d;}

var S={};

/* ===================== Hephaestus (NeurIPS 2025) ===================== */
(function(){
  var N=[[48,196],[100,108],[104,288],[170,198],[184,86],[192,300],[250,132],[256,262],[300,196]];
  var EG=[[0,1],[0,2],[0,3],[1,3],[1,4],[2,3],[2,5],[3,6],[3,7],[4,6],[5,7],[6,8],[7,8],[3,8]];
  var XF=[[13,2,.04,.12],[11,1.5,.13,.21],[12,1.5,.22,.30]],XR={13:1.6,2:.6},TH=3.6;
  function sp(w){var n=9,d=[],pv=[],pe=[],dn=[];for(var i=0;i<n;i++){d[i]=1e9;pv[i]=-1;pe[i]=-1;dn[i]=0;}d[0]=0;
    for(var it=0;it<n;it++){var u=-1;for(i=0;i<n;i++)if(!dn[i]&&(u<0||d[i]<d[u]))u=i;dn[u]=1;
      EG.forEach(function(e,k){var v=e[0]===u?e[1]:e[1]===u?e[0]:-1;if(v<0||dn[v])return;var nd=d[u]+w[k];if(nd<d[v]-1e-9){d[v]=nd;pv[v]=u;pe[v]=k;}});}
    var p=[],v=8;while(v>0&&pe[v]>=0){p.push(pe[v]);v=pv[v];}return {d:d[8],p:p};}
  var r=rng(5),SOL=[];for(var i=0;i<34;i++){var m=r()<.45?.25:r()<.64?.58:.82,sd=m===.82?.035:.05;SOL.push([clamp(m+gauss(r)*sd,.04,.96),r()]);}
  function nd(u,m,s){return Math.exp(-.5*Math.pow((u-m)/s,2))/(s*2.5066);}
  var MODES=[[.25,.05,.45],[.58,.05,.35],[.82,.035,.2]];
  function q(u){return MODES.reduce(function(a,m){return a+m[2]*nd(u,m[0],m[1]);},0);}
  S.heph={D:11,poster:.9,beats:[[0,.32],[.32,.62],[.62,1]],draw:function(c,t,tm){
    /* budget vector x */
    var x=EG.map(function(){return 0;}),rp=E(ph(t,.66,.88)),inc=-1;
    XF.forEach(function(f){var k=E(ph(t,f[2],f[3]));x[f[0]]+=f[1]*k;if(t>f[2]&&t<f[3])inc=f[0];});
    if(rp>0)x=x.map(function(v,k){return lerp(v,XR[k]||0,rp);});
    var fade=1-ph(t,.97,1);if(fade<1)x=x.map(function(v){return v*fade;});
    var w=x.map(function(v){return 1+v;}),R=sp(w),onP={};R.p.forEach(function(k){onP[k]=1;});
    panel(c,12,30,318,318,'network · adversary raises edge weights');
    EG.forEach(function(e,k){var a=N[e[0]],b=N[e[1]],s=clamp(x[k]/2,0,1);
      ln(c,a[0],a[1],b[0],b[1],s>0?C(lerp3(K.grey,K.pink,s),.35+.6*s):'rgba(150,160,200,.35)',1.4+x[k]*2.4);
      if(k===inc){var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;glow(c,mx,my,22,K.pink,.6);T(c,'+x',mx+8,my-12,C(K.pink),10);}});
    R.p.forEach(function(k){var a=N[EG[k][0]],b=N[EG[k][1]];ln(c,a[0],a[1],b[0],b[1],C(K.teal,.95),2.2,[6,6],-tm*40);});
    N.forEach(function(p,i){var st=i===0||i===8;if(st){glow(c,p[0],p[1],20,st?K.gold:K.ink,.35);}dot(c,p[0],p[1],st?7:5,st?C(K.gold):'#e8ebff');});
    T(c,'s',N[0][0]-16,N[0][1],C(K.gold),12,'center',600);T(c,'t',N[8][0]+15,N[8][1],C(K.gold),12,'center',600);
    var budget=x.reduce(function(a,b){return a+b;},0);
    T(c,'‖x‖₁ = '+budget.toFixed(1),318,46,C(K.ink,.85),10.5,'right');
    /* gauge */
    var gx=34,gw=270,gy=328,f=R.d/5;bar(c,gx,gy,gw,7,f,R.d>=TH-1e-6?K.pink:K.teal,'shortest s→t cost '+R.d.toFixed(2)+(R.d>=TH-1e-6?'  ≥ T ✓':''));
    var tx=gx+gw*TH/5;ln(c,tx,gy-5,tx,gy+12,C(K.gold),1.5);T(c,'T',tx,gy+19,C(K.gold),9.5,'center');
    /* right: Forge solutions → Morph densities → Refine latent */
    var lat=ph(t,.6,.66),den=1-lat,px=342,pw=286,py=30,phh=318;
    if(den>0){panel(c,px,py,pw,phh,t<.32?'Forge · feasible solutions D_sol':'Morph · Mix-CVAE Ω ↔ energy model q',den);
      var bx=px+16,bw=pw-32,base=py+phh-34,hh=170,np=Math.round(SOL.length*ph(t,.02,.3));
      ln(c,bx,base,bx+bw,base,'rgba(255,255,255,'+(.3*den)+')',1);T(c,'solution space',bx+bw,base+14,'rgba(232,235,255,'+(.45*den)+')',9,'right');
      for(var s2=0;s2<np;s2++)dot(c,bx+SOL[s2][0]*bw,base-6-SOL[s2][1]*16,2.6,C(K.gold,.85*den));
      var mp=ph(t,.32,.6);
      if(mp>0){var a1=E(ph(mp,0,.3)),a2=E(ph(mp,.33,.63)),a3=E(ph(mp,.66,.96)),al=[a1,a2,a3];
        function om(u){var v=(1-a1)*nd(u,.5,.22);MODES.forEach(function(m,i){v+=al[i]*m[2]*nd(u,m[0],m[1])+(i>0?(1-al[i])*0:0);});return v;}
        function curve(fn,col,fill){c.beginPath();for(var k2=0;k2<=80;k2++){var u=k2/80,y=base-fn(u)*hh/9;k2?c.lineTo(bx+u*bw,y):c.moveTo(bx+u*bw,y);}
          if(fill){c.lineTo(bx+bw,base);c.lineTo(bx,base);c.closePath();c.fillStyle=C(col,.22*den*mp);c.fill();}else{c.strokeStyle=C(col,.95*den*Math.min(1,mp*3));c.lineWidth=2;c.stroke();}}
        curve(om,K.orange,true);curve(q,K.blue,false);curve(om,K.orange,false);
        var Kn=1+(a2>.5?1:0)+(a3>.5?1:0);if(a1<.5)Kn=1;
        T(c,'experts K = '+Kn,px+pw-12,py+34,C(K.orange,den),10,'right');
        T(c,'— q (EBM)',bx,py+34,C(K.blue,den),9.5);T(c,'— Ω (Mix-CVAE)',bx+80,py+34,C(K.orange,den),9.5);
        var gap=mp<.33?.58:mp<.66?.82:-1;if(gap>0){var gxp=bx+gap*bw;ln(c,gxp,py+48,gxp,base,C(K.ink,.6*den),1,[3,4]);T(c,'log q/Ω > δ → add expert',Math.min(gxp,bx+bw-120),py+56,C(K.ink,.75*den),9);}}
    }
    if(lat>0){panel(c,px,py,pw,phh,'Refine · RL agent moves z in latent space',lat);c.save();rr(c,px,py,pw,phh,10);c.clip();
      var cx=px+200,cy=py+110;for(var k3=7;k3>=1;k3--){c.beginPath();c.ellipse(cx,cy,k3*20,k3*13,-.4,0,TAU);c.fillStyle=C(K.teal,.035*lat);c.fill();c.strokeStyle=C(K.teal,.16*lat);c.lineWidth=1;c.stroke();}
      var path=[[px+40,py+280],[px+80,py+250],[px+110,py+205],[px+140,py+178],[px+165,py+140],[cx-6,cy+4]],u2=E(ph(t,.66,.9))*(path.length-1),seg=Math.floor(u2),fr=u2-seg;
      for(var k4=0;k4<Math.min(seg+1,path.length-1);k4++){var A=path[k4],B=path[k4+1],ff=k4<seg?1:fr;if(ff>.05)arrow(c,A[0],A[1],lerp(A[0],B[0],ff),lerp(A[1],B[1],ff),C(K.ink,.75*lat),1.4,5);}
      var cur=seg>=path.length-1?path[path.length-1]:[lerp(path[seg][0],path[seg+1][0],fr),lerp(path[seg][1],path[seg+1][1],fr)];
      glow(c,cur[0],cur[1],18,K.gold,.7*lat);dot(c,cur[0],cur[1],5,C(K.gold,lat));T(c,'z',cur[0]+10,cur[1]-10,C(K.gold,lat),11,'left',600);
      T(c,'z ← z + (μ, σ)',px+16,py+40,C(K.ink,.8*lat),10);
      bar(c,px+16,py+phh-26,pw-32,7,.25+.7*rp,K.teal,'reward  F − ϰ·log(1+‖x‖₁)');c.restore();
    }
  }};
})();
function lerp3(a,b,k){return [lerp(a[0],b[0],k)|0,lerp(a[1],b[1],k)|0,lerp(a[2],b[2],k)|0];}

/* ===================== Swift Hydra (ICLR 2025) ===================== */
(function(){
  var r=rng(11),X0=36,XW=348,CY=200;function cyf(x){return CY+52*Math.sin((x-X0)/XW*TAU);}
  var NOR=[];for(var i=0;i<70;i++){var x=X0+r()*XW;NOR.push([x,cyf(x)+(r()-.5)*16]);}
  var AN=[];while(AN.length<18){var p=[30+r()*360,52+r()*280],d=Math.abs(p[1]-cyf(p[0]));if(d>78){var xx=clamp(p[0],50,372),sd=p[1]>cyf(xx)?1:-1;AN.push({p1:p,p2:[xx,cyf(xx)+sd*30],top:AN.length%2===0,dl:r()*.04});}}
  var PAIRS=[[0,3],[1,4],[2,5],[0,4],[3,5],[1,2]];
  S.hydra={D:10,poster:.86,beats:[[0,.3],[.3,.55],[.55,.8],[.8,1]],draw:function(c,t,tm){
    panel(c,12,30,396,318,'data space · normal manifold + generated anomalies');
    var w=lerp(80,20,E(ph(t,.55,.8)));
    c.beginPath();for(var x=X0;x<=X0+XW;x+=6)c.lineTo(x,cyf(x)-w);for(x=X0+XW;x>=X0;x-=6)c.lineTo(x,cyf(x)+w);c.closePath();
    c.fillStyle=C(K.blue,.09);c.fill();c.strokeStyle=C(K.blue,.55);c.lineWidth=1.2;c.setLineDash([5,5]);c.stroke();c.setLineDash([]);
    T(c,'detector boundary',X0+XW-4,cyf(X0+XW)-w-10,C(K.blue,.9),9.5,'right');
    NOR.forEach(function(p){dot(c,p[0],p[1],2.4,C(K.blue,.9));});
    /* C-VAE decoder */
    var ox=58,oy=318;box(c,ox-38,oy-14,76,24,'C-VAE  z→x̂',K.teal,t<.3);
    var rl=ph(t,.3,.52),top=ph(t,.5,.56),mg=E(ph(t,.56,.78));
    AN.forEach(function(a){var k=E(ph(t,.05+a.dl,.27+a.dl));if(k<=0)return;var p=[lerp(ox,a.p1[0],k),lerp(oy,a.p1[1],k)],b=E(rl);
      p=[lerp(p[0],a.p2[0],b),lerp(p[1],a.p2[1],b)];
      if(rl>0&&rl<1){var dx=a.p2[0]-p[0],dy=a.p2[1]-p[1],L=Math.hypot(dx,dy);if(L>8)arrow(c,p[0],p[1],p[0]+dx/L*Math.min(22,L),p[1]+dy/L*Math.min(22,L),C(K.ink,.55),1.1,5);}
      var al=a.top?1:1-.85*top;if(a.top&&top>0)glow(c,p[0],p[1],14,K.teal,.55*top);
      dot(c,p[0],p[1],3.4,C(lerp3(K.pink,K.teal,a.top?mg:0),al));if(a.top&&mg>0)ring(c,p[0],p[1],6,C(K.teal,.8*mg),1.2);});
    /* reward meters */
    if(t>.28&&t<.62){var al2=ph(t,.28,.32)*(1-ph(t,.58,.62));bar(c,26,62,130,6,.3+.6*rl,K.teal,'');T(c,'entropy H(D ∪ x̂) ↑',26,54,C(K.ink,.8*al2),9);
      bar(c,180,62,130,6,.85-.6*rl,K.pink,'');T(c,'detector confidence ↓',180,54,C(K.ink,.8*al2),9);}
    if(t>.5&&t<.8)T(c,'keep top-l samples → retrain',26,84,C(K.teal,.9),9.5);
    /* Mixture of Mamba experts */
    var on=ph(t,.6,.66),px=420,py=30,pw=208,phh=318;panel(c,px,py,pw,phh,'Mixture of Mamba experts',.6+.4*on);
    box(c,px+14,py+40,70,26,'input x',K.ink,on>0);box(c,px+14,py+146,70,40,'noisy',K.violet,on>0,9.5);T(c,'top-k gate',px+49,py+176,C(K.ink,.6+.4*on),9,'center');
    arrow(c,px+49,py+66,px+49,py+144,'rgba(232,235,255,.5)',1.2,5);
    var sel=PAIRS[Math.floor(tm*1.6)%PAIRS.length];
    for(var e=0;e<6;e++){var ey=py+40+e*44,act=on>0&&(sel[0]===e||sel[1]===e);
      if(act){var g=.4+.6*Math.abs(Math.sin(tm*4));ln(c,px+84,py+166,px+112,ey+15,C(K.teal,.9*on),1.6);glow(c,px+150,ey+15,30,K.teal,.25*g*on);}
      box(c,px+112,ey,78,30,'Mamba '+(e+1),K.teal,act);}
    T(c,'k = 2 experts per input',px+pw/2,py+phh-14,C(K.ink,.7),9,'center');
  }};
})();

/* ===================== Semantic OT (NeurIPS 2026) ===================== */
(function(){
  var r=rng(23);
  function mf(x,a,b,ph0){return [x,a+b*Math.sin(x/38+ph0)];}
  var FA=[],FB=[];for(var i=0;i<6;i++){FA.push(mf(46+i*26,118,26,0));FB.push(mf(244+i*28,112,22,2));}
  var tA=FA[2],b1=FB[3],b2=FB[1];
  function cloud(seed,n,sx,sy){var r2=rng(seed),P=[];for(var i=0;i<n;i++)P.push({dx:gauss(r2)*sx,dy:gauss(r2)*sy,w:.3+r2()*.7});P.sort(function(a,b){return a.dx-b.dx;});return P;}
  var CA=cloud(3,18,22,14),C1=cloud(9,18,22,14),C2=cloud(17,18,20,12);
  var RA=[130,286],R1=[170,292],R2=[338,280];
  var cr=rng(41),CN=[],CE=[],CL=[0,0,0,0,0,1,1,1,1,2,2,2,2,2],CC=[[490,120],[575,205],[490,280]];
  for(i=0;i<14;i++)CN.push([444+cr()*168,64+cr()*262]);for(i=0;i<22;i++){var a=(cr()*14)|0,b=(cr()*14)|0;if(a!==b)CE.push([a,b]);}
  S.sot={D:11,poster:.77,beats:[[0,.18],[.18,.52],[.52,.8],[.8,1]],draw:function(c,t,tm){
    var man=1-.75*ph(t,.38,.5);
    panel(c,12,30,412,318,'SAE features on two layers');
    function curve(F,col,lab){c.beginPath();F.forEach(function(p,i){i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);});c.strokeStyle=C(col,.45*man);c.lineWidth=1.4;c.stroke();T(c,lab,F[0][0],F[0][1]-26,C(col,.85*man),9.5);}
    curve(FA,K.gold,'layer A');curve(FB,K.acc,'layer B');
    FA.concat(FB).forEach(function(p){dot(c,p[0],p[1],3,C(K.ink,.6*man));});
    if(t<.2){var al=1-ph(t,.14,.19);[[tA,K.gold],[b1,K.teal],[b2,K.pink]].forEach(function(o,i){arrow(c,o[0][0],o[0][1],o[0][0]+[24,10,30][i],o[0][1]-[30,34,26][i],C(o[1],al),1.6,6);});
      T(c,'decoder-vector cosine → picks B₂ ✗',24,186,C(K.pink,al),9.5);}
    [[tA,K.gold,'A'],[b1,K.teal,'B₁'],[b2,K.pink,'B₂']].forEach(function(o){dot(c,o[0][0],o[0][1],5,C(o[1]));T(c,o[2],o[0][0]+8,o[0][1]+12,C(o[1]),9.5);});
    var bl=E(ph(t,.18,.34)),mv=E(ph(t,.36,.52));
    var refA=ph(t,.34,.4);if(refA>0){rr(c,24,212,388,126,10);c.fillStyle='rgba(255,255,255,'+(.03*refA)+')';c.fill();c.strokeStyle='rgba(255,255,255,'+(.14*refA)+')';c.stroke();T(c,'shared reference space R (layer-A hidden states)',34,224,C(K.ink,.55*refA),9);}
    function pos(o,R,P,i){return [lerp(o[0],R[0],mv)+P[i].dx*bl,lerp(o[1],R[1],mv)+P[i].dy*bl];}
    var ot=ph(t,.54,.72);
    if(ot>0){CA.forEach(function(p,i){var a=pos(tA,RA,CA,i),b=pos(b1,R1,C1,i),d=pos(b2,R2,C2,i),k=ph(ot,i/18*.6,i/18*.6+.4);
      if(k>0){ln(c,a[0],a[1],lerp(a[0],b[0],k),lerp(a[1],b[1],k),C(K.teal,.55*p.w),1);ln(c,a[0],a[1],lerp(a[0],d[0],k),lerp(a[1],d[1],k),C(K.pink,.22*p.w),1);}});}
    [[tA,RA,CA,K.gold],[b1,R1,C1,K.teal],[b2,R2,C2,K.pink]].forEach(function(o){if(bl<=0)return;o[2].forEach(function(p,i){var q=pos(o[0],o[1],o[2],i);dot(c,q[0],q[1],(1.3+p.w*3)*bl,C(o[3],.85));});});
    if(bl>0&&t<.36)T(c,'each feature → activation-weighted cloud of its top-K tokens',24,200,C(K.ink,.75*ph(t,.2,.26)),9);
    if(ot>0){bar(c,240,168,160,6,.22*E(ot),K.teal,'W(A, B₁)  small = similar');bar(c,240,196,160,6,.78*E(ot),K.pink,'W(A, B₂)');}
    var mt=ph(t,.72,.78);if(mt>0&&t<.98){var q1=[R1[0],R1[1]];glow(c,q1[0],q1[1],42,K.teal,.35*mt);T(c,'match ✓  B₁',R1[0]+30,R1[1]-36,C(K.teal,mt),11,'left',600);}
    /* circuit compression */
    var cp=E(ph(t,.82,.96)),px=432,py=30;panel(c,px,py,196,318,'circuit → supernodes',.6+.4*ph(t,.78,.82));
    var P2=CN.map(function(p,i){var k=CC[CL[i]];return [lerp(p[0],k[0]+(p[0]-k[0])*.25,cp),lerp(p[1],k[1]+(p[1]-k[1])*.25,cp)];});
    CE.forEach(function(e){ln(c,P2[e[0]][0],P2[e[0]][1],P2[e[1]][0],P2[e[1]][1],'rgba(232,235,255,'+(.18*(1-cp*.6))+')',1);});
    if(cp>.3){var al3=ph(cp,.3,1);[[0,1],[1,2],[0,2]].forEach(function(e){ln(c,CC[e[0]][0],CC[e[0]][1],CC[e[1]][0],CC[e[1]][1],C(K.violet,.55*al3),3.5);});
      CC.forEach(function(k,i){glow(c,k[0],k[1],44,[K.gold,K.teal,K.violet][i],.25*al3);ring(c,k[0],k[1],34,C([K.gold,K.teal,K.violet][i],.7*al3),1.2);T(c,'S'+(i+1),k[0],k[1]-42,C(K.ink,.85*al3),10,'center');});}
    P2.forEach(function(p,i){dot(c,p[0],p[1],3.4,C([K.gold,K.teal,K.violet][CL[i]],cp>0?1:.7));});
  }};
})();

/* ===================== Q-ShiftDP (AISTATS 2026) ===================== */
(function(){
  var r=rng(7),SH=[];for(var i=0;i<60;i++)SH.push({v:r()<.68?1:-1,x:r(),d:r()});
  var GR=[];for(i=0;i<9;i++)GR.push([r()*TAU,.35+r()*.6]);
  S.qdp={D:10,poster:.9,beats:[[0,.3],[.3,.55],[.55,.75],[.75,1]],draw:function(c,t,tm){
    panel(c,12,30,292,318,'variational quantum circuit');
    var wy=[74,108,142],x0=34,x1=282,G=[[86,0,'θ₁'],[86,1,'θ₂'],[150,1,'θ₃'],[150,2,'θ₄'],[214,0,'θ₅']];
    wy.forEach(function(y,i){ln(c,x0,y,x1-28,y,'rgba(232,235,255,.45)',1.2);T(c,'|0⟩',x0-2,y,C(K.ink,.6),9.5,'right');});
    ln(c,118,74,118,108,'rgba(232,235,255,.5)',1.2);dot(c,118,74,3,'#e8ebff');ring(c,118,108,6,'rgba(232,235,255,.7)',1.2);
    ln(c,182,108,182,142,'rgba(232,235,255,.5)',1.2);dot(c,182,108,3,'#e8ebff');ring(c,182,142,6,'rgba(232,235,255,.7)',1.2);
    var hi=t<.32;G.forEach(function(g){box(c,g[0]-17,wy[g[1]]-11,34,22,'R('+g[2]+')',K.violet,hi&&g[2]==='θ₃',9);});
    box(c,x1-30,60,24,96,'⟨O⟩',K.gold,false,9);
    var p1=E(ph(t,.04,.18)),p2=E(ph(t,.14,.3));
    [[206,'θ₃ + π/2','r₊'],[250,'θ₃ − π/2','r₋']].forEach(function(o,i){var al=i?p2:p1;if(al<=0)return;
      ln(c,x0,o[0],x1-60,o[0],'rgba(232,235,255,'+(.4*al)+')',1.2);box(c,140,o[0]-11,72,22,'R('+o[1]+')',K.violet,true,9);
      box(c,x1-58,o[0]-11,28,22,o[2],K.gold,true,9.5);arrow(c,x1-30,o[0],x1-12,o[0]+(i?-14:14),C(K.gold,al),1.2,5);});
    if(p2>.5)T(c,'g = (r₊ − r₋) / 2',x0,298,C(K.gold,ph(t,.22,.3)),11,'left',600);
    T(c,'parameter-shift rule: exact gradient from 2 runs',x0,322,C(K.ink,.55),9);
    /* shots */
    var px=314,sp2=ph(t,.3,.55),n=Math.round(SH.length*sp2);panel(c,px,30,150,150,'finite shots N');
    var cnt={1:0,'-1':0};for(var s2=0;s2<n;s2++){var o=SH[s2];cnt[o.v]++;var bxx=o.v>0?px+100:px+46,yy=166-cnt[o.v]*2.6;dot(c,bxx+(o.x-.5)*30,yy,2.2,C(o.v>0?K.teal:K.pink,.9));}
    T(c,'−1',px+46,174,C(K.pink),9,'center');T(c,'+1',px+100,174,C(K.teal),9,'center');
    if(n>4){var est=(cnt[1]-cnt['-1'])/n,band=60/Math.sqrt(n);var ex=px+73+est*30;ln(c,ex,52,ex,150,C(K.gold),1.4);rr(c,ex-band,52,band*2,98,3);c.fillStyle=C(K.gold,.12);c.fill();T(c,'N = '+(n*17),px+140,46,C(K.ink,.7),9,'right');}
    /* bounded gradient */
    var bp=ph(t,.55,.72);panel(c,px,190,150,158,'bounded gradients',.6+.4*bp);
    var cx=px+75,cy=274,R=50;ring(c,cx,cy,R,C(K.gold,.8),1.4);T(c,'Δ',cx+R*.72+4,cy-R*.72-4,C(K.gold),10);
    GR.forEach(function(g,i){var k=E(ph(bp,i/9*.6,i/9*.6+.4));if(k>0)arrow(c,cx,cy,cx+Math.cos(g[0]+tm*.2)*R*g[1]*k,cy+Math.sin(g[0]+tm*.2)*R*g[1]*k,C(K.teal,.85),1.3,5);});
    if(bp>0)T(c,'‖g‖ ≤ Δ  → no clipping',px+75,338,C(K.ink,.8*bp),9,'center');
    /* noise budget */
    var nb=ph(t,.75,.95),qx=474;panel(c,qx,30,154,318,'noise for (ε, δ)-DP',.6+.4*ph(t,.72,.76));
    var Ns=Math.round(lerp(10000,100,E(nb))),shot=lerp(.14,.56,E(nb)),hy=60,hh=230,bx=qx+50;
    rr(c,bx,hy,54,hh,8);c.fillStyle='rgba(255,255,255,.05)';c.fill();
    rr(c,bx,hy+hh*(1-shot),54,hh*shot,8);c.fillStyle=C(K.teal,.75);c.fill();
    rr(c,bx,hy,54,hh*(1-shot),8);c.fillStyle=C(K.gold,.7);c.fill();
    T(c,'added',bx+27,hy+hh*(1-shot)/2-6,'#0e1530',9.5,'center',600);T(c,'Gaussian',bx+27,hy+hh*(1-shot)/2+7,'#0e1530',9.5,'center',600);
    T(c,'shot',bx+27,hy+hh*(1-shot/2)-6,'#0e1530',9.5,'center',600);T(c,'noise',bx+27,hy+hh*(1-shot/2)+7,'#0e1530',9.5,'center',600);
    T(c,'N = '+Ns.toLocaleString('en-US')+' shots',qx+77,hy+hh+18,C(K.ink,.8),9.5,'center');
    T(c,'fewer shots → less noise added',qx+77,hy+hh+34,C(K.teal,.9*nb),9,'center');
  }};
})();

/* ===================== Hexaïssa (AAAI 2026) ===================== */
(function(){
  var POS=[
    {p:[['♚',4,7],['♛',3,4],['♞',5,5],['♟',2,6],['♔',6,0],['♕',3,0],['♘',2,2],['♙',4,3]],m:[2,2,3,4],e:1},
    {p:[['♚',6,7],['♜',0,7],['♝',2,5],['♟',6,6],['♔',6,0],['♖',3,0],['♗',5,3],['♙',5,1]],m:[5,3,2,4],e:3},
    {p:[['♚',3,6],['♞',1,5],['♟',4,5],['♟',5,6],['♔',2,1],['♕',7,3],['♘',4,2],['♙',3,3]],m:[7,3,4,4],e:0}];
  var PR=[[.18,.52,.1,.12,.08],[.1,.12,.16,.5,.12],[.48,.15,.12,.1,.15]];
  S.hexa={D:12,poster:.18,beats:[[0,.25],[.25,.55],[.55,.85],[.85,1]],beatOf:function(t){var u=(t*3)%1;return u<.25?0:u<.55?1:u<.85?2:3;},
  draw:function(c,t,tm){
    var si=Math.min(2,Math.floor(t*3)),u=(t*3)%1,P=POS[si],bx=26,by=64,sq=26;
    panel(c,12,30,236,318,'position '+(si+1)+' of the game');
    for(var f=0;f<8;f++)for(var rk=0;rk<8;rk++){c.fillStyle=(f+rk)%2?'rgba(143,160,255,.16)':'rgba(255,255,255,.05)';c.fillRect(bx+f*sq,by+(7-rk)*sq,sq,sq);}
    c.font='20px "Segoe UI Symbol","Noto Sans Symbols 2","DejaVu Sans",serif';c.textAlign='center';c.textBaseline='middle';
    P.p.forEach(function(q){var white='♔♕♖♗♘♙'.indexOf(q[0])>=0;c.fillStyle=white?'#f4f5ff':'#ffb38a';c.fillText(q[0],bx+q[1]*sq+sq/2,by+(7-q[2])*sq+sq/2+1);});
    var enc=ph(u,.02,.22),rt=E(ph(u,.25,.5)),mv=E(ph(u,.55,.8)),rw=ph(u,.85,.98);
    var bxr=bx+8*sq;arrow(c,bxr+4,by+104,bxr+4+28*Math.max(enc,.001),by+104,C(K.ink,.6),1.3,5);
    box(c,268,148,66,40,'encoder',K.acc,enc>0&&u<.3);
    dot(c,366,168,9+3*Math.sin(tm*3)*(enc>0?1:0),C(K.gold,.9));T(c,'z',366,190,C(K.gold),11,'center',600);
    ln(c,334,168,357,168,C(K.ink,.5),1.2);
    /* router */
    var rx=394,ry=96;panel(c,rx-8,ry-26,66,174,'router');
    var pr=PR[si];for(var e=0;e<5;e++){var v=lerp(.2,pr[e],rt),h=v*120;rr(c,rx+e*11,ry+126-h,8,h,3);c.fillStyle=C(e===P.e?K.gold:K.acc,e===P.e?.95:.5);c.fill();}
    T(c,'softmax over engines',rx+25,ry+142,C(K.ink,.55),8.5,'center');
    for(e=0;e<5;e++){var ey=52+e*56,act=e===P.e&&rt>.6;if(act){ln(c,rx+58,ry+60,486,ey+20,C(K.gold,.9),1.8);glow(c,540,ey+20,46,K.gold,.22);}
      box(c,486,ey,120,40,'engine '+(e+1),K.gold,act,10);}
    if(mv>0){var m=P.m,x1=bx+m[0]*sq+sq/2,y1=by+(7-m[1])*sq+sq/2,x2=bx+m[2]*sq+sq/2,y2=by+(7-m[3])*sq+sq/2;
      arrow(c,x1,y1,lerp(x1,x2,mv),lerp(y1,y2,mv),C(K.gold,.95),3,9);T(c,'move from engine '+(P.e+1),bx,by+8*sq+18,C(K.gold,mv),9.5);}
    var hist=si+rw;bar(c,268,316,206,6,.25+.22*hist,K.teal,'latent reward r(z) · learned from play');
    if(rw>0)glow(c,268+206*(.25+.22*hist),319,16,K.teal,.6*(1-rw));
    T(c,'router picks one expert engine per position',268,282,C(K.ink,.6),9);
  }};
})();

/* ===================== REM (AAAI 2025) ===================== */
(function(){
  var G=mkGraph(19,13,3,.55),O={x:30,y:54,w:200,h:58,sk:52,gap:90},COLS=[K.blue,K.violet,K.teal];
  var S0=[1,7],S1=[3,9,11],SHR=[2,5,8,10];
  var r=rng(31),CL=[];for(var i=0;i<26;i++)CL.push([352+gauss(r)*16+20,170+gauss(r)*12]);
  var MEM=[.42,.5,.58,.63,.71,.77,.84,.92];
  S.rem={D:10,poster:.8,beats:[[0,.25],[.25,.5],[.5,.75],[.75,1]],draw:function(c,t,tm){
    panel(c,12,30,290,318,'multiplex · 3 layers');
    for(var l=2;l>=0;l--)plane(c,l,O,COLS[l],1,'layer '+(l+1));
    SHR.forEach(function(n){var a=proj(G.N[n][0],G.N[n][1],0,O),b=proj(G.N[n][0],G.N[n][1],2,O);ln(c,a[0],a[1],b[0],b[1],'rgba(232,235,255,.22)',1,[2,4]);});
    var seeds=t<.5?S0:S1,start=t<.5?.06:.55,spread=0,litAny={};
    for(l=0;l<3;l++){var d=bfs(G,l,seeds);
      G.L[l].forEach(function(e){var a=proj(G.N[e[0]][0],G.N[e[0]][1],l,O),b=proj(G.N[e[1]][0],G.N[e[1]][1],l,O);ln(c,a[0],a[1],b[0],b[1],C(COLS[l],.28),1);});
      G.N.forEach(function(p,n){var q=proj(p[0],p[1],l,O),dd=d[n],on=dd!=null&&t>start+dd*.05+(l*.012)&&(t<.5||t>.55);
        if(on){litAny[n]=1;glow(c,q[0],q[1],10,COLS[l],.55);}dot(c,q[0],q[1],seeds.indexOf(n)>=0&&on?4.6:3,on?C(COLS[l]):'rgba(232,235,255,.35)');
        if(seeds.indexOf(n)>=0&&on)ring(c,q[0],q[1],7,C(K.gold,.9),1.4);});}
    spread=Object.keys(litAny).length;T(c,'spread = '+spread+' users',290,46,C(K.ink,.85),10,'right');
    T(c,t<.5?'seed set from a random z':'seed set decoded from optimized z',24,334,C(t<.5?K.ink:K.gold,.75),9.5);
    /* latent landscape */
    var px=312,py=30;panel(c,px,py,316,166,'Seed2Vec latent space · predicted spread');c.save();rr(c,px,py,316,166,10);c.clip();
    var cx=px+246,cy=py+70;for(var k=6;k>=1;k--){c.beginPath();c.ellipse(cx,cy,k*20,k*11,.3,0,TAU);c.fillStyle=C(K.gold,.03);c.fill();c.strokeStyle=C(K.gold,.15);c.stroke();}
    CL.forEach(function(p){dot(c,p[0],p[1],2.2,C(K.acc,.6));});
    var cl=E(ph(t,.25,.5)),zp=[lerp(372,cx,cl),lerp(170,cy,cl)];
    if(t>.2){for(var j=0;j<5;j++){var a1=j/5,a2=(j+1)/5;if(cl>a1)arrow(c,lerp(372,cx,a1),lerp(170,cy,a1),lerp(372,cx,Math.min(cl,a2)),lerp(170,cy,Math.min(cl,a2)),C(K.ink,.6),1.2,5);}}
    glow(c,zp[0],zp[1],16,K.gold,.7);dot(c,zp[0],zp[1],4.5,C(K.gold));T(c,'z',zp[0]+8,zp[1]-10,C(K.gold),11,'left',600);
    T(c,'gradient ascent on predicted spread',px+12,py+150,C(K.ink,.6),9);c.restore();
    /* PMoE + memory */
    var qy=206,pm=ph(t,.5,.56);panel(c,px,qy,160,142,'PMoE · GNN experts',.6+.4*pm);
    var rw=[.2+.5*Math.abs(Math.sin(tm*.9)),.3+.4*Math.abs(Math.sin(tm*.7+1)),.25+.45*Math.abs(Math.sin(tm*1.1+2))];
    for(var e=0;e<3;e++){var ey=qy+30+e*34;box(c,px+12,ey,74,24,'depth '+(e+1),K.violet,pm>0&&rw[e]>.45,9.5);bar(c,px+96,ey+9,52,6,rw[e],K.violet,'');}
    T(c,'router weights',px+122,qy+130,C(K.ink,.55),8.5,'center');
    var mm=ph(t,.75,.82),mx=px+168;panel(c,mx,qy,148,142,'priority memory',.6+.4*mm);
    MEM.forEach(function(v,i){var h=v*86*E(ph(t,.74+i*.008,.84+i*.008)),top=i>=5;rr(c,mx+14+i*16,qy+118-h,11,h,3);c.fillStyle=top&&mm>0?C(K.gold,.95):C(K.acc,.45);c.fill();});
    if(mm>0){var pul=.5+.5*Math.sin(tm*6);T(c,'top-k → retrain',mx+74,qy+132,C(K.gold,.7+.3*pul),9,'center');}
  }};
})();

/* ===================== MIM-Reasoner (AISTATS 2024) ===================== */
(function(){
  var G=mkGraph(53,13,3,.5),O={x:30,y:54,w:200,h:58,sk:52,gap:90},COLS=[K.blue,K.violet,K.teal];
  var SEED=[[2,6],[4],[1,12]],SHR=[0,3,6,9,11],BUD=[2,1,2];
  var cr=rng(61),TN=[],TE=[[0,1],[1,2],[1,3],[3,4],[3,5]];for(var i=0;i<6;i++)TN.push([492+cr()*120,240+cr()*90]);
  S.mim={D:11,poster:.92,beats:[[0,.22],[.22,.45],[.45,.68],[.68,.9],[.9,1]],draw:function(c,t,tm){
    panel(c,12,30,290,318,'multiplex · 3 layers');
    for(var l=2;l>=0;l--)plane(c,l,O,COLS[l],1,'layer '+(l+1));
    SHR.forEach(function(n){var a=proj(G.N[n][0],G.N[n][1],0,O),b=proj(G.N[n][0],G.N[n][1],2,O);ln(c,a[0],a[1],b[0],b[1],'rgba(232,235,255,.28)',1,[2,4]);});
    /* activation times: layer 1 seeds at .25; spread; bridges copy to other layers; layer 2/3 agents skip lit nodes */
    var act={},T0=[.26,.7,.8];
    var d0=bfs(G,0,SEED[0]);Object.keys(d0).forEach(function(n){act['0:'+n]=T0[0]+d0[n]*.04;});
    SHR.forEach(function(n){if(act['0:'+n]!=null)for(var l2=1;l2<3;l2++)act[l2+':'+n]=Math.max(.47,act['0:'+n]+.06);});
    for(var l3=1;l3<3;l3++){var lit={};SHR.forEach(function(n){if(act[l3+':'+n]!=null)lit[n]=1;});
      var sd=SEED[l3].filter(function(n){return !lit[n];}),d=bfs(G,l3,sd,lit);Object.keys(d).forEach(function(n){if(act[l3+':'+n]==null)act[l3+':'+n]=T0[l3]+d[n]*.035;});}
    var total={};
    for(l=0;l<3;l++){G.L[l].forEach(function(e){var a=proj(G.N[e[0]][0],G.N[e[0]][1],l,O),b=proj(G.N[e[1]][0],G.N[e[1]][1],l,O);ln(c,a[0],a[1],b[0],b[1],C(COLS[l],.26),1);});
      G.N.forEach(function(p,n){var q=proj(p[0],p[1],l,O),at=act[l+':'+n],on=at!=null&&t>=at,isSeed=SEED[l].indexOf(n)>=0&&t>=T0[l];
        var bridged=on&&l>0&&SHR.indexOf(n)>=0&&act['0:'+n]!=null;
        if(on){total[n]=1;glow(c,q[0],q[1],10,COLS[l],.5);}dot(c,q[0],q[1],isSeed?4.6:3,on?C(COLS[l]):'rgba(232,235,255,.35)');
        if(isSeed)ring(c,q[0],q[1],7,C(K.gold,.9),1.4);
        if(bridged&&t>.68&&t<.9){ln(c,q[0]-5,q[1]-5,q[0]+5,q[1]+5,C(K.pink,.8),1.4);ln(c,q[0]-5,q[1]+5,q[0]+5,q[1]-5,C(K.pink,.8),1.4);}});}
    T(c,'spread = '+Object.keys(total).length+' users',290,46,C(K.ink,.85),10,'right');
    if(t>.68&&t<.9)T(c,'✕ already active via another layer → agent skips',24,334,C(K.pink,.85),9.5);
    else if(t>.45&&t<.68)T(c,'overlapping users carry influence across layers',24,334,C(K.ink,.75),9.5);
    /* knapsack */
    var px=312,py=30,kp=ph(t,.02,.2);panel(c,px,py,316,170,'phase 1 · budget l = 5 split by knapsack (MCKP)');
    var slot=48,cx0=px+40;rr(c,cx0-4,py+108,slot*5+8,34,8);c.strokeStyle='rgba(232,235,255,.5)';c.lineWidth=1.2;c.stroke();
    var off=0;BUD.forEach(function(b,l){var k=E(ph(kp,l*.25,l*.25+.5)),sx=px+20+l*96,sy=py+40,tx=cx0+off*slot,ty=py+112;
      rr(c,lerp(sx,tx,k),lerp(sy,ty,k),b*slot-4,26,6);c.fillStyle=C(COLS[l],.75);c.fill();T(c,'layer '+(l+1)+' · '+b,lerp(sx,tx,k)+(b*slot-4)/2,lerp(sy,ty,k)+13,'#0e1530',9.5,'center',600);off+=b;});
    T(c,'one option per layer, total ≤ l',px+16,py+156,C(K.ink,.55),9);
    /* PGM + guarantee */
    var gp=ph(t,.45,.68),qy=210;panel(c,px,qy,316,138,'phase 2 · per-layer RL + Chow-Liu tree (PGM)',.6+.4*gp);
    TE.forEach(function(e,i){var k=ph(gp,i/5*.7,i/5*.7+.3);if(k>0){var a=TN[e[0]],b=TN[e[1]];ln(c,a[0],a[1],lerp(a[0],b[0],k),lerp(a[1],b[1],k),C(K.violet,.8),1.6);}});
    TN.forEach(function(p,i){dot(c,p[0],p[1],5,C(COLS[i%3]));});
    var gg=ph(t,.9,.95);
    rr(c,px+12,qy+26,150,88,8);c.fillStyle='rgba(255,255,255,'+(.04+.08*gg)+')';c.fill();
    T(c,'approximation ratio',px+20,qy+42,C(K.ink,.6+.4*gg),9);
    TS(c,'(1−ε)(1−1/e)',px+20,qy+66,C(K.gold,.7+.3*gg),16);TS(c,'/ ((o+1)·k)',px+40,qy+92,C(K.gold,.7+.3*gg),16);
    if(gg>0)glow(c,px+87,qy+70,80,K.gold,.18*gg);
  }};
})();

/* ===================== Research threads (card art) ===================== */
function pill(c,x,y,s,col,al,anchor){al=al==null?1:al;c.font='500 16px "Geist Mono",ui-monospace,monospace';var w=c.measureText(s).width+22,h=28;
  if(anchor){ln(c,anchor[0],anchor[1],x,y,C(col,.45*al),1.2,[3,4]);dot(c,anchor[0],anchor[1],3.5,C(col,al));}
  rr(c,x-w/2,y-h/2,w,h,h/2);c.fillStyle='rgba(14,21,48,'+(.82*al)+')';c.fill();c.strokeStyle=C(col,.85*al);c.lineWidth=1.3;c.stroke();
  c.fillStyle=C(K.ink,.95*al);c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y+1);}
function bob(tm,i){return Math.sin(tm*1.3+i*1.7)*3;}
/* RL: an agent learns a path through a gridworld */
(function(){
  var COLS=10,ROWS=6,cs=44,ox=100,oy=26,PATH=[[0,5],[1,5],[1,4],[2,4],[3,4],[3,3],[4,3],[5,3],[5,2],[6,2],[7,2],[7,1],[8,1],[9,1],[9,0]];
  var WALL={'2,2':1,'2,3':1,'4,1':1,'4,2':1,'6,4':1,'6,5':1,'8,3':1,'8,4':1};
  S['r-rl']={D:7,poster:.7,beats:[],draw:function(c,t,tm){
    for(var x=0;x<COLS;x++)for(var y=0;y<ROWS;y++){var k=x+','+y;rr(c,ox+x*cs+2,oy+y*cs+2,cs-4,cs-4,8);c.fillStyle=WALL[k]?'rgba(143,160,255,.18)':'rgba(255,255,255,.035)';c.fill();}
    var learn=E(ph(t,0,.35));
    PATH.forEach(function(p,i){if(i===PATH.length-1)return;var q=PATH[i+1],cx=ox+p[0]*cs+cs/2,cy=oy+p[1]*cs+cs/2,a=i/PATH.length<learn;
      if(a)arrow(c,cx-(q[0]-p[0])*10,cy-(q[1]-p[1])*10,cx+(q[0]-p[0])*12,cy+(q[1]-p[1])*12,C(K.acc,.55),1.8,7);});
    var g=PATH[PATH.length-1],gx=ox+g[0]*cs+cs/2,gy=oy+g[1]*cs+cs/2;glow(c,gx,gy,40+6*Math.sin(tm*4),K.gold,.45);TS(c,'r',gx,gy+1,C(K.gold),26,'center');
    var u=E(ph(t,.3,.95))*(PATH.length-1),i0=Math.floor(u),f=u-i0,A=PATH[i0],B=PATH[Math.min(i0+1,PATH.length-1)];
    var ax=ox+lerp(A[0],B[0],f)*cs+cs/2,ay=oy+lerp(A[1],B[1],f)*cs+cs/2;
    for(var j=0;j<Math.min(i0+1,PATH.length);j++){var P=PATH[j];dot(c,ox+P[0]*cs+cs/2,oy+P[1]*cs+cs/2,4,C(K.teal,.5));}
    glow(c,ax,ay,30,K.teal,.6);dot(c,ax,ay,10,C(K.teal));TS(c,'π(a|s)',ax+16,ay-22,C(K.ink,.9),20);
    pill(c,150,330,'Hexaïssa · AAAI’26',K.acc,1,[150+bob(tm,0),306]);pill(c,370,330+bob(tm,1),'REM · AAAI’25',K.teal);pill(c,560,330+bob(tm,2),'MO-PPO',K.gold);
  }};
})();
/* Optimization: seeds spread influence over a graph */
(function(){
  var r=rng(77),N=[],E2=[];for(var i=0;i<22;i++)N.push([60+r()*520,40+r()*240]);
  for(var a=0;a<22;a++)for(var b=a+1;b<22;b++)if(Math.hypot(N[a][0]-N[b][0],N[a][1]-N[b][1])<130&&r()<.6)E2.push([a,b]);
  var SEEDS=[3,14],D={},q=[];SEEDS.forEach(function(s){D[s]=0;q.push(s);});
  while(q.length){var u=q.shift();E2.forEach(function(e){var v=e[0]===u?e[1]:e[1]===u?e[0]:-1;if(v>=0&&D[v]==null){D[v]=D[u]+1;q.push(v);}});}
  S['r-opt']={D:7,poster:.8,beats:[],draw:function(c,t,tm){
    var w=t*7,fade=1-ph(t,.92,1);
    E2.forEach(function(e){var a=N[e[0]],b=N[e[1]],on=D[e[0]]!=null&&D[e[1]]!=null&&Math.max(D[e[0]],D[e[1]])<w;
      ln(c,a[0],a[1],b[0],b[1],on?C(K.teal,.55*fade):'rgba(150,160,200,.22)',on?2:1.2);});
    N.forEach(function(p,i){var d=D[i],on=d!=null&&d<w;var pulse=on&&d>w-1?1-(w-d):0;
      if(pulse>0)ring(c,p[0],p[1],10+pulse*26,C(K.teal,.6*pulse),1.5);
      if(on)glow(c,p[0],p[1],18,K.teal,.45*fade);dot(c,p[0],p[1],SEEDS.indexOf(i)>=0?9:5.5,SEEDS.indexOf(i)>=0?C(K.gold):on?C(K.teal,fade+.0001):'rgba(232,235,255,.5)');});
    SEEDS.forEach(function(s){ring(c,N[s][0],N[s][1],15,C(K.gold,.8),1.6);});
    var n=N.filter(function(p,i){return D[i]!=null&&D[i]<w;}).length;TS(c,'σ(S) = '+n,600,40,C(K.ink,.9),22,'right');
    pill(c,170,330+bob(tm,0),'MIM-Reasoner · AISTATS’24',K.teal);pill(c,430,330+bob(tm,1),'CHARME · TQC’25',K.acc);
  }};
})();
/* Generative: particles denoise into structure, then dissolve */
(function(){
  var r=rng(5),P=[];for(var i=0;i<220;i++){var a=i/220*TAU,k=i%2;var tx=320+Math.cos(a)*(k?130:70)*1.25,ty=160+Math.sin(a)*(k?130:70)*.75;P.push({tx:tx,ty:ty,nx:gauss(r),ny:gauss(r),c:k?K.pink:K.gold,ph:r()*TAU});}
  S['r-gen']={D:7,poster:.5,beats:[],draw:function(c,t,tm){
    var s=t<.5?1-E(ph(t,.05,.45)):E(ph(t,.62,.98)),A=s*190;
    P.forEach(function(p){var x=p.tx+p.nx*A+Math.cos(tm+p.ph)*1.5,y=p.ty+p.ny*A*.8+Math.sin(tm+p.ph)*1.5;dot(c,x,y,2.6,C(p.c,.35+.6*(1-s)));});
    if(s<.15)glow(c,320,160,150,K.pink,.12*(1-s/.15));
    TS(c,'t = '+Math.round(s*1000),600,40,C(K.ink,.85),22,'right');TS(c,'noise → structure',40,40,C(K.ink,.6),20);
    pill(c,140,330+bob(tm,0),'Sim-to-real',K.acc);pill(c,330,330+bob(tm,1),'Hephaestus · NeurIPS’25',K.pink);pill(c,540,330+bob(tm,2),'Swift Hydra',K.teal);
  }};
})();
/* MoE: tokens routed to their top-2 experts */
(function(){
  var r=rng(9),TK=[];for(var i=0;i<16;i++){var a=(r()*4)|0,b=(a+1+((r()*3)|0))%4;TK.push({a:a,b:b,o:i/16,c:[K.violet,K.teal,K.gold,K.pink][(r()*4)|0]});}
  S['r-moe']={D:6,poster:.4,beats:[],draw:function(c,t,tm){
    var gx=230,EY=[60,120,180,240],ex=420,ox=600;
    box(c,gx-34,120,68,80,'',K.violet,true);TS(c,'gate',gx,160,C(K.ink),20,'center');
    EY.forEach(function(y,i){var load=0;TK.forEach(function(k){var u=(t+k.o)%1;if(u>.4&&u<.75&&(k.a===i||k.b===i))load++;});
      box(c,ex-50,y-22,100,44,'',K.violet,load>0);T(c,'expert '+(i+1),ex,y,C(K.ink,load?1:.6),15,'center');if(load)glow(c,ex,y,60,K.violet,.15*load);});
    TK.forEach(function(k){var u=(t+k.o)%1,x,y;
      if(u<.4){x=lerp(30,gx-34,u/.4);y=160+Math.sin(u*9+k.o*20)*20;dot(c,x,y,6,C(k.c));}
      else if(u<.75){var f=(u-.4)/.35;[k.a,k.b].forEach(function(e,j){var yy=lerp(160,EY[e],E(Math.min(1,f*1.6)));x=lerp(gx+34,ex-50,f);dot(c,x,yy,4.5,C(k.c,.85));});}
      else{var f2=(u-.75)/.25;x=lerp(ex+50,ox,f2);y=lerp((EY[k.a]+EY[k.b])/2,160,f2);dot(c,x,y,6,C(k.c));}});
    T(c,'top-2',gx,214,C(K.ink,.6),14,'center');
    pill(c,130,330+bob(tm,0),'RAPTOR',K.violet);pill(c,330,330+bob(tm,1),'HARMONIA',K.teal);pill(c,520,330+bob(tm,2),'Hexaïssa',K.gold);
  }};
})();
/* Theory: optimal transport between feature distributions + anisotropy */
(function(){
  var r=rng(13),A=[],B=[];for(var i=0;i<20;i++){A.push([170+gauss(r)*38,150+gauss(r)*30]);B.push([470+gauss(r)*30,160+gauss(r)*40]);}
  A.sort(function(p,q){return p[1]-q[1];});B.sort(function(p,q){return p[1]-q[1];});
  S['r-theory']={D:7,poster:.6,beats:[],draw:function(c,t,tm){
    var k=E(ph(t,.1,.6)),fade=1-ph(t,.9,1);
    A.forEach(function(p,i){var q=B[i];if(k>0)ln(c,p[0],p[1],lerp(p[0],q[0],k),lerp(p[1],q[1],k),C(K.gold,.35*fade),1.2);
      var m=E(ph(t,.55,.85))*fade;dot(c,lerp(p[0],q[0],m*.0),p[1],4,C(K.gold));});
    B.forEach(function(q){dot(c,q[0],q[1],4,C(K.teal));});
    var ang=tm*.6;c.save();c.translate(320,160);c.rotate(ang);c.beginPath();c.ellipse(0,0,46+20*Math.sin(tm),14,0,0,TAU);c.strokeStyle=C(K.violet,.85);c.lineWidth=2;c.stroke();c.restore();
    TS(c,'W(μ, ν)',320,104,C(K.ink,.9),24,'center');TS(c,'Σ anisotropic',320,226,C(K.violet),18,'center');
    pill(c,150,318+bob(tm,0),'Semantic OT · NeurIPS’26',K.gold);pill(c,470,318+bob(tm,1),'SPHINX',K.teal);pill(c,500,40+bob(tm,2),'Q-ShiftDP · AISTATS’26',K.violet,.9);
  }};
})();
/* Hardware: light pulses through a photonic switch the agent controls */
(function(){
  S['r-hw']={D:6,poster:.3,beats:[],draw:function(c,t,tm){
    var y1=110,y2=210,x0=40,x1=250,x2=390,x3=600,cross=Math.floor(t*2)%2===1;
    rr(c,x1,80,x2-x1,160,16);c.fillStyle='rgba(255,138,76,.08)';c.fill();c.strokeStyle=C(K.orange,.6);c.lineWidth=1.5;c.stroke();
    [y1,y2].forEach(function(y){ln(c,x0,y,x1,y,C(K.ink,.4),6);ln(c,x2,y,x3,y,C(K.ink,.4),6);});
    if(cross){c.strokeStyle=C(K.orange,.9);c.lineWidth=5;c.beginPath();c.moveTo(x1,y1);c.bezierCurveTo(x1+70,y1,x2-70,y2,x2,y2);c.moveTo(x1,y2);c.bezierCurveTo(x1+70,y2,x2-70,y1,x2,y1);c.stroke();}
    else{ln(c,x1,y1,x2,y1,C(K.orange,.9),5);ln(c,x1,y2,x2,y2,C(K.orange,.9),5);}
    T(c,cross?'cross':'bar',(x1+x2)/2,64,C(K.orange),15,'center',600);
    for(var i=0;i<6;i++){var u=((t*2)%1+i/6)%1,lane=i%2,x=lerp(x0,x3,u),y;
      if(x<x1)y=lane?y2:y1;else if(x>x2)y=cross?(lane?y1:y2):(lane?y2:y1);else{var f=(x-x1)/(x2-x1);y=cross?lerp(lane?y2:y1,lane?y1:y2,E(f)):(lane?y2:y1);}
      glow(c,x,y,22,lane?K.teal:K.gold,.8);dot(c,x,y,5,'#fff');}
    box(c,286,256,68,30,'RL',K.acc,true,14);ln(c,320,256,320,240,C(K.acc,.8),1.5,[3,3]);
    pill(c,140,330+bob(tm,0),'Photonic NoC · Sci. Rep.',K.orange);pill(c,390,330+bob(tm,1),'DeepChaos+ · Photonics',K.teal);pill(c,560,36+bob(tm,2),'3-mode switch',K.gold,.9);
  }};
})();

/* ===================== runner ===================== */
$$('[data-scene]').forEach(function(card){
  var sc=S[card.dataset.scene];if(!sc)return;
  var cv=$('.ap-cv',card),ctx=cv.getContext('2d'),chips=$$('.beats button',card),pp=$('.ap-pp',card);
  var vis=false,raf=0,t0=now(),paused=false,tHold=sc.poster,ready=false;
  function size(){var r=cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(!r.width)return;cv.width=Math.round(r.width*d);cv.height=Math.round(r.width*d*LH/LW);ready=true;}
  function render(t){if(!ready)size();if(!ready)return;var s=cv.width/LW;ctx.setTransform(s,0,0,s,0,0);ctx.fillStyle='#0e1530';ctx.fillRect(0,0,LW,LH);
    ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=1;for(var x=0;x<LW;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,LH);ctx.stroke();}for(var y=0;y<LH;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(LW,y);ctx.stroke();}
    try{sc.draw(ctx,t,now());}catch(e){if(window.console)console.error(e);}
    var bi=sc.beatOf?sc.beatOf(t):sc.beats.findIndex(function(b){return t>=b[0]&&t<b[1];});if(bi<0)bi=sc.beats.length-1;
    chips.forEach(function(ch,i){ch.classList.toggle('on',i===bi);ch.setAttribute('aria-pressed',String(i===bi));});}
  function cur(){return paused||still()?tHold:((now()-t0)/sc.D)%1;}
  function loop(){raf=0;if(!vis)return;render(cur());if(!paused&&!still())raf=requestAnimationFrame(loop);}
  function kick(){if(!raf&&vis)raf=requestAnimationFrame(loop);}
  function setPaused(p){if(!p){t0=now()-tHold*sc.D;}else tHold=cur();paused=p;if(pp){pp.setAttribute('aria-pressed',String(p));pp.setAttribute('aria-label',p?'Play animation':'Pause animation');pp.classList.toggle('paused',p);}kick();render(cur());}
  if(pp)pp.addEventListener('click',function(){setPaused(!paused);});
  chips.forEach(function(ch,i){ch.addEventListener('click',function(){var b=sc.beats[i];tHold=sc.beatOf?(Math.floor(cur()*3)%3+(b[0]+b[1])/2)/3:lerp(b[0],b[1],.75);paused=true;setPaused(true);tHold=sc.beatOf?(Math.min(2,Math.floor(tHold*3))+(b[0]+b[1])/2)/3:lerp(b[0],b[1],.75);render(tHold);});});
  new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis){kick();render(cur());}},{threshold:.15}).observe(cv);
  addEventListener('resize',function(){ready=false;size();render(cur());});
  addEventListener('motionchange',function(){if(!still()&&!paused)t0=now()-tHold*sc.D;kick();render(cur());});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){render(cur());});
  size();render(cur());
});
})();
