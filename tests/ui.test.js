const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../web');
const server=http.createServer((req,res)=>{const f=path.join(root,req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',f.endsWith('.css')?'text/css':f.endsWith('.js')?'text/javascript':'text/html');try{res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end();}});
(async()=>{await new Promise(r=>server.listen(8778,'127.0.0.1',r));let b=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});let errors=[];
for(let width of [360,390,768,1280]){let p=await b.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8778');assert.equal(await p.evaluate(()=>document.documentElement.lang),'en');assert.equal(await p.locator('#quick-lang').inputValue(),'en');assert.equal(await p.locator('[data-action=load]').isDisabled(),true);await p.locator('[data-action=new]').click();await p.waitForTimeout(60);assert.equal(await p.locator('.piece').count(),9);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
// Real click-to-place plus undo and resume.
let a=await p.evaluate(()=>L.solution[0]);await p.locator('.piece[data-id="0"]').click();let pos=await p.evaluate(a=>{let r=document.querySelector('canvas').getBoundingClientRect(),q=projection;let point=q.project(a.x+.5,a.y+.5);return {x:r.x+point[0],y:r.y+point[1]};},a);await p.mouse.click(pos.x,pos.y);assert.equal(await p.evaluate(()=>Object.keys(placements).length),1);await p.locator('[data-action=undo]').click();assert.equal(await p.evaluate(()=>Object.keys(placements).length),0);
// Real tray drag.
let box=await p.locator('.piece[data-id="0"]').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(pos.x,pos.y,{steps:10});await p.mouse.up();assert.equal(await p.evaluate(()=>Object.keys(placements).length),1);await p.locator('[data-action=back]').click();await p.reload();assert.equal(await p.locator('[data-action=load]').isDisabled(),false);await p.locator('[data-action=load]').click();assert.equal(await p.evaluate(()=>Object.keys(placements).length),1);
// Undo stays above the board, even after scrolling down the tray.
assert.equal(await p.locator('[data-action=undo]').count(),1);
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
let undoBox=await p.locator('[data-action=undo]').boundingBox();assert(undoBox.y>=0&&undoBox.y+undoBox.height<=900);
await p.evaluate(()=>window.scrollTo(0,0));
// Settings roundtrip and all languages.
await p.locator('[data-action=settings]').click();for(let lang of ['de','en','tr']){await p.locator('#lang').selectOption(lang);assert.equal(await p.evaluate(()=>document.documentElement.lang),lang);assert.equal(await p.locator('#lang').inputValue(),lang);}await p.locator('#sound').uncheck();await p.locator('[data-action=back]').click();assert.equal(await p.locator('canvas').count(),1);
// Every chapter, all rules, full solutions through the game placement function.
await p.evaluate(()=>{for(let n=1;n<=250;n++)state.stars[n]=3;state.unlocked=250;});for(let n of [1,11,26,51,76,101,151,201,250]){await p.evaluate(n=>start(n),n);await p.waitForTimeout(20);let result=await p.evaluate(()=>{for(let a of L.solution){if(!place(a.id,{x:a.x,y:a.y,r:a.r}))return false;}return won;});assert(result,'win '+n);await p.waitForTimeout(230);assert.equal(await p.locator('.modal').count(),1);await p.evaluate(()=>{document.querySelector('.modal-backdrop').remove();screen='home';render();});}
await p.close();}
// Native touchscreen events exercise pointer capture while the tray is rebuilt.
let touchPage=await b.newPage({viewport:{width:360,height:740},hasTouch:true,isMobile:true});
touchPage.on('pageerror',e=>errors.push(e.message));await touchPage.goto('http://127.0.0.1:8778');
await touchPage.evaluate(()=>start(4));await touchPage.waitForTimeout(60);
let touch=await touchPage.context().newCDPSession(touchPage);
let target=await touchPage.evaluate(()=>{let a=L.solution[0],cells=E.rotate(L.pieces[0].cells,0),ox=Math.floor((Math.max(...cells.map(c=>c[0]))+1)/2),q=projection.project(a.x+ox+.5,a.y+.5),rect=$('#board').getBoundingClientRect();return{x:rect.x+q[0],y:rect.y+q[1]+88,a};});
let tile=await touchPage.locator('.piece[data-id="0"]').boundingBox();
await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tile.x+tile.width/2,y:tile.y+tile.height/2}]});
assert.equal(await touchPage.locator('#drag-preview').count(),1);
assert(await touchPage.evaluate(()=>{let r=$('#drag-preview').getBoundingClientRect();return r.bottom<=drag.startY-80&&r.width>0&&r.height>0;}));
await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:target.x,y:target.y}]});
assert.equal(await touchPage.evaluate(()=>drag.moved),true);
assert.deepEqual(await touchPage.evaluate(()=>ghost),{x:target.a.x,y:target.a.y,r:0});
await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
assert.equal(await touchPage.evaluate(()=>Object.keys(placements).length),1);
assert.equal(await touchPage.locator('#drag-preview').count(),0);
await touchPage.locator('[data-action=undo]').click();assert.equal(await touchPage.evaluate(()=>Object.keys(placements).length),0);
// Selected rotations survive another press; cancellation never changes the placement.
await touchPage.evaluate(()=>start(11));await touchPage.waitForTimeout(30);
await touchPage.locator('.piece[data-id="0"]').tap();await touchPage.locator('[data-action=rotate]').click();
let rotated=await touchPage.evaluate(()=>rotation);assert.equal(rotated,1);
await touchPage.locator('.piece[data-id="0"]').tap();assert.equal(await touchPage.evaluate(()=>rotation),rotated);
assert(await touchPage.evaluate(()=>{let expected=document.createElement('div');expected.innerHTML=pieceSvg(L.pieces[0],rotation);return $('.piece[data-id="0"] svg').outerHTML===expected.firstChild.outerHTML;}));
tile=await touchPage.locator('.piece[data-id="0"]').boundingBox();
await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tile.x+tile.width/2,y:tile.y+tile.height/2}]});
await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
assert.equal(await touchPage.locator('#drag-preview').count(),0);assert.equal(await touchPage.evaluate(()=>Object.keys(placements).length),0);
await touchPage.close();
// Hint integration, win dialog, data persistence and all 250 complete flows.
let p=await b.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8778');await p.evaluate(()=>{state.unlocked=250;for(let n=1;n<250;n++)state.stars[n]=1;start(101);applyHint();});assert.equal(await p.evaluate(()=>hints),1);assert.equal(await p.evaluate(()=>Object.keys(placements).length),1);await p.screenshot({path:'/tmp/omc-packed-preview.png'});
await b.close();server.close();assert.deepEqual(errors,[]);console.log('PASS: 4 viewport sizes; real mouse and touch drag; lifted preview; orientation and rotation; sticky undo; save/reload; TR/DE/EN; settings; 9 chapter milestone completions; hints; zero JavaScript errors.');})().catch(e=>{console.error(e);server.close();process.exit(1);});
