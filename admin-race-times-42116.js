/* HYDRA 4.2.1.16: optional race times, public display and official transactional save. */
(()=>{
'use strict';
const root=document.getElementById('admin-race-rows');
if(!root || typeof drawRaceEditor!=='function')return;
const previousDraw=drawRaceEditor;
function formatHint(row,i){return row.status!=='classified'?'Non disponibile per DNF/DNS/DSQ':i===0?'Tempo vincitore (h:mm:ss.mmm)':'Distacco (+s.mmm, +m:ss.mmm, +1 giro)'}
function decorateTimes(){
 [...root.querySelectorAll('.race-edit-row')].forEach((node,i)=>{
  const row=editorRows[i];if(!row)return;
  const extra=node.querySelector('.race-extra');if(!extra)return;
  const label=document.createElement('label');label.className='hydra-time-field';
  label.appendChild(document.createTextNode(i===0?'Tempo gara / distacco':'Distacco dal primo'));
  const input=document.createElement('input');input.type='text';input.dataset.field='time_display';input.maxLength=32;
  input.placeholder=i===0?'1:32:45.678':'+5.432 / +1 giro';input.value=row.time_display||'';
  input.disabled=row.status!=='classified';input.title=formatHint(row,i);input.setAttribute('aria-label',formatHint(row,i));
  input.addEventListener('input',()=>{row.time_display=input.value});
  label.appendChild(input);extra.appendChild(label);
 });
}
drawRaceEditor=function(){previousDraw();decorateTimes()};
if(root.children.length)drawRaceEditor();
// Preserve existing save validation, confirmation, finance logic and response handling.
// Replace only the official RPC endpoint; the server wrapper is transactional.
if(typeof request==='function'){
 const originalRequest=request;
 request=function(path,options){if(path==='/rest/v1/rpc/hydra406_save_race'){
  const payload=JSON.parse(options.body);payload.p_rows=payload.p_rows.map(r=>{
   const entry=editorRows.find(x=>String(x.driver_id)===String(r.driver_id));
   return {...r,time_display:entry?.time_display?.trim()||null};
  });
  for(const r of payload.p_rows){let t=r.time_display;if(!t)continue;if(r.status==='classified'&&Number(r.finishing_position)===1&&/^\d+:[0-5]\d\.\d{3}$/.test(t)){t='0:'+t;r.time_display=t;const entry=editorRows.find(x=>String(x.driver_id)===String(r.driver_id));if(entry)entry.time_display=t;}
   const valid=r.status==='classified'&&(Number(r.finishing_position)===1?/^\d+:[0-5]\d:[0-5]\d\.\d{3}$/.test(t):/^\+(?:\d+:[0-5]\d\.\d{3}|\d+\.\d{3}|[1-9]\d* gir[oi])$/.test(t));
   if(!valid)return Promise.reject(new Error('Formato tempo non valido per '+(r.driver_id||'pilota')+'. Usa 1:32:45.678 per il primo, +5.432 / +1 giro per gli altri.'));
  }
  return originalRequest('/rest/v1/rpc/hydra42116_save_race',{...options,body:JSON.stringify(payload)});
 }
 return originalRequest(path,options)};
}
// Restore official times when an existing GP is opened for editing.
const adminRace=document.getElementById('admin-race-select');
let raceReadSerial=0;
if(adminRace){
 const restore=async()=>{
  const id=Number(adminRace.value),serial=++raceReadSerial;
  if(!id)return;
  try{
   const times=await request('/rest/v1/hydra_result_times?select=driver_id,time_display&race_id=eq.'+id);
   if(serial!==raceReadSerial||Number(adminRace.value)!==id||!times?.length)return;
   const map=new Map(times.map(t=>[String(t.driver_id),t.time_display]));
   let changed=false;
   editorRows.forEach(row=>{const time=map.get(String(row.driver_id));if(time && !row.time_display){row.time_display=time;changed=true}});
   if(changed)drawRaceEditor();
  }catch(e){console.warn('Impossibile caricare i tempi ufficiali',e)}
 };
 adminRace.addEventListener('change',restore);
 if(adminRace.value)restore();
}
// Public results: show the entire time column only if at least one official time is recorded.
if(typeof renderResults==='function'){
 const originalRender=renderResults;let seq=0;
 renderResults=function(){originalRender();const serial=++seq;const id=Number(document.getElementById('race-select')?.value);if(!id)return;
  request('/rest/v1/hydra_result_times?select=driver_id,time_display&race_id=eq.'+id).then(times=>{
   if(serial!==seq||Number(document.getElementById('race-select')?.value)!==id||!times?.length)return;
   const map=new Map(times.map(x=>[String(x.driver_id),x.time_display]));
   const rows=(data.hydra_results||[]).filter(r=>r.race_id===id).sort((a,b)=>(a.finishing_position??999)-(b.finishing_position??999));
   document.getElementById('results-table').innerHTML=grid(['Pos.','Pilota','Esito','Punti','Tempo / distacco','Note'],rows.map(r=>[r.finishing_position??'—',nameOf('hydra_drivers',r.driver_id),r.status,r.points,map.get(String(r.driver_id))||'',r.notes||'—']));
  }).catch(e=>console.warn('Tempi gara non disponibili',e));
 };
 const select=document.getElementById('race-select');if(select)select.onchange=renderResults;
 renderResults();
}
})();
