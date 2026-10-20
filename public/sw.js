const CACHE='sphyre-live-loads-1.0.1';
const ASSETS=['./','./index.html','./style.css','./app.js','./engine.js','./icons/sphyre.svg','./icons/sphyre-192.png','./icons/sphyre-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
// Network-first: garantiza actualizaciones de Render y conserva soporte sin conexión.
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 event.respondWith(fetch(req).then(response=>{
   if(response.ok){const saved=response.clone();caches.open(CACHE).then(cache=>cache.put(req,saved)).catch(()=>{})}
   return response;
 }).catch(async()=>await caches.match(req)||await caches.match('./index.html')));
});
