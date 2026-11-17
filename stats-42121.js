/* HYDRA 4.2.1.22 — Top 5 statistiche, carriera unificata per nickname (solo pagina Statistiche) */
(()=>{
'use strict';
const root=document.getElementById('hydra-stats-grid');
if(!root)return;
const tabs=[...document.querySelectorAll('[data-stats-league]')];
let scope='ALL';
const defs=[
 ['points','Punti totali in carriera','★'],['starts','Gran Premi disputati','🏁'],['wins','Vittorie totali','🏆'],
 ['streak','Vittorie consecutive','🔥'],['hattricks','Hat trick','🎩'],['podiums','Podi totali','🥇'],
 ['poles','Pole position','⚑'],['fastlaps','Giri veloci','⚡'],['dnf','DNF','↘']
];
const str=x=>String(x??'');
const num=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x))?Number(x):null;
const coll=new Intl.Collator('it',{sensitivity:'base',numeric:true});
const nicknameKey=name=>str(name).normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('it');
function draw(){
 if(typeof data==='undefined'||!Array.isArray(data.hydra_results)){root.textContent='Caricamento statistiche…';return;}
 const drivers=data.hydra_drivers||[],races=data.hydra_races||[],results=data.hydra_results||[];
 const dm=new Map(drivers.map(d=>[str(d.id),d]));
 const rm=new Map(races.filter(r=>r.status==='official'&&(scope==='ALL'||r.league===scope)).map(r=>[str(r.id),r]));
 const byDriver=new Map();
 for(const r of results){
  const race=rm.get(str(r.race_id)),d=dm.get(str(r.driver_id));
  if(!race||!d)continue;
  // Aggregazione SOLO visuale: gli ID originali e le classifiche del Campionato restano invariati.
  const name=str(d.gamertag||d.nickname||'Pilota').trim();
  const key=nicknameKey(name);
  if(!byDriver.has(key))byDriver.set(key,{name,rows:[],stats:{}});
  byDriver.get(key).rows.push({r,race});
 }
 for(const d of byDriver.values()){
  const rows=d.rows;
  const starts=rows.filter(x=>!['dns','dsq'].includes(str(x.r.status).toLowerCase()));
  const wins=rows.filter(x=>str(x.r.status).toLowerCase()==='classified'&&num(x.r.finishing_position)===1);
  const poles=rows.filter(x=>num(x.r.qualifying_position)===1);
  const fast=rows.filter(x=>x.r.fastest_lap===true||str(x.r.fastest_lap)==='true');
  const winRaceIds=new Set(wins.map(x=>str(x.race.id)));
  const ordered=starts.slice().sort((a,b)=>{
   const da=str(a.race.race_date||''),db=str(b.race.race_date||'');
   return da.localeCompare(db)||Number(a.race.round_number||0)-Number(b.race.round_number||0)||str(a.race.id).localeCompare(str(b.race.id));
  });
  let streak=0,best=0;
  for(const x of ordered){streak=winRaceIds.has(str(x.race.id))?streak+1:0;best=Math.max(best,streak);}
  const poleIds=new Set(poles.map(x=>str(x.race.id)));
  const fastIds=new Set(fast.map(x=>str(x.race.id)));
  d.stats={
   points:rows.reduce((n,x)=>n+(num(x.r.points)||0),0),
   starts:new Set(starts.map(x=>str(x.race.id))).size,
   wins:winRaceIds.size,streak:best,
   hattricks:[...winRaceIds].filter(id=>poleIds.has(id)&&fastIds.has(id)).length,
   podiums:rows.filter(x=>str(x.r.status).toLowerCase()==='classified'&&num(x.r.finishing_position)!==null&&num(x.r.finishing_position)>=1&&num(x.r.finishing_position)<=3).length,
   poles:poleIds.size,fastlaps:fastIds.size,
   dnf:rows.filter(x=>str(x.r.status).toLowerCase()==='dnf').length
  };
 }
 root.replaceChildren();
 for(const [key,label,emoji] of defs){
  const card=document.createElement('article');card.className='hydra-stat-card';
  const h=document.createElement('h3');h.textContent=emoji+' '+label;card.append(h);
  const list=document.createElement('ol');list.className='hydra-stat-list';
  const top=[...byDriver.values()].filter(d=>d.stats[key]>0).sort((a,b)=>b.stats[key]-a.stats[key]||coll.compare(a.name,b.name)).slice(0,5);
  if(!top.length){const p=document.createElement('p');p.className='hydra-stat-empty';p.textContent='Nessun dato ufficiale disponibile';card.append(p);}
  for(const d of top){const li=document.createElement('li');const n=document.createElement('span');n.textContent=d.name;const v=document.createElement('strong');v.textContent=new Intl.NumberFormat('it-IT').format(d.stats[key]);li.append(n,v);list.append(li);}
  card.append(list);root.append(card);
 }
 const info=document.getElementById('hydra-stats-info');
 if(info)info.textContent='Statistiche ufficiali · Profili con lo stesso nickname unificati solo qui · '+(scope==='ALL'?'Generale':scope==='A'?'Lega A':'Lega B');
}
tabs.forEach(b=>b.addEventListener('click',()=>{scope=b.dataset.statsLeague;tabs.forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});draw();}));
if(typeof render==='function'){
 const originalRender=render;
 render=function(...args){const out=originalRender.apply(this,args);draw();return out;};
}
document.querySelectorAll('[data-page="statistics"]').forEach(b=>b.addEventListener('click',draw,true));
draw();
})();