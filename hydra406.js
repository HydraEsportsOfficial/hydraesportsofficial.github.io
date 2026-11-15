'use strict';
// Hydra 4.0.6: navigation, championship charts, admin tools.
const qs=s=>document.querySelector(s);
const all=s=>[...document.querySelectorAll(s)];
const htmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const officialRaces=()=>[...(data.hydra_races||[])].filter(r=>r.status==='official').sort((a,b)=>a.round_number-b.round_number);
// Search searches the real HTML text, opening matching articles only.
qs('#rules-search').addEventListener('input',e=>{const term=e.target.value.toLocaleLowerCase('it').trim();all('.rule-article').forEach(article=>{const found=!term||article.textContent.toLocaleLowerCase('it').includes(term);article.hidden=!found;if(term&&found)article.open=true});all('.rule-chapter').forEach(c=>c.hidden=![...c.querySelectorAll('.rule-article')].some(x=>!x.hidden));});
// Fix scope: chapter visibility independent of document-wide query.
qs('#rules-search').addEventListener('input',()=>all('.rule-chapter').forEach(c=>c.hidden=![...c.querySelectorAll('.rule-article')].some(a=>!a.hidden)));
qs('#rules-open').onclick=()=>all('.rule-article').forEach(x=>x.open=true);
qs('#rules-close').onclick=()=>all('.rule-article').forEach(x=>x.open=false);
all('.rule-index a').forEach(a=>a.addEventListener('click',()=>{const chapter=qs(a.getAttribute('href'));if(chapter)chapter.hidden=false}));
// Chart: ranks and cumulative points by round, based exclusively on official results.
let chartSelection=new Set(),chartContext='';
const colors=['#d4b474','#58b6f8','#f09c7d','#90d2b1','#c49bf5','#e5e6ed','#ffcc4f','#9cbded','#f18caf','#a7d9a1','#ff7b8e'];
function progressChart(){
 const host=qs('#progress-svg');if(!host)return;
 const mode=qs('#progress-mode').value;const isGeneral=league==='GENERAL';const teams=data.hydra_teams||[],drivers=(data.hydra_drivers||[]).filter(d=>!d.archived&&d.league===league);
 const items=isGeneral?teams:drivers;
 const context=league+':'+items.length;
 if(context!==chartContext){chartContext=context;chartSelection=new Set((isGeneral?items:items.slice(0,5)).map(x=>String(x.id)))}
 const races=officialRaces().filter(r=>isGeneral||r.league===league);
 const rounds=[...new Set(races.map(r=>Number(r.round_number)))].sort((a,b)=>a-b);
 const byRace=new Map(races.map(r=>[String(r.id),r]));const result=data.hydra_results||[];
 const totals=new Map(items.map(i=>[String(i.id),0]));const series=items.map(i=>({id:String(i.id),name:i.name||i.gamertag,color:isGeneral?hydraTeamColor(i.name):hydraTeamColor(teams.find(t=>String(t.id)===String(i.team_id))?.name),values:[]}));
 for(const round of rounds){for(const r of result){const race=byRace.get(String(r.race_id));if(!race||Number(race.round_number)!==round)continue;const id=isGeneral?String(r.team_id??''):String(r.driver_id);if(totals.has(id))totals.set(id,totals.get(id)+Number(r.points||0));}
  const sorted=[...totals].sort((a,b)=>b[1]-a[1]||items.find(i=>String(i.id)===a[0])?.name?.localeCompare(items.find(i=>String(i.id)===b[0])?.name||'')||a[0].localeCompare(b[0]));const ranks=new Map(sorted.map(([id],i)=>[id,i+1]));
  series.forEach(s=>s.values.push({round,value:mode==='rank'?ranks.get(s.id):totals.get(s.id)}));}
 const filters=qs('#progress-filters');filters.innerHTML=series.map((s,i)=>`<button type="button" data-series="${htmlEscape(s.id)}" class="${chartSelection.has(s.id)?'selected':''}" style="--series-color:${s.color||colors[i%colors.length]}">${htmlEscape(s.name)}</button>`).join('');filters.querySelectorAll('button').forEach(b=>b.onclick=()=>{chartSelection.has(b.dataset.series)?chartSelection.delete(b.dataset.series):chartSelection.add(b.dataset.series);progressChart()});
 const selected=series.filter(s=>chartSelection.has(s.id));const W=900,H=360,left=52,right=18,top=22,bottom=48;
 if(!rounds.length){host.setAttribute('viewBox',`0 0 ${W} ${H}`);host.innerHTML='<text x="50%" y="50%" fill="#a6b4c6" text-anchor="middle">Il grafico comparirà dopo il primo Gran Premio ufficiale.</text>';return}
 const yMax=mode==='rank'?Math.max(1,items.length):Math.max(1,...series.flatMap(s=>s.values.map(v=>v.value)));
 const x=n=>left+(W-left-right)*(rounds.length===1?.5:n/(rounds.length-1));const y=v=>top+(H-top-bottom)*(mode==='rank'?(v-1)/Math.max(1,yMax-1):1-v/yMax);
 let svg='';for(let i=0;i<=5;i++){const v=mode==='rank'?1+Math.round(i*Math.max(1,yMax-1)/5):Math.round(yMax*(5-i)/5);const yy=y(v);svg+=`<line x1="${left}" x2="${W-right}" y1="${yy}" y2="${yy}" stroke="#38516b" opacity=".6"/><text x="${left-10}" y="${yy+4}" text-anchor="end" font-size="12" fill="#a6b4c6">${v}${mode==='rank'?'°':''}</text>`}
 rounds.forEach((r,i)=>svg+=`<text x="${x(i)}" y="${H-16}" text-anchor="middle" font-size="12" fill="#d6dfea">R${r}</text>`);
 selected.forEach((s,i)=>{const col=s.color||colors[i%colors.length];svg+=`<polyline points="${s.values.map((v,j)=>`${x(j)},${y(v.value)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;s.values.forEach((v,j)=>svg+=`<circle cx="${x(j)}" cy="${y(v.value)}" r="4" fill="${col}"><title>${htmlEscape(s.name)} · Round ${v.round}: ${v.value}${mode==='rank'?'°':' punti'}</title></circle>`)});
 host.setAttribute('viewBox',`0 0 ${W} ${H}`);host.innerHTML=svg;
}
qs('#progress-mode').onchange=progressChart;
const originalRender406=render;render=function(){originalRender406();progressChart();if(token)render406Admin()};
// Admin: archive and permanent deletion of test records only.
function render406Admin(){
 const ds=qs('#admin-driver-select');const old=ds.value;ds.innerHTML='<option value="">Seleziona un pilota</option>'+(data.hydra_drivers||[]).map(d=>`<option value="${d.id}">${htmlEscape(d.gamertag)} · Lega ${d.league}${d.archived?' · ARCHIVIATO':''}</option>`).join('');ds.value=old;
 const rs=qs('#admin-race-select'),oldRace=rs.value;rs.innerHTML='<option value="">Seleziona una gara</option>'+(data.hydra_races||[]).slice().sort((a,b)=>a.round_number-b.round_number||a.league.localeCompare(b.league)).map(r=>`<option value="${r.id}">R${r.round_number} · ${htmlEscape(r.circuit)} · Lega ${r.league} · ${r.status}</option>`).join('');rs.value=oldRace;
 if(rs.value)renderRaceEditor();
}
qs('#admin-archive-driver').onclick=async()=>{const d=(data.hydra_drivers||[]).find(x=>String(x.id)===qs('#admin-driver-select').value);if(!d)return;const archived=!d.archived;if(!confirm(`${archived?'Archiviare':'Riattivare'} ${d.gamertag}?`))return;try{await request(`/rest/v1/hydra_drivers?id=eq.${d.id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({archived,team_id:archived?null:d.team_id})});qs('#admin-driver-message').textContent=archived?'Pilota archiviato.':'Pilota riattivato come WILD.';await load()}catch(e){qs('#admin-driver-message').textContent='Errore: '+e.message}};
qs('#admin-delete-driver').onclick=async()=>{const d=(data.hydra_drivers||[]).find(x=>String(x.id)===qs('#admin-driver-select').value);if(!d)return;const used=['hydra_results','hydra_resource_events','hydra_attendance'].some(t=>(data[t]||[]).some(x=>String(x.driver_id)===String(d.id)))||(data.hydra_teams||[]).some(t=>String(t.team_principal_driver_id)===String(d.id));if(used){qs('#admin-driver-message').textContent='Eliminazione bloccata: il pilota è collegato a risultati, presenze, movimenti o incarichi TP. Puoi archiviarlo.';return}if(!confirm(`Eliminare DEFINITIVAMENTE ${d.gamertag}? Questa operazione è irreversibile.`))return;const typed=prompt(`Digita esattamente ${d.gamertag} per confermare`);if(typed!==d.gamertag)return;try{const rows=await request(`/rest/v1/hydra_drivers?id=eq.${d.id}`,{method:'DELETE',headers:{Prefer:'return=representation'}});if(!Array.isArray(rows)||rows.length!==1)throw Error('Cancellazione non confermata');qs('#admin-driver-message').textContent='Pilota eliminato.';await load()}catch(e){qs('#admin-driver-message').textContent='Errore: '+e.message}};
// Race editor. One RPC call guarantees atomic result + COIN + PU changes.
let editorRows=[];
const pts=[30,25,21,18,15,13,11,9,7,6,5,4,3,2,1];
function currentRace(){return(data.hydra_races||[]).find(r=>String(r.id)===qs('#admin-race-select').value)}
function newRaceRow(){return{driver_id:'',team_id:'',finishing_position:editorRows.length+1,status:'classified',qualifying_position:'',fastest_lap:false,penalty_seconds:0,penalty_coin:0,pu_lost:0,pu_slot:'',notes:''}}
function renderRaceEditor(){const race=currentRace();if(!race)return;const existing=(data.hydra_results||[]).filter(x=>String(x.race_id)===String(race.id)).sort((a,b)=>(a.finishing_position??999)-(b.finishing_position??999));editorRows=existing.length?existing.map(r=>({...r,team_id:r.team_id??'',qualifying_position:r.qualifying_position??'',pu_slot:r.pu_slot??'',pu_lost:r.pu_lost??0})):Array.from({length:5},(_,i)=>({...newRaceRow(),finishing_position:i+1}));drawRaceEditor()}
function drawRaceEditor(){const race=currentRace();if(!race)return;const existing=(data.hydra_results||[]).some(r=>String(r.race_id)===String(race.id));const finance=!!race.managed_finances||!existing;qs('#admin-race-finance-note').textContent=finance?'Nuova gara gestita: premi COIN e PU applicati automaticamente al salvataggio.':'Gara storica: puoi correggere i risultati, ma COIN e PU NON saranno modificati.';
 const drivers=(data.hydra_drivers||[]).filter(d=>d.league===race.league),teams=data.hydra_teams||[];
 qs('#admin-race-rows').innerHTML=editorRows.map((r,i)=>`<div class="race-edit-row" data-row="${i}"><span>${i+1}.</span><label>Pilota<select data-field="driver_id"><option value="">— Seleziona —</option>${drivers.map(d=>`<option value="${d.id}" ${String(d.id)===String(r.driver_id)?'selected':''}>${htmlEscape(d.gamertag)}</option>`).join('')}</select></label><label>Scuderia GP<select data-field="team_id"><option value="">WILD</option>${teams.map(t=>`<option value="${t.id}" ${String(t.id)===String(r.team_id)?'selected':''}>${htmlEscape(t.name)}</option>`).join('')}</select></label><label>Posizione<input data-field="finishing_position" type="number" min="1" max="22" value="${r.finishing_position??''}"></label><button type="button" class="race-remove" data-remove="${i}" title="Rimuovi">✕</button><div class="race-extra"><label>Esito<select data-field="status">${['classified','dnf','dns','dsq'].map(s=>`<option value="${s}" ${s===r.status?'selected':''}>${({classified:'Classificato',dnf:'Ritiro',dns:'Non partito',dsq:'Squalificato'})[s]}</option>`).join('')}</select></label><label>Qualifica<input data-field="qualifying_position" type="number" min="1" max="22" value="${r.qualifying_position??''}"></label><label class="race-check">Giro veloce<input data-field="fastest_lap" type="checkbox" ${r.fastest_lap?'checked':''}></label><label>Penalità sec.<input data-field="penalty_seconds" type="number" min="0" step="0.1" value="${r.penalty_seconds??0}"></label><label>Penalità COIN<input data-field="penalty_coin" type="number" min="0" value="${r.penalty_coin??0}"></label><label>PU perse<input data-field="pu_lost" type="number" min="0" max="2" value="${r.pu_lost??0}"></label><label>Slot PU<select data-field="pu_slot"><option value="">—</option>${[1,2,3,4].map(n=>`<option value="${n}" ${String(n)===String(r.pu_slot)?'selected':''}>${n}</option>`).join('')}</select></label><label>Note<input data-field="notes" value="${htmlEscape(r.notes??'')}"></label></div></div>`).join('');
 qs('#admin-race-rows').querySelectorAll('[data-field]').forEach(el=>el.onchange=()=>{const row=editorRows[Number(el.closest('[data-row]').dataset.row)];row[el.dataset.field]=el.type==='checkbox'?el.checked:el.value;if(el.dataset.field==='driver_id'){const d=drivers.find(d=>String(d.id)===el.value);if(d?.team_id){row.team_id=d.team_id;drawRaceEditor()}}});
 qs('#admin-race-rows').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{editorRows.splice(Number(b.dataset.remove),1);drawRaceEditor()});}
qs('#admin-race-select').onchange=renderRaceEditor;
qs('#admin-add-race-row').onclick=()=>{if(editorRows.length>=22)return;editorRows.push(newRaceRow());drawRaceEditor()};
qs('#admin-save-race').onclick=async()=>{const race=currentRace(),message=qs('#admin-race-message');if(!race)return;const rows=editorRows.filter(r=>r.driver_id);if(!rows.length){message.textContent='Seleziona almeno un pilota.';return}const ids=rows.map(r=>String(r.driver_id));if(new Set(ids).size!==ids.length){message.textContent='Pilota ripetuto.';return}const classified=rows.filter(r=>r.status==='classified'),positions=classified.map(r=>Number(r.finishing_position));if(positions.some(x=>!x||x<1)||new Set(positions).size!==positions.length){message.textContent='Controlla le posizioni dei classificati.';return}if(rows.filter(r=>Number(r.qualifying_position)===1).length>1||rows.filter(r=>r.fastest_lap).length>1){message.textContent='Una sola pole e un solo giro veloce per GP.';return}
 const legacy=(data.hydra_results||[]).some(r=>String(r.race_id)===String(race.id))&&!race.managed_finances;const messageText=legacy?'Questa è una gara storica: modificare i risultati NON cambierà COIN o PU.':'Questa gara aggiornerà automaticamente COIN e PU. Se la modifichi in futuro, i movimenti saranno sostituiti senza duplicazioni.';
 if(!confirm(`${race.circuit} · Lega ${race.league}\n${rows.length} piloti.\n${messageText}\nConfermare?`))return;
 message.textContent='Salvataggio in corso...';qs('#admin-save-race').disabled=true;
 try{const result=await request('/rest/v1/rpc/hydra406_save_race',{method:'POST',body:JSON.stringify({p_race_id:race.id,p_rows:rows,p_apply_finances:!legacy})});message.textContent=`Risultati salvati (${result.rows} piloti). ${result.finance_applied?'COIN e PU aggiornati.':'COIN e PU storici invariati.'}`;await load()}catch(e){message.textContent='Errore: '+e.message}finally{qs('#admin-save-race').disabled=false}
};
// Initialize charts once the core script has loaded.
if(data.hydra_teams)progressChart();
