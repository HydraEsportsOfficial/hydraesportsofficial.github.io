/* HYDRA 4.2.1.14 — drafts are browser-local and never call Supabase. */
(()=>{
'use strict';
const race=document.getElementById('admin-race-select');
const save=document.getElementById('admin-save-draft');
const load=document.getElementById('admin-load-draft');
const message=document.getElementById('admin-draft-message');
const root=document.getElementById('admin-race-rows');
if(!race||!save||!load||!root)return;
const prefix='hydra:race-draft:v1:';
const key=()=>race.value?prefix+race.value:null;
const get=()=>{try{return key()?JSON.parse(localStorage.getItem(key())):null}catch{return null}};
const sync=()=>{const d=get();load.hidden=!d;message.textContent=d?'Bozza locale disponibile per questo GP (salvata '+new Date(d.savedAt).toLocaleString('it-IT')+').':''};
function capture(){
 // Read the editor controls directly, including changes that haven't blurred yet.
 return [...root.querySelectorAll('.race-edit-row')].map(node=>{
  const row={};for(const field of node.querySelectorAll('[data-field]'))row[field.dataset.field]=field.type==='checkbox'?field.checked:field.value;
  return row;
 });
}
save.addEventListener('click',()=>{
 if(!key()){message.textContent='Seleziona prima un Gran Premio.';return}
 try{localStorage.setItem(key(),JSON.stringify({version:1,savedAt:Date.now(),rows:capture()}));sync();message.textContent='Bozza salvata in questo browser. I risultati ufficiali NON sono stati modificati.'}
 catch(e){message.textContent='Impossibile salvare la bozza sul dispositivo: '+e.message}
});
load.addEventListener('click',()=>{
 const draft=get();if(!draft||!Array.isArray(draft.rows))return;
 if(root.querySelectorAll('.race-edit-row').length&&!confirm('Riprendere la bozza? Le modifiche attualmente visibili e non salvate saranno sostituite.'))return;
 try{
  if(typeof editorRows==='undefined'||typeof drawRaceEditor!=='function')throw Error('Editor risultati non disponibile');
  editorRows=draft.rows.map(r=>({...r}));drawRaceEditor();
  message.textContent='Bozza ripristinata. Controlla i risultati prima di pubblicarli.';
 }catch(e){message.textContent='Errore nel ripristino: '+e.message}
});
race.addEventListener('change',()=>queueMicrotask(sync));
const observer=new MutationObserver(()=>{if(!race.value||!load.hidden||get())sync()});
observer.observe(race,{childList:true});
sync();
})();