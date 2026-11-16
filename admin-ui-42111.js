/* HYDRA 4.2.1.11: non-invasive admin UI enhancement */
(()=>{
'use strict';
const nav=document.querySelector('.admin-section-nav');
if(nav){nav.addEventListener('click',e=>{const b=e.target.closest('[data-admin-tab]');if(!b)return;const key=b.dataset.adminTab;nav.querySelectorAll('[data-admin-tab]').forEach(x=>{const on=x===b;x.classList.toggle('active',on);if(on)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')});document.querySelectorAll('[data-admin-panel]').forEach(p=>p.hidden=p.dataset.adminPanel!==key);const title=document.querySelector('#admin .section-head');if(title)title.scrollIntoView({block:'start',behavior:'smooth'});});}
// Alphabetical order for nickname selectors, preserving each original option's value and current selection.
const collator=new Intl.Collator('it',{sensitivity:'base',numeric:true});
const raceRoot=document.getElementById('admin-race-rows');
const nicknameSelectIds=new Set(['roster-driver','admin-driver-select','admin-att-driver','calendar-modal-driver']);
const originals=new WeakMap();
let updating=false;
function isNicknameSelect(s){if(nicknameSelectIds.has(s.id))return true;if(raceRoot?.contains(s)&&s.dataset.field==='driver_id')return true;return false;}
function sortOptions(options){const fixed=options.filter(o=>!o.value || o.disabled&&/seleziona|scegli/i.test(o.textContent));const rest=options.filter(o=>!fixed.includes(o)).sort((a,b)=>collator.compare(a.textContent.trim(),b.textContent.trim()));return [...fixed,...rest];}
function refresh(){if(updating)return;updating=true;try{
 const selects=[...document.querySelectorAll('select')].filter(isNicknameSelect);
 const raceSelects=raceRoot?[...raceRoot.querySelectorAll('select')].filter(s=>{const opts=[...s.options];return opts.length>2&&opts.some(o=>o.value&&/[a-z]/i.test(o.textContent)) && !/position|posizione|team|scuderia|penalt|dnf/i.test(s.id+' '+s.name)}):[];
 // Track selected pilot IDs only within race editor, not other admin controls.
 const used=new Map();for(const s of raceSelects){if(s.value)used.set(s.value,(used.get(s.value)||0)+1)}
 for(const s of selects){const current=s.value;const signature=[...s.options].map(o=>o.value+'\u0001'+o.textContent).join('\u0002');const old=originals.get(s);
 if(!old || [...s.options].some(o=>!old.options.some(p=>p.value===o.value&&p.textContent===o.textContent))){originals.set(s,{signature,options:[...s.options].map(o=>o.cloneNode(true))});}
 const baseline=originals.get(s).options;
 const eligible=baseline.filter(o=>!raceSelects.includes(s)||!o.value||o.value===current||!used.has(o.value));
 const sorted=sortOptions(eligible);
 if(s.options.length!==sorted.length||sorted.some((o,i)=>s.options[i]?.value!==o.value||s.options[i]?.textContent!==o.textContent)){
 s.replaceChildren(...sorted.map(o=>o.cloneNode(true)));s.value=current;
 }
 }
}finally{updating=false;}}
// Restore complete option lists when a pilot changes; refresh on render from existing application.
let pending=false;function schedule(){if(pending||updating)return;pending=true;queueMicrotask(()=>{pending=false;refresh()})}
document.addEventListener('change',e=>{if(e.target.matches('select')&&isNicknameSelect(e.target)){
 // Drop stale cache of current race select lists so previously selected pilots become available again.
 if(raceRoot?.contains(e.target)){for(const s of raceRoot.querySelectorAll('select')){const old=originals.get(s);if(old){const options=old.options;const sig=options.map(o=>o.value+'\u0001'+o.textContent).join('\u0002');originals.set(s,{signature:sig,options})}}}
 schedule();
}},true);
// Fix: after a restored Admin session, checkAdmin() renders legacy admin controls
// without calling render406Admin(), leaving the GP selector empty until another load.
// Initialize it once the authenticated admin panel becomes visible.
const adminBox=document.getElementById('admin-box');
function ensureRaceOptions(){
 const select=document.getElementById('admin-race-select');
 if(!select || !adminBox || adminBox.hidden || select.options.length>0)return;
 if(typeof render406Admin==='function' && typeof data!=='undefined' && Array.isArray(data.hydra_races) && data.hydra_races.length){
   render406Admin();
 }
}
if(adminBox){new MutationObserver(ensureRaceOptions).observe(adminBox,{attributes:true,attributeFilter:['hidden']});}
ensureRaceOptions();
const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});schedule();
})();