/* OneMoreCase deterministic puzzle engine. No network, no external assets. */
(function(root){
'use strict';
const vehicles=[['Pocket','City hatch',5,5,0],['Breeze','Compact',6,5,25],['Nomad','Touring',6,6,50],['Vista','Family SUV',7,6,75],['Trail','Adventure',7,7,100],['Atlas','Estate XL',8,7,125],['Comet','Electric SUV',8,8,150],['Voyager','Minivan',9,8,175],['Summit','Expedition',9,9,200],['Horizon','Grand tourer',10,9,225]];
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function normalize(cells){let mx=Math.min(...cells.map(c=>c[0])),my=Math.min(...cells.map(c=>c[1]));return cells.map(([x,y])=>[x-mx,y-my]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);}
function rotate(cells,r){let out=cells;for(let i=0;i<(r%4+4)%4;i++)out=out.map(([x,y])=>[-y,x]);return normalize(out);}
const colors=['#ee9978','#55b8ad','#e8bd55','#859dd3','#ba8fb5','#7fb887','#d17e70','#8db8c6'];
function level(n){if(!Number.isInteger(n)||n<1||n>250)throw Error('Invalid level');let rand=rng(73013+n*7919),chapter=Math.floor((n-1)/25),v=vehicles[chapter],w=v[2],h=v[3],blocked=[],used=new Set(),key=(x,y)=>x+','+y;
 let obstacleCount=n<26?0:Math.min(9,2+chapter);for(let i=0;i<obstacleCount;i++){let x=Math.floor(rand()*w),y=1+Math.floor(rand()*(h-1));if(!used.has(key(x,y))){used.add(key(x,y));blocked.push([x,y]);}}
 let pieces=[],solution=[];let target= n<8?3:n<26?4:chapter<4?5:6;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(used.has(key(x,y)))continue;let cluster=[[x,y]];used.add(key(x,y));let size=2+Math.floor(rand()*target);while(cluster.length<size){let next=[];for(let [cx,cy]of cluster)for(let[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=cx+dx,ny=cy+dy;if(nx>=0&&ny>=0&&nx<w&&ny<h&&!used.has(key(nx,ny)))next.push([nx,ny]);}if(!next.length)break;let c=next[Math.floor(rand()*next.length)];cluster.push(c);used.add(key(...c));}
 let ox=Math.min(...cluster.map(c=>c[0])),oy=Math.min(...cluster.map(c=>c[1])),canonical=normalize(cluster),r=n<11?0:Math.floor(rand()*4),type='case';if(n>=51&&cluster.every(c=>c[1]>=Math.floor(h/2)))type='heavy';else if(n>=101&&cluster.some(c=>c[1]===0))type='access';else if(n>=76&&cluster.every(c=>c[1]<Math.floor(h/2)-1))type='fragile';
 if(type==='case'&&n>=226&&cluster.some(c=>c[0]===0||c[0]===w-1||c[1]===h-1))type='edge';else if(type==='case'&&n>=176&&cluster.every(c=>c[0]<Math.floor(w/2)))type='dry';else if(type==='case'&&n>=126&&pieces.length%3===0){type='upright';r=0;}
 let id=pieces.length;pieces.push({id,cells:rotate(canonical,r),type,color:colors[(id+chapter)%colors.length],weight:cluster.length*(type==='heavy'?3:1)});solution.push({id,x:ox,y:oy,r:(4-r)%4});}
 // Shuffle the tray independently of the stored witness; IDs remain stable.
 let order=pieces.map(p=>p.id);for(let i=order.length-1;i>0;i--){let j=Math.floor(rand()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 let totalWeight=pieces.reduce((s,p)=>s+p.weight,0);return {n,chapter,w,h,vehicle:v,blocked,pieces,order,solution,totalWeight,par:pieces.length+Math.max(2,11-chapter),features:{rotate:n>=11,obstacles:n>=26,heavy:n>=51,fragile:n>=76,access:n>=101,upright:n>=126,dry:n>=176,edge:n>=226}};
}
function cellsAt(p,a){return rotate(p.cells,a.r).map(([x,y])=>[x+a.x,y+a.y]);}
function check(l,placements,id,a){let p=l.pieces[id];if(!p||![a.x,a.y,a.r].every(Number.isInteger))return {ok:false,reason:'outside'};if(!l.features.rotate&&a.r!==0)return {ok:false,reason:'rotation'};let cells=cellsAt(p,a),occupied=new Set();for(let q of l.pieces)if(q.id!==id&&placements[q.id])for(let c of cellsAt(q,placements[q.id]))occupied.add(c.join(','));let blocked=new Set(l.blocked.map(c=>c.join(',')));
 for(let [x,y]of cells){if(x<0||y<0||x>=l.w||y>=l.h)return {ok:false,reason:'outside'};if(blocked.has(x+','+y))return {ok:false,reason:'blocked'};if(occupied.has(x+','+y))return {ok:false,reason:'overlap'};if(p.type==='heavy'&&y<Math.floor(l.h/2))return {ok:false,reason:'heavy'};}
 if(p.type==='upright'&&a.r%4!==0)return {ok:false,reason:'upright'};
 if(p.type==='dry'&&!cells.every(c=>c[0]<Math.floor(l.w/2)))return {ok:false,reason:'dry'};
 if(p.type==='edge'&&!cells.some(c=>c[0]===0||c[0]===l.w-1||c[1]===l.h-1))return {ok:false,reason:'edge'};
 if(p.type==='access'&&!cells.some(c=>c[1]===0))return {ok:false,reason:'access'};
 for(let q of l.pieces){if(q.id===id||!placements[q.id]||!((p.type==='fragile'&&q.type==='heavy')||(p.type==='heavy'&&q.type==='fragile')))continue;for(let c of cells)for(let d of cellsAt(q,placements[q.id]))if(Math.abs(c[0]-d[0])+Math.abs(c[1]-d[1])===1)return {ok:false,reason:'fragile'};}
 return {ok:true};}
function complete(l,placements){return l.pieces.every(p=>placements[p.id]&&check(l,placements,p.id,placements[p.id]).ok);}
function blank(){return {version:1,stars:{},coins:0,unlocked:1,selectedVehicle:0,active:null,settings:{language:'en',sound:true,haptics:true,reducedMotion:false,contrast:false}};}
function sanitize(data){let s=blank();if(!data||data.version!==1)return s;for(let [n,v]of Object.entries(data.stars||{}))if(+n>=1&&+n<=250&&Number.isInteger(v)&&v>=1&&v<=3)s.stars[n]=v;s.coins=Object.values(s.stars).reduce((a,b)=>a+b,0)*20;s.unlocked=1;while(s.unlocked<250&&s.stars[s.unlocked])s.unlocked++;let opts=data.settings||{};if(['tr','de','en'].includes(opts.language))s.settings.language=opts.language;for(let k of ['sound','haptics','reducedMotion','contrast'])if(typeof opts[k]==='boolean')s.settings[k]=opts[k];if(Number.isInteger(data.selectedVehicle)&&data.selectedVehicle>=0&&data.selectedVehicle<10)s.selectedVehicle=data.selectedVehicle;
 let a=data.active;if(a&&Number.isInteger(a.n)&&a.n>=1&&a.n<=s.unlocked){let l=level(a.n),p={},valid=true;for(let[id,v]of Object.entries(a.placements||{})){if(!check(l,p,+id,v).ok){valid=false;break;}p[id]={x:v.x,y:v.y,r:v.r};}if(valid&&Number.isInteger(a.moves)&&a.moves>=0)s.active={n:a.n,placements:p,moves:a.moves,hints:Number.isInteger(a.hints)&&a.hints>=0?a.hints:0};}return s;}
function award(s,l,moves,hints){let score=hints>0?1:moves<=l.par?3:moves<=l.par*2?2:1,old=s.stars[l.n]||0;s.stars[l.n]=Math.max(old,score);s.coins+=(Math.max(old,score)-old)*20;while(s.unlocked<250&&s.stars[s.unlocked])s.unlocked++;return score;}
const api={vehicles,level,rotate,cellsAt,check,complete,blank,sanitize,award};if(typeof module!=='undefined')module.exports=api;else root.OMC=api;
})(typeof globalThis!=='undefined'?globalThis:this);
