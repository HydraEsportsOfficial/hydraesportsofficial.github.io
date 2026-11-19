'use strict';
/* HYDRA TEST: UI-only safety guard. Not a security boundary; enforce read-only on server before deployment. */
(()=>{
 const originalFetch=window.fetch.bind(window);
 window.fetch=function(input,init){
  const url=typeof input==='string'?input:input?.url||'';
  const method=(init?.method||((typeof input==='object'&&input?.method)||'GET')).toUpperCase();
  const isProductionApi=/^https:\/\/wgjdhdssiveqedluktwi\.supabase\.co\//.test(new URL(url,location.href).href);
  const isMutation=!['GET','HEAD','OPTIONS'].includes(method);
  const isAuth=/\/auth\/v1\//.test(url);
  if(isProductionApi&&isMutation&&!isAuth){
   console.warn('[HYDRA TEST] Production mutation blocked:',method,url);
   return Promise.reject(new Error('Ambiente TEST in sola lettura: operazione bloccata per proteggere i dati ufficiali.'));
  }
  return originalFetch(input,init);
 };
 document.addEventListener('DOMContentLoaded',()=>{
  const banner=document.createElement('div');
  banner.setAttribute('role','status');
  banner.textContent='HYDRA TEST · Anteprima in sola lettura · Nessuna modifica ai dati ufficiali';
  banner.style.cssText='position:sticky;top:0;z-index:99999;padding:10px 16px;text-align:center;background:#102c59;color:#e9c675;font:700 13px system-ui,sans-serif;letter-spacing:.04em;border-bottom:2px solid #c5a46d';
  document.body.prepend(banner);
 });
})();
