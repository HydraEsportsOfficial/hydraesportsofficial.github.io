/* HYDRA 4.2.1.27 - Admin-only incident verdict register and official PDF export. */
(()=>{'use strict';
const raceSelect=document.getElementById('admin-race-select'),root=document.getElementById('admin-race-rows');
if(!raceSelect||!root)return;
const section=document.createElement('section');section.className='panel';section.style.cssText='margin:18px 0;padding:18px;border:1px solid #c5a46d;border-radius:12px';
section.innerHTML='<h3>⚖️ Registro reclami e verdetti</h3><p class="muted small">Ogni decisione viene salvata nel registro riservato agli amministratori. Il PDF riporta anche i reclami respinti. Le sanzioni sono applicate ai risultati solo tramite il pulsante dedicato, prima del salvataggio ufficiale.</p><div id="hydra-verdict-list"></div><div class="actions"><button type="button" id="hydra-verdict-add">+ Nuovo reclamo</button><button type="button" id="hydra-verdict-save">Salva verdetti</button><button type="button" id="hydra-verdict-apply">Applica sanzioni ai risultati</button><button type="button" id="hydra-verdict-pdf" class="gold">Genera PDF ufficiale</button></div><p id="hydra-verdict-message" role="status"></p>';
const anchor=document.getElementById('hydra-stewards-recalc')?.closest('.panel')||root;
anchor.parentNode.insertBefore(section,anchor);
const list=section.querySelector('#hydra-verdict-list'),msg=section.querySelector('#hydra-verdict-message');
const pdfDiagnostic=document.createElement('p');pdfDiagnostic.id='hydra-pdf-diagnostic';pdfDiagnostic.setAttribute('role','status');pdfDiagnostic.style.cssText='margin:8px 0;color:#f0ca75;font-weight:600';pdfDiagnostic.textContent='PDF: generatore in caricamento...';section.querySelector('#hydra-verdict-pdf').insertAdjacentElement('afterend',pdfDiagnostic);


// Arrange controls: draft tools, verdict register, stewards, then official actions.
const editorActions=document.getElementById('admin-add-race-row')?.closest('.actions');
const officialSave=document.getElementById('admin-save-race');
const pdfButton=section.querySelector('#hydra-verdict-pdf');
if(editorActions&&officialSave&&pdfButton){
 // Place the draft action row immediately after the race cards, before the verdict panel.
 root.insertAdjacentElement('afterend',editorActions);
 const finalActions=document.createElement('div');finalActions.className='actions';finalActions.id='hydra-final-actions';
 officialSave.parentNode.removeChild(officialSave);pdfButton.parentNode.removeChild(pdfButton);
 finalActions.append(officialSave,pdfButton);
 const stewards=document.getElementById('hydra-stewards-recalc')?.closest('.panel');
 if(stewards)stewards.insertAdjacentElement('afterend',finalActions);else section.insertAdjacentElement('afterend',finalActions);
}

let verdicts=[],serial=0,dirty=false,loadedRace='';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const drivers=()=> (data.hydra_drivers||[]).filter(d=>d.league===(data.hydra_races||[]).find(r=>String(r.id)===raceSelect.value)?.league);
const opts=(selected)=>'<option value="">— Nessuno —</option>'+drivers().map(d=>'<option value="'+d.id+'" '+(String(selected)===String(d.id)?'selected':'')+'>'+esc(d.gamertag)+'</option>').join('');
const label=id=>(data.hydra_drivers||[]).find(d=>String(d.id)===String(id))?.gamertag||'—';
function draw(){list.innerHTML=verdicts.map((v,i)=>'<div class="panel" style="padding:12px;margin:10px 0;border:1px solid rgba(197,164,109,.4)" data-verdict="'+i+'"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>Decisione n. '+(i+1)+'</strong><button type="button" data-remove="'+i+'">Rimuovi</button></div><div class="form-grid"><label>Reclamante<select data-v="complainant_driver_id">'+opts(v.complainant_driver_id)+'</select></label><label>Pilota sotto esame<select data-v="accused_driver_id">'+opts(v.accused_driver_id)+'</select></label><label>Verdetto<select data-v="verdict">'+[['pending','In esame'],['penalty','Penalità'],['no_action','Nessuna sanzione'],['warning','Richiamo']].map(([k,t])=>'<option value="'+k+'" '+(v.verdict===k?'selected':'')+'>'+t+'</option>').join('')+'</select></label><label>Secondi aggiuntivi<input data-v="penalty_seconds" type="number" min="0" step=".001" value="'+esc(v.penalty_seconds||0)+'"></label><label>Multa COIN<input data-v="penalty_coin" type="number" min="0" step="1" value="'+esc(v.penalty_coin||0)+'"></label></div><label class="field">Episodio contestato<textarea data-v="incident" rows="2">'+esc(v.incident)+'</textarea></label><label class="field">Motivazione dei giudici<textarea data-v="reason" rows="2">'+esc(v.reason)+'</textarea></label></div>').join('')||'<p class="muted small">Nessun reclamo registrato per questa gara.</p>';
list.querySelectorAll('[data-v]').forEach(el=>el.addEventListener('input',()=>{verdicts[Number(el.closest('[data-verdict]').dataset.verdict)][el.dataset.v]=el.value;dirty=true}));
list.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{verdicts.splice(Number(b.dataset.remove),1);dirty=true;draw()});
}
async function load(){const id=raceSelect.value,seq=++serial;loadedRace='';verdicts=[];dirty=false;draw();msg.textContent=id?'Caricamento reclami...':'';if(!id)return;try{const rows=await request('/rest/v1/hydra_race_verdicts?select=*&race_id=eq.'+encodeURIComponent(id)+'&order=decision_number.asc');if(seq!==serial||id!==raceSelect.value)return;verdicts=rows||[];loadedRace=id;draw();msg.textContent=verdicts.length+' reclami registrati.'}catch(e){msg.textContent='Impossibile caricare i reclami: '+e.message}}
raceSelect.addEventListener('change',load);if(raceSelect.value)load();
section.querySelector('#hydra-verdict-add').onclick=()=>{if(!raceSelect.value||loadedRace!==raceSelect.value){msg.textContent='Attendi il caricamento della gara.';return}verdicts.push({complainant_driver_id:'',accused_driver_id:'',incident:'',verdict:'pending',reason:'',penalty_seconds:0,penalty_coin:0});dirty=true;draw()};
function validate(final=false){if(!raceSelect.value||loadedRace!==raceSelect.value)throw Error('Seleziona una gara caricata.');for(let i=0;i<verdicts.length;i++){const v=verdicts[i],sec=Number(v.penalty_seconds),coin=Number(v.penalty_coin);if(!v.incident.trim())throw Error('Descrivi l’episodio della decisione '+(i+1));if(!Number.isFinite(sec)||sec<0||!Number.isInteger(coin)||coin<0)throw Error('Sanzione non valida alla decisione '+(i+1));if(v.verdict!=='penalty'&&(sec||coin))throw Error('Le sanzioni sono ammesse soltanto per un verdetto di penalità (decisione '+(i+1)+').');if((sec||coin)&&!v.accused_driver_id)throw Error('Indica il pilota sanzionato (decisione '+(i+1)+').');if(final&&v.verdict==='pending')throw Error('Decisione '+(i+1)+' ancora in esame.')}} 
async function save(){validate();const id=raceSelect.value;msg.textContent='Salvataggio registro...';const rows=verdicts.map((v,i)=>({race_id:Number(id),decision_number:i+1,complainant_driver_id:v.complainant_driver_id?Number(v.complainant_driver_id):null,accused_driver_id:v.accused_driver_id?Number(v.accused_driver_id):null,incident:v.incident,verdict:v.verdict,reason:v.reason||'',penalty_seconds:Number(v.penalty_seconds)||0,penalty_coin:Number(v.penalty_coin)||0}));await request('/rest/v1/rpc/hydra42127_replace_verdicts',{method:'POST',body:JSON.stringify({p_race_id:Number(id),p_verdicts:rows})});dirty=false;await load();msg.textContent='Verdetti salvati nel registro amministrativo.'}
section.querySelector('#hydra-verdict-save').onclick=async()=>{try{await save()}catch(e){msg.textContent='Salvataggio non riuscito: '+e.message}};
section.querySelector('#hydra-verdict-apply').onclick=()=>{try{validate(true);if(dirty)throw Error('Salva prima i verdetti.');const sums=new Map();verdicts.filter(v=>v.verdict==='penalty').forEach(v=>{const key=String(v.accused_driver_id),s=sums.get(key)||{sec:0,coin:0};s.sec+=Number(v.penalty_seconds);s.coin+=Number(v.penalty_coin);sums.set(key,s)});const missing=[...sums.keys()].filter(id=>!editorRows.some(r=>String(r.driver_id)===id));if(missing.length)throw Error('Piloti sanzionati assenti nei risultati: '+missing.map(label).join(', '));editorRows.forEach(r=>{const s=sums.get(String(r.driver_id))||{sec:0,coin:0};r.penalty_seconds=s.sec;r.penalty_coin=s.coin});drawRaceEditor();msg.textContent='Sanzioni applicate ai campi risultati. Premi Ricalcola classifica provvisoria, poi Salva bozza. Non sono ancora ufficiali.'}catch(e){msg.textContent=e.message}};
async function pdf(){
 validate(true);if(dirty)throw Error('Salva prima i verdetti.');
 const race=(data.hydra_races||[]).find(r=>String(r.id)===raceSelect.value);if(!race)throw Error('Gara non trovata');
 const {jsPDF}=window.jspdf||{};if(!jsPDF)throw Error('Generatore PDF non disponibile.');
 const doc=new jsPDF({unit:'mm',format:'a4'}),W=210,M=15,R=195,navy=[12,31,62],blue=[23,55,100],gold=[198,161,91],ink=[31,44,62],muted=[102,115,132],pale=[245,247,251];
 const clean=s=>String(s??'').replace(/[^\x20-\x7E\u00A0-\u00FF]/g,ch=>({'–':'-','—':'-','’':"'",'“':'"','”':'"','•':'-'}[ch]||'?'));
 let y=45;
 let logo=null;
 try{const response=await fetch('hydra-logo.png',{cache:'force-cache'});if(response.ok){const blob=await response.blob();logo=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)})}}catch(e){console.warn('HYDRA PDF logo unavailable',e)}
 function header(){doc.setFillColor(...navy);doc.rect(0,0,W,36,'F');doc.setFillColor(...gold);doc.rect(0,36,W,1.5,'F');if(logo){try{const prop=doc.getImageProperties(logo),ratio=prop.width/prop.height;const h=25,w=Math.min(32,h*ratio);doc.addImage(logo,'PNG',M,5,w,h)}catch(e){console.warn('HYDRA PDF logo invalid',e)}}doc.setTextColor(...gold);doc.setFont('helvetica','bold');doc.setFontSize(17);doc.text('HYDRA ESPORTS',logo?57:M,16);doc.setTextColor(230,234,243);doc.setFontSize(9);doc.text('DIREZIONE GARA  /  COMUNICATO UFFICIALE',logo?57:M,24);doc.setTextColor(...ink)}
 function footer(){const n=doc.getNumberOfPages();for(let p=1;p<=n;p++){doc.setPage(p);doc.setDrawColor(215,222,231);doc.line(M,283,R,283);doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(...muted);doc.text('HYDRA ESPORTS  |  DOCUMENTO UFFICIALE',M,290);doc.text('Pagina '+p+' / '+n,R,290,{align:'right'})}}
 function next(need=12){if(y+need>275){doc.addPage();header();y=46}}
 function sectionTitle(t){next(17);doc.setFillColor(...navy);doc.roundedRect(M,y,R-M,10,1.6,1.6,'F');doc.setTextColor(...gold);doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(clean(t),M+5,y+6.7);doc.setTextColor(...ink);y+=15}
 function paragraph(t,size=9,color=ink,x=M,maxWidth=R-M){doc.setFont('helvetica','normal');doc.setFontSize(size);doc.setTextColor(...color);const lines=doc.splitTextToSize(clean(t),maxWidth);next(lines.length*4.5+2);doc.text(lines,x,y);y+=lines.length*4.5+3;return lines.length}
 header();doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(...navy);doc.text(clean(race.circuit||'Gran Premio'),M,y+3);y+=10;
 doc.setFontSize(10);doc.setTextColor(...gold);doc.text('LEGA '+clean(race.league)+'  /  STAGIONE 1',M,y);y+=8;
 paragraph('Decisioni dei giudici e classifica post-gara  |  Emesso il '+new Date().toLocaleDateString('it-IT'),9,muted);y+=3;
 sectionTitle('VERDETTI DELLA DIREZIONE GARA');
 if(!verdicts.length)paragraph('Nessun reclamo registrato per questa gara.');
 verdicts.forEach((v,i)=>{const title='DECISIONE '+(i+1)+'  -  '+({penalty:'PENALITA',no_action:'NESSUNA SANZIONE',warning:'RICHIAMO',pending:'IN ESAME'}[v.verdict]||v.verdict).toUpperCase();const parts=[['RECLAMANTE',label(v.complainant_driver_id)],['PILOTA ESAMINATO',label(v.accused_driver_id)],['EPISODIO',v.incident],['MOTIVAZIONE',v.reason||'Non indicata'],['SANZIONE','+'+Number(v.penalty_seconds||0)+' secondi  |  -'+Number(v.penalty_coin||0)+' COIN']];const heights=parts.map(([k,val])=>doc.splitTextToSize(clean(val),R-M-12).length*4.1+7);const cardHeight=12+heights.reduce((a,b)=>a+b,0)+3;next(Math.min(cardHeight,70));doc.setFillColor(...pale);doc.roundedRect(M,y,R-M,Math.min(cardHeight,275-y),2,2,'F');doc.setFillColor(...gold);doc.rect(M,y,2.2,10,'F');doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...navy);doc.text(clean(title),M+6,y+7);y+=14;parts.forEach(([key,value],idx)=>{const lines=doc.splitTextToSize(clean(value),R-M-12);next(lines.length*4.1+7);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(...muted);doc.text(key,M+6,y);y+=4;doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(...ink);doc.text(lines,M+6,y);y+=lines.length*4.1+3});y+=5});
 y+=2;sectionTitle('CLASSIFICA UFFICIALE POST DECISIONI');
 const rows=editorRows.filter(r=>r.driver_id);
 function tableHeader(){doc.setFillColor(...blue);doc.rect(M,y,R-M,9,'F');doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(255,255,255);doc.text('POS',M+3,y+6);doc.text('PILOTA',M+19,y+6);doc.text('TEMPO / DISTACCO',M+105,y+6);doc.text('PEN.',M+156,y+6);y+=9}
 tableHeader();
 rows.forEach((r,i)=>{const pos=r.status==='classified'?String(r.finishing_position||i+1):String(r.status||'DNF').toUpperCase();const time=r.time_display||'--';const nameText=clean(label(r.driver_id));const h=8.5;next(h+2);if(y===46)tableHeader();doc.setFillColor(...(i%2===0?pale:[255,255,255]));doc.rect(M,y,R-M,h,'F');doc.setTextColor(...ink);doc.setFont('helvetica',i<3?'bold':'normal');doc.setFontSize(8.3);doc.text(clean(pos),M+3,y+5.8);doc.text(nameText.length>39?nameText.slice(0,38)+'...':nameText,M+19,y+5.8);doc.text(clean(time),M+105,y+5.8);doc.text('+'+Number(r.penalty_seconds||0)+'s',M+156,y+5.8);y+=h});
 y+=7;sectionTitle('RIEPILOGO MULTE COIN');
 const sums=new Map();verdicts.filter(v=>v.verdict==='penalty'&&Number(v.penalty_coin)>0).forEach(v=>{const row=rows.find(r=>String(r.driver_id)===String(v.accused_driver_id));const team=(data.hydra_teams||[]).find(t=>String(t.id)===String(row?.team_id));const name=team?.name||'Scuderia non assegnata';sums.set(name,(sums.get(name)||0)+Number(v.penalty_coin))});
 if(!sums.size)paragraph('Nessuna multa COIN applicata.',9);else sums.forEach((sum,team)=>paragraph(team+'   -'+sum+' COIN',9));
 footer();
 return {blob:doc.output('blob'),filename:'HYDRA_Verdetti_'+String(race.circuit||'GP').replace(/[^a-z0-9_-]/gi,'_')+'_Lega_'+race.league+'.pdf'};
}
const pdfStatus=document.createElement('div');pdfStatus.id='hydra-pdf-download-status';pdfStatus.setAttribute('role','status');pdfStatus.style.cssText='margin:10px 0;color:#e8d5a2;font-weight:600';(document.getElementById('hydra-final-actions')||section).insertAdjacentElement('afterend',pdfStatus);
pdfDiagnostic.textContent='PDF: generatore pronto. Premi il pulsante dorato per creare il documento.';
let lastPdfUrl=null;
let pdfLoading=null;
async function ensurePdfLibrary(){
 if(window.jspdf?.jsPDF)return;
 if(pdfLoading)return pdfLoading;
 pdfLoading=(async()=>{
  const sources=['https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js','https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js'];
  for(let i=0;i<sources.length;i++){
   pdfDiagnostic.textContent='PDF: caricamento generatore ('+(i+1)+'/'+sources.length+')...';
   try{
    await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=sources[i];script.async=true;const timeout=setTimeout(()=>{script.remove();reject(new Error('Tempo scaduto'))},9000);script.onload=()=>{clearTimeout(timeout);resolve()};script.onerror=()=>{clearTimeout(timeout);reject(new Error('Fonte non raggiungibile'))};document.head.appendChild(script)});
    if(window.jspdf?.jsPDF)return;
   }catch(e){console.warn('HYDRA PDF source unavailable',sources[i],e)}
  }
  throw new Error('Libreria PDF non caricabile dalle fonti disponibili. Controlla blocchi del browser o della rete.');
 })();
 try{await pdfLoading}finally{pdfLoading=null}
}
document.addEventListener('click',async(event)=>{if(!event.target.closest('#hydra-verdict-pdf'))return;event.preventDefault();event.stopPropagation();pdfStatus.textContent='Preparazione PDF in corso...';pdfDiagnostic.textContent='PDF: preparazione in corso...';try{await ensurePdfLibrary();const result=await pdf();if(lastPdfUrl)URL.revokeObjectURL(lastPdfUrl);lastPdfUrl=URL.createObjectURL(result.blob);pdfStatus.replaceChildren();const link=document.createElement('a');link.href=lastPdfUrl;link.download=result.filename;link.textContent='⬇ Scarica PDF ufficiale ('+result.filename+')';link.style.cssText='color:#f0ca75;text-decoration:underline;font-weight:700;display:inline-block;padding:8px 0';pdfStatus.append('PDF pronto. ',link);pdfDiagnostic.textContent='PDF creato. Il collegamento per scaricarlo è sotto i pulsanti.';msg.textContent='PDF pronto per il download. Usa il collegamento sotto i pulsanti ufficiali.';link.click()}catch(e){pdfStatus.textContent='PDF non generato: '+e.message;pdfDiagnostic.textContent='PDF non generato: '+e.message;msg.textContent='PDF non generato: '+e.message;console.error('HYDRA PDF generation',e)}},true);
})();