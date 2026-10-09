/* Original vehicle and luggage artwork. All shapes follow the puzzle's exact cell footprint. */
(function(root){
'use strict';
const paint=['#eab663','#62aaa1','#e8886f','#839acc','#82a37c','#c095ba','#708f9d','#daab65','#9aafba','#cd866d'];
function shade(hex,f){let n=parseInt(hex.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(v=>Math.min(255,Math.round(v*f)).toString(16).padStart(2,'0')).join('');}
function edges(cells){const s=new Set(cells.map(c=>c.join(','))),out=[];for(let[x,y]of cells){if(!s.has(x+','+(y-1)))out.push([[x,y],[x+1,y]]);if(!s.has((x+1)+','+y))out.push([[x+1,y],[x+1,y+1]]);if(!s.has(x+','+(y+1)))out.push([[x+1,y+1],[x,y+1]]);if(!s.has((x-1)+','+y))out.push([[x,y+1],[x,y]]);}return out;}
function outline(cells){let e=edges(cells),loops=[];while(e.length){let first=e.shift(),points=[first[0],first[1]],end=first[1];while(end.join(',')!==points[0].join(',')){let i=e.findIndex(a=>a[0].join(',')===end.join(','));if(i<0)break;let a=e.splice(i,1)[0];end=a[1];points.push(end);}loops.push(points);}return loops;}
function symbol(type){return {heavy:'◆',fragile:'◇',access:'↗',upright:'↑',dry:'☂',edge:'⌗'}[type]||'';}
function screenCells(p,r,rotate){let cells=rotate(p.cells,r),maxY=Math.max(...cells.map(c=>c[1]));return cells.map(([x,y])=>[x,maxY-y]);}
function tray(p,r,rotate){let cells=screenCells(p,r,rotate),w=Math.max(...cells.map(c=>c[0]))+1,h=Math.max(...cells.map(c=>c[1]))+1,unit=20,paths=outline(cells).map(loop=>'M'+loop.map(([x,y])=>[x*unit+6,y*unit+7].join(',')).join('L')+'Z').join(''),first=cells.reduce((a,b)=>b[1]<a[1]?b:a),hx=first[0]*unit+16,hy=first[1]*unit+7;let bottom=cells.filter(c=>c[1]===h-1).sort((a,b)=>a[0]-b[0]),left=bottom[0][0]*unit+10,right=bottom[bottom.length-1][0]*unit+22;return `<svg viewBox="0 0 ${w*unit+12} ${h*unit+17}" aria-hidden="true"><path d="${paths}" fill="#17303d24" transform="translate(1 3)"/><path d="${paths}" fill="${p.color}" stroke="${shade(p.color,.64)}" stroke-width="2" stroke-linejoin="round"/><path d="${paths}" fill="none" stroke="#fff8e4a0" stroke-width="1" stroke-linejoin="round" transform="translate(1 0)"/><path d="M${hx-5},${hy}v-4q5,-3 10,0v4" fill="none" stroke="#253d46" stroke-width="3" stroke-linecap="round"/>${cells.map(([x,y])=>`<path d="M${x*unit+12},${y*unit+12}v10m5,-10v10" stroke="${shade(p.color,.77)}" stroke-width="1.4" stroke-linecap="round"/>`).join('')}<rect x="${left}" y="${h*unit+6}" width="5" height="6" rx="2" fill="#243b45"/><rect x="${right-5}" y="${h*unit+6}" width="5" height="6" rx="2" fill="#243b45"/><rect x="${hx+3}" y="${hy+5}" width="7" height="8" rx="1" fill="#fff7df"/><path d="M${hx+4},${hy+7}h5m-5,2h4" stroke="#7f8272" stroke-width=".7"/></svg>`;}
function polygon(c,pts,fill,stroke,width=1){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function round(c,x,y,w,h,r,fill,stroke){c.beginPath();r=Math.min(r,w/2,h/2);c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function draw(canvas,l,placements,selected,ghost,drag,engine,label){let W=canvas.clientWidth,H=canvas.clientHeight,dpr=Math.min(2,root.devicePixelRatio||1);canvas.width=W*dpr;canvas.height=H*dpr;let c=canvas.getContext('2d');c.scale(dpr,dpr);const cx=W/2,top=H*.40,bottom=H*.77,rear=W*.45,front=W*.73,depth=bottom-top,height=Math.max(7,W*.024),color=paint[l.chapter];
 const project=(x,y,z=0)=>{let t=y/l.h,width=front+(rear-front)*t;return [cx+(x/l.w-.5)*width,bottom-depth*t-z];};
 const inverse=(sx,sy)=>{let y=(bottom-sy)/depth*l.h,width=front+(rear-front)*y/l.h;return [(sx-cx)/width*l.w+l.w/2,y];};
 const projection={project,inverse,height,tw:front/l.w,th:depth/l.h,ox:cx,oy:top};
 let bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#f0f1e9');bg.addColorStop(1,'#dce4d9');c.fillStyle=bg;c.fillRect(0,0,W,H);
 c.fillStyle='#bbcdbd';c.beginPath();c.ellipse(cx,H*.91,W*.42,H*.035,0,0,Math.PI*2);c.fill();
 // Tires sit behind the rear body, with visible tread and fender coverage.
 for(let side of [-1,1]){let x=cx+side*W*.392-W*.037;round(c,x,H*.64,W*.074,H*.25,8,'#1b2c32');round(c,x+W*.012,H*.68,W*.049,H*.15,5,'#35474b');for(let j=0;j<5;j++){c.strokeStyle='#526167';c.beginPath();c.moveTo(x+5,H*.70+j*7);c.lineTo(x+W*.074-5,H*.70+j*7);c.stroke();}}
 let body=c.createLinearGradient(0,H*.34,0,H*.90);body.addColorStop(0,shade(color,1.14));body.addColorStop(.6,color);body.addColorStop(1,shade(color,.76));
 c.beginPath();c.moveTo(W*.22,H*.35);c.quadraticCurveTo(W*.12,H*.42,W*.095,H*.65);c.lineTo(W*.10,H*.81);c.quadraticCurveTo(W*.10,H*.87,W*.18,H*.88);c.lineTo(W*.82,H*.88);c.quadraticCurveTo(W*.90,H*.87,W*.90,H*.81);c.lineTo(W*.905,H*.65);c.quadraticCurveTo(W*.88,H*.42,W*.78,H*.35);c.closePath();c.fillStyle=body;c.fill();c.strokeStyle=shade(color,.62);c.lineWidth=1.5;c.stroke();
 // Open hatch: colored frame, glass, brake strip, lock and gas struts.
 let hatchTop=l.chapter>=6?H*.115:H*.14,hatchWidth=l.chapter>=6?W*.68:W*.61;
 polygon(c,[[cx-hatchWidth/2,hatchTop],[cx+hatchWidth/2,hatchTop],[W*.79,H*.325],[W*.21,H*.325]],shade(color,.72),'#263e46',2);
 polygon(c,[[cx-hatchWidth/2+8,hatchTop+7],[cx+hatchWidth/2-8,hatchTop+7],[W*.76,H*.30],[W*.24,H*.30]],color);
 let glass=c.createLinearGradient(0,hatchTop,0,H*.30);glass.addColorStop(0,'#a5c4c6');glass.addColorStop(1,'#395562');polygon(c,[[W*.25,hatchTop+15],[W*.75,hatchTop+15],[W*.715,H*.278],[W*.285,H*.278]],glass,'#263d46',3);
 polygon(c,[[W*.28,hatchTop+19],[W*.39,hatchTop+19],[W*.53,H*.269],[W*.44,H*.269]],'#ffffff21');
 round(c,W*.43,hatchTop+2,W*.14,4,2,'#cb4944');round(c,W*.46,H*.302,W*.08,4,2,'#233d43');
 for(let side of [-1,1]){let x1=cx+side*W*.27,x2=cx+side*W*.315;c.strokeStyle='#233840';c.lineWidth=4;c.beginPath();c.moveTo(x1,H*.318);c.lineTo(x2,H*.49);c.stroke();c.strokeStyle='#aabbb6';c.lineWidth=1.5;c.beginPath();c.moveTo(x1,H*.318);c.lineTo(x2,H*.44);c.stroke();}
 // Boot opening and seat backs behind the usable cargo floor.
 polygon(c,[[W*.25,H*.337],[W*.75,H*.337],[W*.85,H*.775],[W*.15,H*.775]],'#263b3e','#142e35',3);
 round(c,W*.32,H*.35,W*.16,H*.07,5,'#475856');round(c,W*.52,H*.35,W*.16,H*.07,5,'#475856');round(c,W*.365,H*.325,W*.065,H*.037,4,'#344846');round(c,W*.57,H*.325,W*.065,H*.037,4,'#344846');
 // Deep carpeted sidewalls around a perspective floor.
 polygon(c,[project(0,l.h),project(0,0),[W*.15,H*.765],[W*.25,H*.35]],'#3c5150');polygon(c,[project(l.w,l.h),project(l.w,0),[W*.85,H*.765],[W*.75,H*.35]],'#314846');
 for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){let block=l.blocked.some(a=>a[0]===x&&a[1]===y),heavy=l.features.heavy&&y>=Math.floor(l.h/2),fill=block?'#32464a':heavy?(x+y)%2?'#789186':'#7d968b':(x+y)%2?'#9baa9a':'#a0af9f';polygon(c,[project(x,y),project(x+1,y),project(x+1,y+1),project(x,y+1)],fill,'#c8d1c155',.65);if(block){let a=project(x+.16,y+.17),b=project(x+.84,y+.83);round(c,a[0],b[1],b[0]-a[0],a[1]-b[1],3,'#3f5354','#1d363a');let q=project(x+.5,y+.5);c.font='bold 10px system-ui';c.textAlign='center';c.fillStyle='#d7e2d6';c.fillText('×',q[0],q[1]+3);}}
 // Wheel-arch trims remain outside every playable cell.
 c.fillStyle='#203a3c';for(let side of [-1,1]){let q=project(side===-1?0:l.w,l.h*.38);c.beginPath();c.ellipse(q[0]+side*9,q[1],9,H*.06,0,0,Math.PI*2);c.fill();}
 function luggage(p,a,alpha=1,invalid=false){let cells=engine.cellsAt(p,a),loops=outline(cells),ed=edges(cells),col=invalid?'#da7771':p.color;c.save();c.globalAlpha=alpha;
 for(let loop of loops)polygon(c,loop.map(([x,y])=>{let q=project(x,y);return[q[0]+2,q[1]+3];}),'#122b3240');
 // Extrude front and side boundary edges; adjacent tiles are one continuous bag.
 for(let [a,b]of ed)if(a[1]===b[1]&&a[0]<b[0]||a[0]===b[0])polygon(c,[project(...a,height),project(...b,height),project(...b),project(...a)],shade(col,a[0]===b[0]?.72:.84),'#17303d35',.7);
 for(let loop of loops){let grad=c.createLinearGradient(0,top,0,bottom);grad.addColorStop(0,shade(col,1.16));grad.addColorStop(1,col);polygon(c,loop.map(([x,y])=>project(x,y,height)),grad,shade(col,.60),1.6);c.save();c.setLineDash([2,2]);polygon(c,loop.map(([x,y])=>project(x,y,height+1)),null,'#fff4dd88',.8);c.restore();}
 let anchor=cells.reduce((a,b)=>a[1]>b[1]?a:b),[ax,ay]=anchor;
 // Molded ribs, zipper pull and a raised carry handle make the cargo read as luggage.
 for(let[x,y]of cells)for(let f of [.32,.62]){let q=project(x+f,y+.21,height+1),r=project(x+f,y+.78,height+1);c.strokeStyle=shade(col,.84);c.lineWidth=1.2;c.beginPath();c.moveTo(...q);c.lineTo(...r);c.stroke();}
 let ha=project(ax+.28,ay+.82,height+4),hb=project(ax+.72,ay+.82,height+4);c.strokeStyle='#253e47';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(ha[0],ha[1]+2);c.lineTo(ha[0],ha[1]-3);c.lineTo(hb[0],hb[1]-3);c.lineTo(hb[0],hb[1]+2);c.stroke();
 let tag=project(ax+.72,ay+.47,height+2);round(c,tag[0]-3,tag[1]-5,6,8,1,'#fff3d8');c.fillStyle='#213d45';c.textAlign='center';c.font=`bold ${Math.max(7,projection.tw*.26)}px system-ui`;c.fillText(symbol(p.type)||String(p.id+1),tag[0],tag[1]+1);
 let fronts=cells.filter(c=>c[1]===Math.min(...cells.map(c=>c[1])));for(let cell of [fronts[0],fronts[fronts.length-1]]){let q=project(cell[0]+.25,cell[1]+.05,2);round(c,q[0]-2,q[1]-2,4,5,1,'#233b43');}
 if(selected===p.id)for(let loop of loops)polygon(c,loop.map(([x,y])=>project(x,y,height+2)),null,'#fffce3',2);c.restore();}
 l.pieces.filter(p=>placements[p.id]&&!(drag&&drag.moved&&drag.source==='board'&&selected===p.id)).sort((a,b)=>(placements[b.id].y-placements[a.id].y)).forEach(p=>luggage(p,placements[p.id]));if(ghost&&selected!==null)luggage(l.pieces[selected],ghost,.65,!engine.check(l,placements,selected,ghost).ok);
 // Rear sill, lamps, plate and bumper: always recognizable as the rear of a car.
 polygon(c,[project(0,0),project(l.w,0),[W*.85,H*.79],[W*.15,H*.79]],'#334c4b','#1d3539',1);c.strokeStyle='#aebbb5';c.lineWidth=2;c.beginPath();c.moveTo(W*.17,H*.79);c.lineTo(W*.83,H*.79);c.stroke();
 for(let side of [-1,1]){let x=side===-1?W*.103:W*.815;round(c,x,H*.57,W*.08,H*.135,5,'#823532','#592a2d');round(c,x+3,H*.58,W*.08-6,H*.06,3,'#ed6251');round(c,x+3,H*.655,W*.08-6,H*.027,2,'#f5dbb9');}
 round(c,W*.11,H*.835,W*.78,H*.048,6,'#263d44');round(c,W*.40,H*.797,W*.20,H*.038,3,'#f5f1da','#52666a');c.fillStyle='#314750';c.textAlign='center';c.font='800 8px system-ui';c.fillText('ONE MORE CASE',cx,H*.824);round(c,W*.19,H*.866,W*.06,5,2,'#121f25');round(c,W*.75,H*.866,W*.06,5,2,'#121f25');
 c.font='700 9px system-ui';c.fillStyle='#60766c';c.fillText(l.vehicle[0].toUpperCase(),cx,H*.965);
 return projection;}
root.OMCArt={draw,tray,screenCells,outline,edges};
})(globalThis);
