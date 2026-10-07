const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const { chromium }=require('playwright');

const root=path.resolve(__dirname,'../web');
const out=path.resolve(__dirname,'../store-assets/screenshots');
fs.mkdirSync(out,{recursive:true});

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const clean=(req.url||'/').split('?')[0];
  const rel=clean==='/'?'index.html':clean.replace(/^\//,'');
  const file=path.join(root,rel);
  if(!file.startsWith(root)){res.statusCode=403;return res.end();}
  try{
    const data=fs.readFileSync(file);
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(data);
  }catch{
    res.statusCode=404;
    res.end();
  }
});

(async()=>{
  await new Promise(r=>server.listen(8779,'127.0.0.1',r));
  const browser=await chromium.launch({args:['--no-sandbox']});
  const context=await browser.newContext({
    viewport:{width:432,height:768},
    deviceScaleFactor:2.5,
    locale:'en-US'
  });
  const page=await context.newPage();
  const url='http://127.0.0.1:8779';

  async function snap(name){
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(out,name),fullPage:false});
  }

  await page.goto(url,{waitUntil:'networkidle'});
  await page.evaluate(()=>{
    state.settings.language='en';
    persist();
    render();
  });
  await snap('01-home.png');

  await page.evaluate(()=>start(26));
  await snap('02-gameplay.png');

  await page.evaluate(()=>{
    screen='home';
    state.unlocked=125;
    for(let n=1;n<=100;n++) state.stars[n]= n%3===0 ? 3 : 2;
    persist();
    action('levels');
  });
  await snap('03-levels.png');

  await page.evaluate(()=>{
    screen='home';
    render();
    action('garage');
  });
  await snap('04-garage.png');

  await page.evaluate(()=>{
    start(12);
    for(const a of L.solution) place(a.id,{x:a.x,y:a.y,r:a.r});
  });
  await page.waitForTimeout(450);
  await snap('05-result.png');

  await browser.close();
  server.close();
  console.log('Created real OneMoreCase Play screenshots:',fs.readdirSync(out));
})().catch(err=>{
  console.error(err);
  server.close();
  process.exit(1);
});
