const CACHE='expense-v9';
const SHELL=['./','./index.html','./styles.css','./app.js','./firebase-config.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(u.host==='cdn.jsdelivr.net'&&/tesseract|tessdata|traineddata|\.wasm|emoji-picker-element-data/i.test(u.pathname))return;
  const cdn=(u.host==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/'))||u.host==='cdn.jsdelivr.net';
  if(cdn){ // cache-first for versioned CDN libs
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return res;})));
    return;
  }
  if(u.origin!==location.origin)return; // Firestore/Auth traffic untouched
  e.respondWith(fetch(e.request).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return res;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
