/* HYDRA 4.2.1.15 — race editor visual + sortable cards; official save RPC unchanged. */
(()=>{
'use strict';
const root=document.getElementById('admin-race-rows');
if(!root||typeof drawRaceEditor!=='function')return;
const originalDraw=drawRaceEditor;
const colors=[[/ferrari/i,'#e42d38'],[/mercedes/i,'#21c8ae'],[/red bull/i,'#3675dd'],[/mclaren/i,'#ff9125'],[/alpine/i,'#f47db5'],[/aston martin/i,'#279e78'],[/haas/i,'#a9b0bb'],[/williams/i,'#36a4f1'],[/racing bulls|visa cash/i,'#6c83e9'],[/audi/i,'#c6c6c6'],[/cadillac/i,'#d0a95d']];
function teamColor(id){const team=(data.hydra_teams||[]).find(t=>String(t.id)===String(id));if(!team)return '#7b8797';return (colors.find(([rx])=>rx.test(team.name))||[])[1]||'#7b8797'}
function syncPositions(){editorRows.forEach((r,i)=>{r.finishing_position=r.status==='classified'?i+1:null})}
function move(from,to){if(from<0||to<0||from>=editorRows.length||to>=editorRows.length||from===to)return;const [row]=editorRows.splice(from,1);editorRows.splice(to,0,row);syncPositions();drawRaceEditor()}
function decorate(){
 const rows=[...root.querySelectorAll('.race-edit-row')];
 rows.forEach((node,i)=>{
  const row=editorRows[i];if(!row)return;
  node.classList.add('hydra-sortable-row');node.style.setProperty('--team-accent',teamColor(row.team_id));
  const position=node.querySelector('[data-field="finishing_position"]');if(position){position.value=row.status==='classified'?i+1:'';position.closest('label')?.remove()}
  node.querySelector('[data-field="notes"]')?.closest('label')?.remove();
  const span=node.querySelector(':scope > span');if(span){span.textContent=`P${i+1}`;span.classList.add('hydra-position-badge')}
  const grip=document.createElement('button');grip.type='button';grip.className='hydra-drag-grip';grip.textContent='⠿';grip.title='Trascina per cambiare posizione';grip.setAttribute('aria-label',`Trascina pilota dalla posizione ${i+1}`);grip.draggable=true;
  node.insertBefore(grip,node.firstChild);
  grip.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(i));e.dataTransfer.effectAllowed='move';node.classList.add('hydra-dragging')});
  grip.addEventListener('dragend',()=>node.classList.remove('hydra-dragging'));
  node.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move';node.classList.add('hydra-drop-target')});
  node.addEventListener('dragleave',()=>node.classList.remove('hydra-drop-target'));
  node.addEventListener('drop',e=>{e.preventDefault();node.classList.remove('hydra-drop-target');const from=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(from))move(from,i)});
  const controls=document.createElement('div');controls.className='hydra-move-controls';
  for(const [label,delta] of [['↑',-1],['↓',1]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.title=`Sposta ${delta<0?'su':'giù'}`;b.disabled=i+delta<0||i+delta>=rows.length;b.onclick=()=>move(i,i+delta);controls.appendChild(b)}
  node.insertBefore(controls,node.querySelector('.race-remove'));
  const checkbox=node.querySelector('[data-field="fastest_lap"]');if(checkbox){
   const label=checkbox.closest('label');label.classList.add('hydra-lap-label');
   const button=document.createElement('button');button.type='button';button.className='hydra-lap-button'+(checkbox.checked?' active':'');button.textContent=checkbox.checked?'⚡ Giro veloce ✓':'⚡ Giro veloce';button.setAttribute('aria-pressed',String(checkbox.checked));
   button.onclick=()=>{const checked=!checkbox.checked;if(checked){editorRows.forEach((r,j)=>{if(j!==i)r.fastest_lap=false})}row.fastest_lap=checked;drawRaceEditor()};
   label.replaceChildren(button,checkbox);checkbox.classList.add('hydra-hidden-checkbox');checkbox.tabIndex=-1;
  }
  const status=node.querySelector('[data-field="status"]');if(status){status.addEventListener('change',()=>{queueMicrotask(()=>{syncPositions();drawRaceEditor()})})}
  const team=node.querySelector('[data-field="team_id"]');if(team){team.addEventListener('change',()=>{queueMicrotask(()=>node.style.setProperty('--team-accent',teamColor(team.value)))})}
 });
}
drawRaceEditor=function(){originalDraw();syncPositions();decorate()};
// Existing race selection and add/remove callbacks resolve drawRaceEditor at call time.
const save=document.getElementById('admin-save-race');
save?.addEventListener('click',()=>{syncPositions()},true);
if(root.children.length)drawRaceEditor();
})();
