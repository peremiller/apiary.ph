const CONFIG = {"app":"apiary.ph","version":"d79b8fbd99a8a598c62e","assets":["about.html","assets/css/style.css","assets/img/1.jpg","assets/img/10.jpg","assets/img/2.jpg","assets/img/3.jpg","assets/img/4.jpg","assets/img/5.jpg","assets/img/6.jpg","assets/img/7.jpg","assets/img/8.jpg","assets/img/9.jpg","assets/img/Snapshots.JPG","assets/img/Snapshots2.JPG","assets/img/Snapshots3.JPG","assets/img/apiary_ph_logo.png","assets/img/apiary_ph_logo2.png","assets/img/apiary_ph_logo_1.jpg","assets/img/apple-touch-icon.png","assets/img/asher.jpg","assets/img/bee_bg.jpg","assets/img/beeicon.JPG","assets/img/beeicon.ico","assets/img/black_white_yellow.png","assets/img/burts2.jpg","assets/img/christian.jpg","assets/img/commerce.jpg","assets/img/fastlab.png","assets/img/favicon-192.png","assets/img/favicon-32.png","assets/img/favicon-512.png","assets/img/favicon.ico","assets/img/herald.jpg","assets/img/honey-bee.jpg","assets/img/leslie.jpg","assets/img/logo-bee-hex.png","assets/img/miller.jpg","assets/img/product1.jpeg","assets/img/product2.jpeg","assets/img/product3.jpg","assets/img/product4.png","assets/img/product5.jpg","assets/img/product6.jpg","assets/img/rhey.jpg","assets/img/teach.jpeg","assets/img/test.jpeg","assets/js/script.js","beefarms.html","beeimportance.html","beeinformed.html","contact.html","home.html","home2.html","index.html","manifest.webmanifest","offline-client.js","offline-vendor/00633b031b7bb8d71597.ttf","offline-vendor/1c362fdb15e3810b6858.ttf","offline-vendor/1e6087c3a14b13b4ae47.ttf","offline-vendor/6f49e1b28bce7339f484.ttf","offline-vendor/72025d9b68a7dd0b68eb.ttf","offline-vendor/79347ed53aa14e8b77ee.ttf","offline-vendor/86c71681581b301026f3.css","offline-vendor/87e867b52640b3b397a9.ttf","offline-vendor/8bb5d7badc0189c17647.ttf","offline-vendor/959364b06f81af7e1c72.ttf","offline-vendor/a699af1dea30b799318e.ttf","offline-vendor/db7c5771335b7af9ea09.ttf","offline-vendor/licenses/fraunces-OFL.txt","offline-vendor/licenses/inter-OFL.txt","offline-vendor/sources.json","partners.html","products.html","products2.html"],"pages":["about.html","beefarms.html","beeimportance.html","beeinformed.html","contact.html","home.html","home2.html","index.html","partners.html","products.html","products2.html"],"spa":false};
const BASE = new URL('./', self.location.href);
const PREFIX = 'pages-offline-' + CONFIG.app + '-';
const CACHE = PREFIX + CONFIG.version;
const files = new Map(CONFIG.assets.map(asset => {const url=new URL(asset,BASE);return [url.pathname,url.href];}));
const pages = new Map(CONFIG.pages.map(page => {
  const url=new URL(page,BASE);return [url.pathname,url.href];
}));
pages.set(BASE.pathname, new URL('index.html',BASE).href);
for (const page of CONFIG.pages) if(page.endsWith('/index.html')) pages.set(new URL(page.slice(0,-10),BASE).pathname,new URL(page,BASE).href);
async function complete(cache) {
  const keys = new Set((await cache.keys()).map(request => request.url));
  const saved = [...files.values()].filter(url => keys.has(url)).length;
  return {ready:saved===files.size,saved,total:files.size,version:CONFIG.version};
}
async function saveAll() {
  const cache=await caches.open(CACHE);
  for(let start=0;start<CONFIG.assets.length;start+=8) {
    await Promise.all(CONFIG.assets.slice(start,start+8).map(async asset => {
      const url=new URL(asset,BASE).href;
      if(await cache.match(url))return;
      const response=await fetch(new Request(url,{cache:'reload',credentials:'omit',redirect:'error'}));
      if(!response.ok||response.redirected||response.type==='opaque'||/private|no-store/i.test(response.headers.get('cache-control')||''))throw new Error('Public file unavailable: '+asset);
      const type=response.headers.get('content-type')||'';
      if(!asset.endsWith('.html')&&type.includes('text/html'))throw new Error('Unexpected document: '+asset);
      await cache.put(url,response);
    }));
  }
  if(!(await complete(cache)).ready)throw new Error('Incomplete app bundle');
}
self.addEventListener('install',event=>event.waitUntil((async()=>{await saveAll();await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const older=(await caches.keys()).filter(name=>name.startsWith(PREFIX)&&name!==CACHE);
  for(const name of older.slice(0,-1))await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname)||request.headers.has('authorization'))return;
  const ranged=request.headers.has('range');
  if(ranged&&!/\.(mp4|webm|mp3|wav|ogg|m4a|pdf)$/i.test(url.pathname))return;
  const relative=url.pathname.slice(BASE.pathname.length);
  if(/^(api|auth|login|logout|account\/api|uploads)(\/|$)/.test(relative))return;
  let asset=files.get(url.pathname);
  if(request.mode==='navigate')asset=pages.get(url.pathname)||(CONFIG.spa&&!/\.[a-z0-9]+$/i.test(relative)?new URL('index.html',BASE).href:null);
  if(!asset)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),saved=await cache.match(asset);
    if(saved&&ranged){
      const bytes=await saved.arrayBuffer(),size=bytes.byteLength;
      const match=/^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range'));
      let start=match?.[1]?Number(match[1]):0,end=match?.[2]?Number(match[2]):size-1;
      if(match&&!match[1]&&match[2]){start=Math.max(0,size-Number(match[2]));end=size-1;}
      if(!match||(!match[1]&&!match[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
      end=Math.min(end,size-1);
      const headers=new Headers(saved.headers);headers.delete('Content-Encoding');headers.delete('Transfer-Encoding');headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
      return new Response(bytes.slice(start,end+1),{status:206,headers});
    }
    if(saved)return saved;
    try{return await fetch(request);}catch{return new Response('This file is not available offline yet. Reconnect to finish automatic saving.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING'){self.skipWaiting();return;}
  if(!event.ports?.[0]||!['OFFLINE_STATUS','PREPARE_OFFLINE'].includes(event.data?.type))return;
  event.waitUntil((async()=>{
    try{if(event.data.type==='PREPARE_OFFLINE')await saveAll();event.ports[0].postMessage(await complete(await caches.open(CACHE)));}
    catch(error){event.ports[0].postMessage({ready:false,error:error.message});}
  })());
});
