const assert=require('node:assert/strict'),E=require('../web/engine');
const fingerprints=new Set();let maxPieces=0;
for(let n=1;n<=250;n++){
 let l=E.level(n),p={};assert.deepEqual(l,E.level(n));let finger=JSON.stringify([l.w,l.h,l.blocked,l.pieces]);assert(!fingerprints.has(finger),'duplicate '+n);fingerprints.add(finger);
 for(let a of l.solution){assert(E.check(l,p,a.id,a).ok,`witness ${n}/${a.id}`);p[a.id]={x:a.x,y:a.y,r:a.r};}assert(E.complete(l,p));assert.equal(l.pieces.reduce((s,p)=>s+p.cells.length,0)+l.blocked.length,l.w*l.h);
 assert(!E.check(l,{},0,{x:-20,y:0,r:0}).ok);assert(!E.check(l,{},0,{x:0,y:0,r:NaN}).ok);maxPieces=Math.max(maxPieces,l.pieces.length);
 for(let piece of l.pieces)assert.deepEqual(E.rotate(piece.cells,4),E.rotate(piece.cells,0));
 let s=E.blank();E.award(s,l,l.par,0);let coins=s.coins;E.award(s,l,l.par,0);assert.equal(s.coins,coins,'replay farming');
 assert.equal(E.award(E.blank(),l,0,1),1);
}
let defaults=E.blank();assert.equal(defaults.settings.language,'en');let s=E.blank();for(let n=1;n<=250;n++){let l=E.level(n);E.award(s,l,l.par,0);assert(s.unlocked>=Math.min(n+1,250));assert(Object.values(s.stars).reduce((a,b)=>a+b,0)>=E.vehicles[l.chapter][4]);}assert.equal(s.coins,15000);assert.equal(Object.keys(s.stars).length,250);
let l=E.level(77),saved=E.blank();saved.unlocked=77;for(let n=1;n<77;n++)saved.stars[n]=1;saved.active={n:77,placements:Object.fromEntries(l.solution.map(a=>[a.id,{x:a.x,y:a.y,r:a.r}])),moves:30,hints:0};let restored=E.sanitize(saved);assert(E.complete(l,restored.active.placements));saved.active.placements[0].x=-99;assert.equal(E.sanitize(saved).active,null);assert.equal(E.sanitize({version:99}).unlocked,1);
console.log(`PASS: 250 unique solvable levels, rotations, rules, progression, scoring, replay protection, save validation. Maximum ${maxPieces} cargo pieces.`);
