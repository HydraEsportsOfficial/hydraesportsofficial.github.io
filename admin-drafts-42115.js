/* HYDRA 4.2.1.15 — shared admin-only drafts in Supabase, version checked. */
(()=>{
'use strict';
const race=document.getElementById('admin-race-select'),save=document.getElementById('admin-save-draft'),loadButton=document.getElementById('admin-load-draft'),message=document.getElementById('admin-draft-message'),root=document.getElementById('admin-race-rows');
if(!race||!save||!loadButton||!root)return;
const localPrefix='hydra:race-draft:v1:';
let currentRace='',draft=null,version=null,requestSerial=0;
const local=()=>{try{return JSON.parse(localStorage.getItem(localPrefix+race.value))}catch{return null}};
function capture(){return [...root.querySelectorAll('.race-edit-row')].map((node,i)=>{const out={...(editorRows[i]||{})};for(const el of node.querySelectorAll('[data-field]'))out[el.dataset.field]=el.type==='checkbox'?el.checked:el.value;out.finishing_position=out.status==='classified'?i+1:null;return out})}
async function rpc(name,body){if(typeof request!=='function')throw Error('Connessione al database non disponibile');return request('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(body)})}
async function sync(){const id=race.value,serial=++requestSerial;currentRace=id;draft=null;version=null;loadButton.hidden=true;if(!id){message.textContent='';return}message.textContent='Controllo bozze condivise...';try{const response=await rpc('hydra42115_get_race_draft',{p_race_id:Number(id)});if(serial!==requestSerial||race.value!==id)return;draft=response?.rows||null;version=response?.version??null;loadButton.hidden=!draft&&!local();message.textContent=draft?`Bozza online disponibile · ultimo salvataggio ${new Date(response.saved_at).toLocaleString('it-IT')}.`:local()?'Bozza locale precedente disponibile. Puoi riprenderla e salvarla online.':'Nessuna bozza salvata per questo GP.'}catch(e){if(serial!==requestSerial)return;loadButton.hidden=!local();message.textContent='Impossibile leggere le bozze online: '+e.message}}
save.onclick=async()=>{if(!race.value){message.textContent='Seleziona prima un Gran Premio.';return}const id=race.value;save.disabled=true;message.textContent='Salvataggio bozza online...';try{const response=await rpc('hydra42115_save_race_draft',{p_race_id:Number(id),p_rows:capture(),p_expected_version:version});if(race.value!==id)return;version=response.version;draft=capture();loadButton.hidden=false;message.textContent='Bozza salvata online. Gli altri amministratori possono riprenderla. Risultati ufficiali invariati.'}catch(e){message.textContent='Bozza NON salvata: '+e.message+'. Se un altro amministratore ha aggiornato la bozza, riseleziona il GP prima di riprovare.'}finally{save.disabled=false}};
loadButton.onclick=()=>{const source=draft||local()?.rows;if(!Array.isArray(source))return;if(root.querySelector('.race-edit-row')&&!confirm('Riprendere la bozza? I dati attualmente visibili non salvati saranno sostituiti.'))return;try{editorRows=source.map(r=>({...r}));drawRaceEditor();message.textContent=draft?'Bozza condivisa ripristinata.':'Bozza locale ripristinata. Premi Salva bozza per condividerla online.'}catch(e){message.textContent='Errore nel ripristino: '+e.message}};
race.addEventListener('change',sync);
const observer=new MutationObserver(()=>{if(race.value!==currentRace)sync()});observer.observe(race,{childList:true});
if(race.value)sync();
})();
