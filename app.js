'use strict';
// Publishable API key only. Never place a service_role/secret key in browser code.
const URL_BASE='https://wgjdhdssiveqedluktwi.supabase.co';
const PUBLIC_KEY='sb_publishable_SjpllvJDfzLQM7nD_0CnJQ_B31PCe_I';
const ADMIN_LOGIN='Admin';
const ADMIN_EMAIL='hydra1esports@gmail.com';
const tables=['hydra_teams','hydra_drivers','hydra_races','hydra_results','hydra_resource_events','hydra_team_power_units','hydra_attendance','hydra_attendance_settings'];
const schema={hydra_teams:[['name','text','Nome scuderia'],['coin_balance','number','Saldo COIN']],hydra_drivers:[['gamertag','text','Gamertag'],['league','select:A|B','Lega'],['team_id','fk:hydra_teams','Scuderia'],['power_units_used','number','PU utilizzate']],hydra_races:[['round_number','number','Round'],['circuit','text','Circuito'],['race_date','date','Data'],['league','select:A|B','Lega'],['status','select:scheduled|provisional|official','Stato']],hydra_results:[['race_id','fk:hydra_races','Gara'],['driver_id','fk:hydra_drivers','Pilota'],['team_id','fk:hydra_teams','Scuderia rappresentata nel GP'],['finishing_position','number','Posizione'],['qualifying_position','number','Posizione qualifiche'],['fastest_lap','select:true|false','Giro veloce'],['penalty_seconds','number','Penalità secondi'],['penalty_coin','number','Penalità COIN'],['points','number','Punti'],['status','select:classified|dnf|dns|dsq','Esito'],['notes','text','Note']],hydra_resource_events:[['team_id','fk:hydra_teams','Scuderia'],['driver_id','fk:hydra_drivers','Pilota'],['race_id','fk:hydra_races','Gara'],['coin_delta','number','Variazione COIN'],['pu_delta','number','Variazione PU'],['reason','text','Motivazione']]};
let data={},token=null,selected=null,league='A';
function showStandingsTab(){const general=league==='GENERAL';$('#standings-league-content').hidden=general;$('#standings-general-content').hidden=!general;}
const $=s=>document.querySelector(s);const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nameOf=(table,id)=>{let r=(data[table]||[]).find(x=>String(x.id)===String(id));return r?(r.name||r.gamertag||`${r.circuit} · ${r.league} · R${r.round_number}`):'—'};
async function request(path,opts={}){const headers={'apikey':PUBLIC_KEY,'Content-Type':'application/json',...(token?{'Authorization':`Bearer ${token}`}:{'Authorization':`Bearer ${PUBLIC_KEY}`}),...(opts.headers||{})};const response=await fetch(URL_BASE+path,{...opts,headers});const body=await response.text();let result;try{result=body?JSON.parse(body):null}catch{result=body}if(!response.ok)throw Error(result?.message||result?.error_description||`Errore ${response.status}`);return result}
async function load(){try{await Promise.all(tables.map(async t=>data[t]=await request(`/rest/v1/${t}?select=*&order=${t==='hydra_team_power_units'?'team_id.asc,slot.asc':t==='hydra_attendance'?'race_id.asc,driver_id.asc':t==='hydra_attendance_settings'?'race_id.asc':'id.asc'}`)));render();renderAttendance();if(token){renderAdmin();renderAttendanceAdmin()}}catch(e){console.error(e);if($('#stat-drivers')) $('#stat-drivers').textContent='!';$('#standings-table').innerHTML=`<p class="empty">Impossibile caricare i dati: ${esc(e.message)}</p>`}}
function grid(head,rows){if(!rows.length)return '<p class="empty">Nessun dato ancora pubblicato.</p>';return `<table><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
function render(){showStandingsTab();const drivers=data.hydra_drivers||[],teams=data.hydra_teams||[],races=data.hydra_races||[],results=data.hydra_results||[];if($('#stat-drivers')) $('#stat-drivers').textContent=drivers.length;if($('#stat-teams')) $('#stat-teams').textContent=teams.length;if($('#stat-races')) $('#stat-races').textContent=races.length;
const official=results.filter(r=>races.some(g=>g.id===r.race_id&&g.status==='official'));
const driverById=new Map(drivers.map(d=>[String(d.id),d]));
const leaguePoints=new Map(),combinedPoints=new Map();
for(const r of official){const d=driverById.get(String(r.driver_id));if(!d)continue;const points=Number(r.points)||0;const race=races.find(g=>g.id===r.race_id);const teamId=r.team_id??d.team_id;if(!teamId||!race)continue;const key=`${race.league}:${teamId}`;leaguePoints.set(key,(leaguePoints.get(key)||0)+points);combinedPoints.set(String(teamId),(combinedPoints.get(String(teamId))||0)+points)}
const standings=drivers.filter(d=>d.league===league).map(d=>({...d,points:official.filter(r=>String(r.driver_id)===String(d.id)).reduce((sum,r)=>sum+(Number(r.points)||0),0)})).sort((a,b)=>b.points-a.points||a.gamertag.localeCompare(b.gamertag,'it'));
$('#standings-league-drivers').textContent=`Lega ${league}`;
$('#standings-league-teams').textContent=`Lega ${league}`;
$('#standings-table').innerHTML=grid(['#','Pilota','Scuderia','Punti'],standings.map((d,i)=>[i+1,d.gamertag,nameOf('hydra_teams',d.team_id),d.points]));
const sortTeams=arr=>arr.sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name,'it'));
const constructorsLeague=sortTeams(teams.map(t=>({name:t.name,points:leaguePoints.get(`${league}:${t.id}`)||0})));
$('#constructors-league-table').innerHTML=grid(['#','Scuderia','Punti'],constructorsLeague.map((t,i)=>[i+1,t.name,t.points]));
const constructorsCombined=sortTeams(teams.map(t=>({name:t.name,points:combinedPoints.get(String(t.id))||0})));
$('#constructors-table').innerHTML=grid(['#','Scuderia','Punti'],constructorsCombined.map((t,i)=>[i+1,t.name,t.points]));
$('#team-cards').innerHTML=teams.length?teams.map(t=>`<article><div class="eyebrow">SCUDERIA</div><h3>${esc(t.name)}</h3><p>${drivers.filter(d=>d.team_id===t.id).map(d=>`${esc(d.gamertag)} · Lega ${esc(d.league)}`).join('<br>')||'Piloti non assegnati'}</p></article>`).join(''):'<p class="empty">Nessuna scuderia ancora inserita.</p>';
renderCalendar(races,results);
const sel=$('#race-select'),prev=sel.value;sel.innerHTML='<option value="">Seleziona una gara</option>'+races.map(r=>`<option value="${r.id}">${esc(`R${r.round_number} · ${r.circuit} · Lega ${r.league}`)}</option>`).join('');sel.value=races.some(r=>String(r.id)===prev)?prev:'';renderResults();
const pu=data.hydra_team_power_units||[];
$('#resource-table').innerHTML=grid(['Scuderia','COIN','PU 1','PU 2','PU 3','PU 4','Totale PU residue'],teams.map(t=>{const slots=pu.filter(x=>x.team_id===t.id);const v=n=>{const x=slots.find(x=>x.slot===n);return x?`${x.remaining}/${x.total}`:'—'};return[t.name,t.coin_balance??'—',v(1),v(2),v(3),v(4),slots.length===4?slots.reduce((a,x)=>a+x.remaining,0):'—']}));
$('#pu-drivers-table').innerHTML=grid(['Scuderia','Pilota','Lega'],teams.flatMap(t=>drivers.filter(d=>d.team_id===t.id).map(d=>[t.name,d.gamertag,d.league])));}

let calendarSelectedRound=null;
function calendarDate(raw){
 if(!raw)return 'Data da definire';
 const dt=new Date(String(raw).slice(0,10)+'T12:00:00');
 return Number.isNaN(dt.getTime())?'Data da definire':dt.toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'});
}
function calendarStatus(r){
 return r?.status==='official'?'CONCLUSA':r?.status==='provisional'?'PROVVISORIA':r?.status==='scheduled'?'IN PROGRAMMA':'DA DEFINIRE';
}
const calendarPhotos={1: "https://commons.wikimedia.org/wiki/Special:FilePath/Albert%20Park%20%26%20Australia%20Grand%20Prix%20Circuit.jpg?width=960", 2: "https://commons.wikimedia.org/wiki/Special:FilePath/Jeddah%20Corniche%20Circuit%20viewed%20from%20above.png?width=960", 3: "https://commons.wikimedia.org/wiki/Special:FilePath/Silverstone%20Circuit%20%2814624952224%29.jpg?width=960", 4: "https://commons.wikimedia.org/wiki/Special:FilePath/Circuit%20de%20Spa-Francorchamps%2C%20April%2022%2C%202018%20SkySat%20%28cropped%29.jpg?width=960", 5: "https://commons.wikimedia.org/wiki/Special:FilePath/Circuit%20Park%20Zandvoort%20aerial%20photo.jpg?width=960", 7: "https://commons.wikimedia.org/wiki/Special:FilePath/Circuit%20de%20Barcelona-Catalunya%2C%20April%2019%2C%202018%20SkySat%20%28cropped%29.jpg?width=960", 8: "https://commons.wikimedia.org/wiki/Special:FilePath/Marina%20Bay%20Street%20Circuit%2C%20May%208%2C%202018%20SkySat%20%28cropped%29.jpg?width=960", 9: "https://commons.wikimedia.org/wiki/Special:FilePath/Circuit%20of%20the%20Americas%2C%20April%2022%2C%202018%20SkySat%20%28cropped2%29.jpg?width=960", 12: "https://commons.wikimedia.org/wiki/Special:FilePath/Yas%20Marina%20Circuit%2C%20October%2012%2C%202018%20SkySat%20%28cropped%29.jpg?width=960"};
const calendarFlags={1:'🇦🇺',2:'🇸🇦',3:'🇬🇧',4:'🇧🇪',5:'🇳🇱',6:'❔',7:'🇪🇸',8:'🇸🇬',9:'🇺🇸',10:'🇺🇸',11:'🇮🇹',12:'🇦🇪'};
function renderCalendar(races,results){
 const byRound=new Map();
 for(const r of races){
  const n=Number(r.round_number);
  if(!byRound.has(n))byRound.set(n,[]);
  byRound.get(n).push(r);
 }
 const rounds=[...byRound.keys()].sort((a,b)=>a-b);
 const next=rounds.find(n=>byRound.get(n).some(r=>r.status!=='official'))??null;
 const completed=rounds.filter(n=>byRound.get(n).every(r=>r.status==='official')).length;
 $('#calendar-summary').textContent=`${rounds.length} ROUND · ${completed} CONCLUSI`;
 const circuitFor=rr=>rr.find(r=>r.circuit)?.circuit||'Circuito da definire';
 $('#calendar-table').innerHTML=rounds.map(n=>{
  const rr=byRound.get(n),done=rr.every(r=>r.status==='official'),isNext=n===next;
  const badge=done?'CONCLUSO':isNext?'PROSSIMO ROUND':'IN PROGRAMMA';
  const leagues=['A','B'].map(l=>{
   const r=rr.find(x=>x.league===l);
   return `<div class="calendar-league"><span class="calendar-league-name">LEGA ${l}</span><span class="calendar-league-date">${r?esc(calendarDate(r.race_date)):'Non programmata'}</span><span class="calendar-league-status ${r?.status==='official'?'is-done':''}">${esc(calendarStatus(r))}</span></div>`;
  }).join('');
  return `<button type="button" class="calendar-card ${isNext?'calendar-card-next':''} ${done?'calendar-card-done':''} ${calendarSelectedRound===n?'calendar-card-active':''}" data-calendar-round="${n}" aria-expanded="${calendarSelectedRound===n?'true':'false'}">
    <div class="calendar-card-top"><span><span class="calendar-country-flag" aria-label="Bandiera del paese ospitante">${calendarFlags[n]||'🏁'}</span> ROUND ${String(n).padStart(2,'0')}</span><span class="calendar-card-badge">${badge}</span></div>
    <div class="calendar-card-art" aria-hidden="true"><img src="${calendarPhotos[n]||'circuit-06.svg'}" alt="Vista del circuito" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='circuit-06.svg'"><span class="calendar-art-number">${String(n).padStart(2,'0')}</span></div>
    <div class="calendar-card-main"><h3>${esc(circuitFor(rr))}</h3><p>HYDRA GRAND PRIX</p></div>
    <div class="calendar-leagues">${leagues}</div><div class="calendar-card-foot">DETTAGLI E RISULTATI <span>↗</span></div></button>`;
 }).join('')||'<p class="empty">Nessun Gran Premio ancora inserito.</p>';
 document.querySelectorAll('[data-calendar-round]').forEach(b=>b.onclick=()=>{
  const n=Number(b.dataset.calendarRound);
  calendarSelectedRound=calendarSelectedRound===n?null:n;
  renderCalendar(races,results);
  if(calendarSelectedRound!==null)$('#calendar-detail').scrollIntoView({behavior:'smooth',block:'nearest'});
 });
 const detail=$('#calendar-detail');
 if(calendarSelectedRound===null||!byRound.has(calendarSelectedRound)){detail.hidden=true;detail.innerHTML='';return;}
 detail.hidden=false;
 const rr=byRound.get(calendarSelectedRound);
 const driversById=new Map((data.hydra_drivers||[]).map(d=>[String(d.id),d]));
 const teamsById=new Map((data.hydra_teams||[]).map(t=>[String(t.id),t]));
 const panels=['A','B'].map(l=>{
  const r=rr.find(x=>x.league===l);
  if(!r)return `<article class="calendar-result-panel"><h4>LEGA ${l}</h4><p class="muted">Gara non ancora inserita.</p></article>`;
  const rows=results.filter(x=>String(x.race_id)===String(r.id))
   .sort((a,b)=>(a.finishing_position??999)-(b.finishing_position??999)
    ||String(driversById.get(String(a.driver_id))?.gamertag||'').localeCompare(String(driversById.get(String(b.driver_id))?.gamertag||''),'it'));
  const body=r.status==='official'&&rows.length
   ?`<div class="calendar-results-scroll"><table><thead><tr><th>POS</th><th>PILOTA</th><th>SCUDERIA</th><th>Q</th><th>GV</th><th>PEN. SEC</th><th>PEN. COIN</th><th>PT</th></tr></thead><tbody>${rows.map(x=>{
    const d=driversById.get(String(x.driver_id)),t=teamsById.get(String(x.team_id??d?.team_id));
    return `<tr><td>${esc(x.finishing_position??'—')}${x.status==='dnf'?' <small>RIT</small>':''}</td><td>${esc(d?.gamertag||'—')}</td><td>${esc(t?.name||'—')}</td><td>${esc(x.qualifying_position??'—')}</td><td>${x.fastest_lap?'⚡':'—'}</td><td>${esc(x.penalty_seconds??'—')}</td><td>${esc(x.penalty_coin??'—')}</td><td>${esc(x.points??0)}</td></tr>`;
   }).join('')}</tbody></table></div>`
   :`<p class="calendar-no-results">${r.status==='official'?'Risultati non disponibili.':'Risultati disponibili dopo l’ufficializzazione della gara.'}</p>`;
  return `<article class="calendar-result-panel"><div class="calendar-result-head"><h4>LEGA ${l}</h4><span>${esc(calendarDate(r.race_date))}</span></div><p class="calendar-result-state">${esc(calendarStatus(r))}</p>${body}</article>`;
 }).join('');
 detail.innerHTML=`<div class="calendar-detail-title"><div><span class="calendar-kicker">RACE REPORT · ROUND ${String(calendarSelectedRound).padStart(2,'0')}</span><h3>${esc(circuitFor(rr))}</h3></div><button type="button" id="calendar-close" aria-label="Chiudi dettagli">✕</button></div><div class="calendar-results-grid">${panels}</div>`;
 $('#calendar-close').onclick=()=>{calendarSelectedRound=null;renderCalendar(races,results)};
}

function renderResults(){const raceId=Number($('#race-select').value);const rows=(data.hydra_results||[]).filter(r=>r.race_id===raceId).sort((a,b)=>(a.finishing_position??999)-(b.finishing_position??999));$('#results-table').innerHTML=grid(['Pos.','Pilota','Esito','Punti','Note'],rows.map(r=>[r.finishing_position??'—',nameOf('hydra_drivers',r.driver_id),r.status,r.points,r.notes||'—']))}
function page(name){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===name));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===name));window.scrollTo(0,0)}document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>page(b.dataset.go));document.querySelectorAll('[data-league]').forEach(b=>b.onclick=()=>{league=b.dataset.league;document.querySelectorAll('[data-league]').forEach(x=>x.classList.toggle('selected',x===b));render()});$('#race-select').onchange=renderResults;
async function login(e){e.preventDefault();const user=$('#login-name').value.trim();if(user.toLowerCase()!==ADMIN_LOGIN.toLowerCase()){alert('Credenziali non valide');return}const password=$('#login-password').value;try{const r=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:ADMIN_EMAIL,password})});token=r.access_token;sessionStorage.setItem('hydra_session',JSON.stringify({access_token:r.access_token,refresh_token:r.refresh_token}));$('#login-password').value='';await checkAdmin()}catch(e){token=null;alert('Accesso non riuscito: '+e.message)}}
async function checkAdmin(){try{const u=await request('/auth/v1/user');const admins=await request('/rest/v1/hydra_admins?select=user_id');if(!admins.some(a=>a.user_id===u.id))throw Error('Account senza permessi amministrativi');$('#login-box').hidden=true;$('#admin-box').hidden=false;$('#admin-welcome').textContent='Accesso amministratore attivo · '+ADMIN_LOGIN;renderAdmin();renderAttendanceAdmin()}catch(e){token=null;sessionStorage.removeItem('hydra_session');$('#login-box').hidden=false;$('#admin-box').hidden=true;alert(e.message)}}
$('#login-form').onsubmit=login;$('#logout').onclick=async()=>{try{await request('/auth/v1/logout',{method:'POST'})}catch{}token=null;sessionStorage.removeItem('hydra_session');$('#admin-box').hidden=true;$('#login-box').hidden=false};
function renderAdmin(){const table=$('#edit-entity').value,items=data[table]||[];if(table==='hydra_team_power_units'){renderPuAdmin();return}$('#edit-list').innerHTML='<div class="admin-list">'+items.map(r=>`<button type="button" data-edit="${r.id}">${esc(r.name||r.gamertag||r.circuit||r.reason||`Record ${r.id}`)}</button>`).join('')+'</div>';document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editRow(items.find(x=>x.id===Number(b.dataset.edit))));editRow(null)}
function editRow(row){selected=row;const table=$('#edit-entity').value;$('#edit-title').textContent=row?`Modifica record #${row.id}`:'Nuovo record';$('#edit-fields').innerHTML=schema[table].map(([key,type,label])=>{let control='';if(type.startsWith('select:')){control=`<select name="${key}">${type.slice(7).split('|').map(x=>`<option value="${esc(x)}" ${row?.[key]===x?'selected':''}>${esc(x)}</option>`).join('')}</select>`}else if(type.startsWith('fk:')){const target=type.slice(3);control=`<select name="${key}"><option value="">— Nessuno —</option>${(data[target]||[]).map(x=>`<option value="${x.id}" ${row?.[key]===x.id?'selected':''}>${esc(x.name||x.gamertag||`${x.circuit} · ${x.league} · R${x.round_number}`)}</option>`).join('')}</select>`}else control=`<input name="${key}" type="${type}" value="${esc(row?.[key]??'')}" ${['name','gamertag','circuit','reason','round_number'].includes(key)?'required':''}>`;return `<label class="field">${esc(label)}${control}</label>`}).join('');if(table==='hydra_results'&&!row){const driverSelect=$('#edit-fields select[name=driver_id]'),teamSelect=$('#edit-fields select[name=team_id]');const suggest=()=>{const driver=(data.hydra_drivers||[]).find(d=>String(d.id)===driverSelect.value);if(driver?.team_id)teamSelect.value=String(driver.team_id)};driverSelect.addEventListener('change',suggest);suggest()}}
function renderPuAdmin(){
const items=data.hydra_team_power_units||[];
$('#edit-list').innerHTML='<p class="muted">Seleziona una posizione PU da modificare. Gli slot 1–4 non sono ancora associati nominalmente ai piloti.</p><div class="admin-list">'+items.map(x=>`<button type="button" data-pu-team="${x.team_id}" data-pu-slot="${x.slot}">${esc(nameOf('hydra_teams',x.team_id))} · PU ${x.slot}: ${x.remaining}/${x.total}</button>`).join('')+'</div>';
$('#edit-title').textContent='Modifica Power Unit';
$('#edit-fields').innerHTML='<p class="muted">Scegli uno slot dall’elenco per modificarne il valore.</p>';
$('#edit-form').hidden=true;
$('#reset-edit').hidden=true;
$('#admin-status').textContent='';
document.querySelectorAll('[data-pu-team]').forEach(b=>b.onclick=()=>{
 const x=items.find(x=>x.team_id===Number(b.dataset.puTeam)&&x.slot===Number(b.dataset.puSlot));if(!x)return;
 selected=x;$('#edit-title').textContent=`${nameOf('hydra_teams',x.team_id)} · Slot PU ${x.slot}`;
 $('#edit-fields').innerHTML=`<label class="field">Power Unit residue (su 2)<select name="remaining"><option value="0" ${x.remaining===0?'selected':''}>0/2</option><option value="1" ${x.remaining===1?'selected':''}>1/2</option><option value="2" ${x.remaining===2?'selected':''}>2/2</option></select></label>`;
 $('#edit-form').hidden=false;
});
}
$('#edit-entity').onchange=()=>{if($('#edit-entity').value!=='hydra_team_power_units'){$('#edit-form').hidden=false;$('#reset-edit').hidden=false}renderAdmin()};$('#reset-edit').onclick=()=>editRow(null);$('#edit-form').onsubmit=async e=>{e.preventDefault();const table=$('#edit-entity').value;
if(table==='hydra_team_power_units'){
 if(!selected)return;
 const remaining=Number(new FormData(e.target).get('remaining'));
 try{await request(`/rest/v1/hydra_team_power_units?team_id=eq.${selected.team_id}&slot=eq.${selected.slot}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({remaining})}).then(rows=>{if(!Array.isArray(rows)||rows.length!==1)throw Error('Nessuna riga aggiornata. Verifica i permessi.')});$('#admin-status').textContent='Power Unit salvate.';await load()}catch(err){$('#admin-status').textContent='Errore: '+err.message}return;
}
const payload={};for(const [key,type] of schema[table]){const raw=new FormData(e.target).get(key);payload[key]=raw===''?null:(type==='number'||type.startsWith('fk:')?Number(raw):raw)}const path=`/rest/v1/${table}`+(selected?`?id=eq.${selected.id}`:'');try{await request(path,{method:selected?'PATCH':'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify(payload)});$('#admin-status').textContent='Salvato correttamente.';await load()}catch(err){$('#admin-status').textContent='Errore: '+err.message}};
(async()=>{await load();const stored=sessionStorage.getItem('hydra_session');if(stored){try{const s=JSON.parse(stored);const r=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh_token})});token=r.access_token;sessionStorage.setItem('hydra_session',JSON.stringify({access_token:r.access_token,refresh_token:r.refresh_token}));await checkAdmin()}catch{sessionStorage.removeItem('hydra_session')}}})();


// Attendance v2.1: public nickname-based attendance; deadline enforcement is server-side.
const attLeague=$('#attendance-league'),attDriver=$('#attendance-driver');
const attRaces=()=> (data.hydra_races||[]).filter(r=>r.status==='scheduled'&&r.race_date);
const attDeadline=r=>{const x=(data.hydra_attendance_settings||[]).find(s=>s.race_id===r.id);return x?.deadline_at||null};
function italyDate(s){return new Intl.DateTimeFormat('it-IT',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Rome'}).format(new Date(s))}
function attendanceRace(){return attRaces().filter(r=>r.league===attLeague.value).sort((a,b)=>a.race_date.localeCompare(b.race_date)||a.round_number-b.round_number)[0]||null}
function romeNowParts(){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const v=k=>parts.find(p=>p.type===k)?.value;return {date:`${v('year')}-${v('month')}-${v('day')}`,time:`${v('hour')}:${v('minute')}`}}
function deadlinePassed(r){const explicit=attDeadline(r);if(explicit)return Date.now()>=Date.parse(explicit);const now=romeNowParts();return now.date>r.race_date || (now.date===r.race_date && now.time>='18:00')}

function renderAttendance(){
 const race=attendanceRace(),drivers=(data.hydra_drivers||[]).filter(d=>d.league===attLeague.value).sort((a,b)=>a.gamertag.localeCompare(b.gamertag));
 const old=attDriver.value;attDriver.innerHTML='<option value="">Seleziona il tuo nickname</option>'+drivers.map(d=>`<option value="${d.id}">${esc(d.gamertag)} · ${esc(nameOf('hydra_teams',d.team_id))}</option>`).join('');if(drivers.some(d=>String(d.id)===old))attDriver.value=old;
 const raceEl=$('#attendance-race'),counts=$('#attendance-counts'),list=$('#attendance-list');
 if(!race){raceEl.innerHTML='<p class="empty">Nessuna prossima gara programmata per questa lega. La Direzione Gara deve inserire la data nel calendario.</p>';counts.innerHTML='';list.innerHTML='';attDriver.disabled=true;$('#attendance-yes').disabled=$('#attendance-no').disabled=true;$('#attendance-current').textContent='';return}
 const closed=deadlinePassed(race);raceEl.innerHTML=`<strong>Round ${race.round_number} · ${esc(race.circuit)}</strong><p>${esc(race.race_date)} · Lega ${esc(race.league)}</p><p class="muted">Scadenza: ${attDeadline(race)?esc(italyDate(attDeadline(race))):'ore 18:00 del giorno della gara (Italia)'} · ${closed?'Conferme chiuse':'Conferme aperte'}</p>`;
 attDriver.disabled=false;$('#attendance-yes').disabled=$('#attendance-no').disabled=closed;
 const rows=(data.hydra_attendance||[]).filter(x=>x.race_id===race.id);const present=rows.filter(x=>x.response==='present').length,absent=rows.filter(x=>x.response==='absent').length;
 counts.innerHTML=`<div><b>${present}</b><small>Presenti</small></div><div><b>${absent}</b><small>Assenti</small></div><div><b>${Math.max(0,drivers.length-present-absent)}</b><small>In attesa</small></div>`;
 list.innerHTML=drivers.map(d=>{const r=rows.find(x=>x.driver_id===d.id);return `<div><span>${esc(d.gamertag)}</span><span class="att-state ${r?.response||'pending'}">${r?.response==='present'?'Presente':r?.response==='absent'?'Assente':'In attesa'}</span></div>`}).join('');
 const mine=rows.find(x=>String(x.driver_id)===attDriver.value);$('#attendance-current').textContent=attDriver.value?`Risposta attuale: ${mine?.response==='present'?'Presente':mine?.response==='absent'?'Assente':'In attesa'}`:'Seleziona il tuo nickname per confermare.';
}
async function saveAttendance(response){const race=attendanceRace(),driver=Number(attDriver.value);if(!race||!driver)return $('#attendance-message').textContent='Seleziona prima il tuo nickname.';if(deadlinePassed(race))return $('#attendance-message').textContent='Termine per le conferme scaduto.';
 try{await request('/rest/v1/hydra_attendance?on_conflict=race_id,driver_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({race_id:race.id,driver_id:driver,response})});$('#attendance-message').textContent='Risposta salvata correttamente.';data.hydra_attendance=await request('/rest/v1/hydra_attendance?select=*');renderAttendance()}catch(e){$('#attendance-message').textContent='Salvataggio non riuscito: '+e.message}}
attLeague.onchange=()=>{attDriver.value='';$('#attendance-message').textContent='';renderAttendance()};attDriver.onchange=renderAttendance;
$('#attendance-yes').onclick=()=>saveAttendance('present');$('#attendance-no').onclick=()=>saveAttendance('absent');
function renderAttendanceAdmin(){if(!token)return;const select=$('#admin-att-race'),old=select.value;const races=[...(data.hydra_races||[])].filter(r=>r.status==='scheduled').sort((a,b)=>(a.race_date||'9999').localeCompare(b.race_date||'9999'));
 select.innerHTML='<option value="">Seleziona una gara programmata</option>'+races.map(r=>`<option value="${r.id}">${esc('R'+r.round_number+' · '+r.circuit+' · Lega '+r.league+' · '+(r.race_date||'data mancante'))}</option>`).join('');if(races.some(r=>String(r.id)===old))select.value=old;updateAdminAttendanceRace();renderAdminAttendanceSummary()}
function updateAdminAttendanceRace(){const race=(data.hydra_races||[]).find(r=>String(r.id)===$('#admin-att-race').value);const sel=$('#admin-att-driver');sel.innerHTML='<option value="">Seleziona pilota</option>'+((data.hydra_drivers||[]).filter(d=>race&&d.league===race.league).map(d=>`<option value="${d.id}">${esc(d.gamertag)}</option>`).join(''));const saved=race&&attDeadline(race);$('#admin-att-deadline').value=saved?new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(saved)).replace(' ','T'):(race?.race_date?race.race_date+'T18:00':'');renderAdminAttendanceSummary()}
$('#admin-att-race').onchange=updateAdminAttendanceRace;
// Convert a Rome wall-clock date to UTC, accounting for DST independently of the browser time zone.
function romeToIso(local){let guess=Date.parse(local+':00Z');for(let i=0;i<3;i++){const shown=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(guess)).replace(' ','T');guess+=Date.parse(local+':00Z')-Date.parse(shown+':00Z')}return new Date(guess).toISOString()}
$('#admin-att-save-deadline').onclick=async()=>{const raceId=Number($('#admin-att-race').value),v=$('#admin-att-deadline').value;if(!raceId||!v)return $('#admin-att-message').textContent='Seleziona gara e scadenza.';try{await request('/rest/v1/hydra_attendance_settings?on_conflict=race_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({race_id:raceId,deadline_at:romeToIso(v)})});$('#admin-att-message').textContent='Scadenza salvata.';await load()}catch(e){$('#admin-att-message').textContent='Errore: '+e.message}};
$('#admin-att-save-response').onclick=async()=>{const raceId=Number($('#admin-att-race').value),driverId=Number($('#admin-att-driver').value),response=$('#admin-att-response').value;if(!raceId||!driverId)return $('#admin-att-message').textContent='Seleziona gara e pilota.';try{await request('/rest/v1/hydra_attendance?on_conflict=race_id,driver_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({race_id:raceId,driver_id:driverId,response})});$('#admin-att-message').textContent='Presenza aggiornata.';await load()}catch(e){$('#admin-att-message').textContent='Errore: '+e.message}};

// Hydra 2.2: administrative attendance summary, filters and CSV export.
function adminAttendanceRows(){
 const race=(data.hydra_races||[]).find(r=>String(r.id)===$('#admin-att-race').value);
 if(!race)return [];
 const responses=new Map((data.hydra_attendance||[]).filter(a=>a.race_id===race.id).map(a=>[String(a.driver_id),a.response]));
 return (data.hydra_drivers||[]).filter(d=>d.league===race.league).map(d=>({
   nickname:d.gamertag,teamId:d.team_id,team:nameOf('hydra_teams',d.team_id)||'Senza scuderia',
   status:responses.get(String(d.id))||'pending'
 })).sort((a,b)=>a.nickname.localeCompare(b.nickname,'it',{sensitivity:'base'}));
}
function filteredAdminAttendanceRows(){
 const status=$('#admin-att-filter-status').value,team=$('#admin-att-filter-team').value;
 return adminAttendanceRows().filter(r=>(status==='all'||r.status===status)&&(team==='all'||String(r.teamId)===team));
}
function renderAdminAttendanceSummary(){
 const box=$('#admin-att-summary');if(!box)return;
 const race=(data.hydra_races||[]).find(r=>String(r.id)===$('#admin-att-race').value);
 box.hidden=!race;if(!race)return;
 const all=adminAttendanceRows(),teamSelect=$('#admin-att-filter-team'),previous=teamSelect.value;
 const teamOptions=[...new Map(all.map(r=>[String(r.teamId),r.team])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'it'));
 teamSelect.innerHTML='<option value="all">Tutte le scuderie</option>'+teamOptions.map(([id,name])=>`<option value="${esc(id)}">${esc(name)}</option>`).join('');
 teamSelect.value=teamOptions.some(([id])=>id===previous)?previous:'all';
 const n=status=>all.filter(r=>r.status===status).length;
 $('#admin-att-counts').innerHTML=`<div><strong>${n('present')}</strong><span>Presenti</span></div><div><strong>${n('absent')}</strong><span>Assenti</span></div><div><strong>${n('pending')}</strong><span>In attesa</span></div>`;
 renderAdminAttendanceTable();
}
function renderAdminAttendanceTable(){
 const rows=filteredAdminAttendanceRows();
 $('#admin-att-table-info').textContent=`${rows.length} piloti visualizzati su ${adminAttendanceRows().length}`;
 $('#admin-att-table-body').innerHTML=rows.length?rows.map(r=>`<tr><td>${esc(r.nickname)}</td><td>${esc(r.team)}</td><td><span class="admin-att-state ${r.status}">${r.status==='present'?'Presente':r.status==='absent'?'Assente':'In attesa'}</span></td></tr>`).join(''):'<tr><td colspan="3">Nessun pilota corrisponde ai filtri.</td></tr>';
}
$('#admin-att-filter-status').onchange=renderAdminAttendanceTable;
$('#admin-att-filter-team').onchange=renderAdminAttendanceTable;
$('#admin-att-export').onclick=()=>{
 const race=(data.hydra_races||[]).find(r=>String(r.id)===$('#admin-att-race').value);
 if(!race)return;
 const csvCell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const rows=[['Nickname','Scuderia','Lega','Stato'],...filteredAdminAttendanceRows().map(r=>[r.nickname,r.team,race.league,r.status==='present'?'Presente':r.status==='absent'?'Assente':'In attesa'])];
 const csv='\uFEFF'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n');
 const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=`Hydra_Presenze_${race.league}_${race.race_date||'gara'}.csv`;
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
