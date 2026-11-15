'use strict';
// Homepage enhancement: uses the same read-only data loaded by app.js.
let homeLeague='A',homeType='drivers';
function renderHome(){
 const drivers=data.hydra_drivers||[],teams=data.hydra_teams||[],races=data.hydra_races||[],results=data.hydra_results||[];
 const official=results.filter(x=>races.some(r=>r.id===x.race_id&&r.status==='official'));
 const total=id=>official.filter(r=>r.driver_id===id).reduce((n,r)=>n+Number(r.points||0),0);
 let entries;
 if(homeType==='drivers')entries=drivers.filter(d=>d.league===homeLeague).map(d=>({name:d.gamertag,team:teams.find(t=>t.id===d.team_id)?.name||'—',points:total(d.id)}));
 else entries=teams.map(t=>({name:t.name,team:'Scuderia',points:official.filter(r=>{const d=drivers.find(d=>d.id===r.driver_id);return d?.league===homeLeague&&d.team_id===t.id}).reduce((n,r)=>n+Number(r.points||0),0)}));
 entries.sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
 document.getElementById('home-leaderboard').innerHTML=entries.length?`<table class="home-table"><thead><tr><th>#</th><th>${homeType==='drivers'?'Pilota':'Scuderia'}</th><th>Punti</th></tr></thead><tbody>${entries.slice(0,6).map((x,i)=>`<tr><td><span class="rank ${i===0?'first':''}">${i+1}</span></td><td><strong>${esc(x.name)}</strong><small>${esc(x.team)}</small></td><td class="points">${x.points}</td></tr>`).join('')}</tbody></table>`:'<p class="empty">Nessuna classifica disponibile.</p>';
 const dated=races.filter(r=>r.race_date).sort((a,b)=>a.race_date.localeCompare(b.race_date));
 const today=new Date().toISOString().slice(0,10);const next=dated.find(r=>r.race_date>=today&&r.status==='scheduled');
 if(next){document.getElementById('home-race-title').textContent=next.circuit;document.getElementById('home-race-sub').textContent=`ROUND ${String(next.round_number).padStart(2,'0')} · LEGA ${next.league}`;document.getElementById('home-race-date').textContent=new Date(next.race_date+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'});document.getElementById('home-race-status').textContent='Appuntamento in calendario · orario da verificare';}
 else {document.getElementById('home-race-title').textContent='CALENDARIO UFFICIALE';document.getElementById('home-race-sub').textContent='Le gare del campionato Hydra';document.getElementById('home-race-date').textContent='Prossima data da confermare';document.getElementById('home-race-status').textContent='Consulta il calendario per le gare registrate.';}
 const last=[...races].filter(r=>r.status==='official'&&results.some(x=>x.race_id===r.id)).sort((a,b)=>b.round_number-a.round_number||b.id-a.id)[0];
 if(last){document.getElementById('home-last-title').textContent=last.circuit;document.getElementById('home-last-meta').textContent=`ROUND ${last.round_number} · LEGA ${last.league} · Risultati registrati`;}
}
document.querySelectorAll('[data-home-league]').forEach(b=>b.addEventListener('click',()=>{homeLeague=b.dataset.homeLeague;document.querySelectorAll('[data-home-league]').forEach(x=>x.classList.toggle('selected',x===b));renderHome()}));
document.querySelectorAll('[data-home-type]').forEach(b=>b.addEventListener('click',()=>{homeType=b.dataset.homeType;document.querySelectorAll('[data-home-type]').forEach(x=>x.classList.toggle('selected',x===b));renderHome()}));
const originalRender=render;render=function(){originalRender();renderHome()};
if(data.hydra_teams)renderHome();
