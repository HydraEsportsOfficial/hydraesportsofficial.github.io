'use strict';
// Hydra 4.2.1.20: dedicated account tab and future pilot accounts.
(() => {
  const PRIMARY_EMAIL = 'hydra1esports@gmail.com';
  const BASE = 'https://wgjdhdssiveqedluktwi.supabase.co';
  const FN = BASE + '/functions/v1/hydra-manage-admins';
  const form = document.getElementById('login-form');
  if (!form) return;
  const usernamePattern = /^[A-Za-z][A-Za-z0-9_-]{2,31}$/;
  const internalEmail = name => name.toLowerCase() + '@accounts.hydra.invalid';
  const nameInput = document.getElementById('login-name');
  const passwordInput = document.getElementById('login-password');
  nameInput.value = '';
  nameInput.placeholder = 'Inserisci username';
  nameInput.autocomplete = 'off';
  passwordInput.value = '';
  form.onsubmit = async function(e) {
    e.preventDefault();
    const username = nameInput.value.trim();
    if (!usernamePattern.test(username)) { alert('Username non valido'); return; }
    const email = username.toLowerCase() === 'blazerevolution' ? PRIMARY_EMAIL : internalEmail(username);
    try {
      const r = await request('/auth/v1/token?grant_type=password', {
        method:'POST', body:JSON.stringify({email, password:passwordInput.value})
      });
      token = r.access_token;
      sessionStorage.setItem('hydra_session',JSON.stringify({access_token:r.access_token,refresh_token:r.refresh_token}));
      passwordInput.value = '';
      nameInput.value = '';
      await checkAdmin();
    } catch (err) {
      token = null;
      sessionStorage.removeItem('hydra_session');
      alert('Accesso non riuscito: ' + err.message);
    }
  };
  const adminBox = document.getElementById('admin-box');
  const accountTab = document.getElementById('hydra-accounts-tab');
  const accountPanel = document.getElementById('hydra-accounts-panel');
  if (!adminBox) return;
  const panel = document.createElement('section');
  panel.id = 'hydra-admin-users';
  panel.className = 'panel';
  panel.hidden = true;
  panel.style.cssText = 'margin:20px 0;padding:18px;border:1px solid #4a6280;border-radius:12px';
  panel.innerHTML = `<h3>Gestione account</h3>
    <p class="muted">Solo BlazeRevolution può gestire gli account. Gli amministratori gestiscono il campionato; gli utenti semplici sono predisposti per la futura Area Piloti e per ora non hanno accesso all'Area Admin.</p>
    <form id="hydra-add-admin" style="display:flex;flex-wrap:wrap;align-items:end;gap:10px">
      <label class="field" style="flex:1;min-width:150px">Username<input name="username" required minlength="3" maxlength="32" pattern="[A-Za-z][A-Za-z0-9_-]{2,31}" autocomplete="off" placeholder="Es. Potec"></label>
      <label class="field" style="flex:1;min-width:180px">Password iniziale<input name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Minimo 8 caratteri"></label>
      <label class="field" style="min-width:155px">Tipo di account<select name="role" required><option value="admin">Amministratore</option><option value="user">Utente semplice</option></select></label>
      <button class="btn" type="submit">Crea account</button>
    </form>
    <p id="hydra-admin-users-message" role="status" aria-live="polite"></p>
    <div id="hydra-admin-users-list" style="display:grid;gap:10px;margin-top:14px"></div>`;
  accountPanel.appendChild(panel);
  // Remove the one-off Potec form introduced in 4.2.1.18, if it exists.
  document.getElementById('hydra-potec-setup')?.remove();
  const msg = panel.querySelector('#hydra-admin-users-message');
  const list = panel.querySelector('#hydra-admin-users-list');
  async function api(action, payload={}) {
    const response = await fetch(FN, {
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':PUBLIC_KEY,'Authorization':'Bearer '+token},
      body:JSON.stringify({action,...payload})
    });
    let result;
    try { result = await response.json(); } catch { throw Error('Risposta non valida dal server'); }
    if (!response.ok) throw Error(result.message || 'Errore '+response.status);
    return result;
  }
  function el(tag, text, className) {
    const x = document.createElement(tag);
    if (text != null) x.textContent = text;
    if (className) x.className = className;
    return x;
  }
  async function refresh() {
    const result = await api('list');
    list.replaceChildren();
    if (!result.users.length) list.appendChild(el('p','Nessun account aggiuntivo.','muted'));
    for (const user of result.users) {
      const row = el('div');
      row.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px;background:#0b1b30;border-radius:9px';
      const name = el('strong',user.username + ' · ' + (user.role === 'admin' ? 'Amministratore' : 'Utente semplice') + (user.disabled?' · Disattivato':' · Attivo'));
      name.style.cssText='flex:1;min-width:130px';
      row.appendChild(name);
      const reset = el('button','Reimposta password','btn');reset.type='button';
      reset.onclick = async () => {
        const password = prompt('Nuova password per '+user.username+' (almeno 8 caratteri)');
        if (password === null) return;
        if (password.length < 8) { msg.textContent='La password deve contenere almeno 8 caratteri.'; return; }
        try { await api('reset',{username:user.username,password}); msg.textContent='Password aggiornata per '+user.username; }
        catch(err){msg.textContent='Errore: '+err.message;}
      };
      const toggle = el('button',user.disabled?'Riattiva':'Disattiva','btn');toggle.type='button';
      toggle.onclick=async()=>{
        if(!confirm((user.disabled?'Riattivare ':'Disattivare ')+user.username+'?'))return;
        try{await api(user.disabled?'enable':'disable',{username:user.username});msg.textContent='Account aggiornato';await refresh();}
        catch(err){msg.textContent='Errore: '+err.message;}
      };
      const del = el('button','Elimina','btn');del.type='button';
      del.onclick=async()=>{
        if(prompt('Per eliminare '+user.username+', scrivi esattamente il suo username')!==user.username)return;
        try{await api('delete',{username:user.username});msg.textContent='Account eliminato';await refresh();}
        catch(err){msg.textContent='Errore: '+err.message;}
      };
      row.append(reset,toggle,del);list.appendChild(row);
    }
  }
  panel.querySelector('#hydra-add-admin').addEventListener('submit',async e=>{
    e.preventDefault();const f=e.currentTarget,btn=f.querySelector('button');
    btn.disabled=true;msg.textContent='Creazione in corso…';
    try {
      const username=f.elements.username.value.trim();
      const password=f.elements.password.value;
      const role=f.elements.role.value;
      const result=await api('create',{username,password,role});
      f.reset();msg.textContent=result.message;await refresh();
    } catch(err){msg.textContent='Errore: '+err.message;}
    finally{btn.disabled=false;}
  });

  // Owner-only visual preview. The preview files are public repository assets;
  // this is not server-side access control and is intended only for UI testing.
  const testButton=document.createElement('button');
  testButton.type='button';
  testButton.className='btn';
  testButton.textContent='◈ Ambiente di test';
  testButton.hidden=true;
  testButton.style.cssText='margin:12px 0;border:1px solid #c5a46d;color:#e9c675';
  adminBox.insertBefore(testButton,adminBox.firstChild);
  const testOverlay=document.createElement('div');
  testOverlay.hidden=true;
  testOverlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#071323;display:none;flex-direction:column';
  testOverlay.innerHTML='<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:#102c59;color:#e9c675;font:600 14px system-ui"><strong style="flex:1">HYDRA · AMBIENTE TEST</strong><span>Anteprima grafica · sola lettura</span><button type="button" style="background:#c5a46d;color:#071323;border:0;padding:9px 14px;border-radius:7px;font-weight:700">✕ Chiudi</button></div><iframe title="Anteprima Hydra Web TEST" sandbox="allow-scripts allow-forms allow-same-origin" style="flex:1;width:100%;border:0;background:#071323"></iframe>';
  document.body.appendChild(testOverlay);
  const testFrame=testOverlay.querySelector('iframe');
  const testClose=testOverlay.querySelector('button');
  const testRoot='https://cdn.jsdelivr.net/gh/HydraEsportsOfficial/hydraesportsofficial.github.io@d14e73e99c68d0c6d111ef8c655216b552aa92ae/';
  testClose.onclick=()=>{testOverlay.hidden=true;testOverlay.style.display='none';testFrame.removeAttribute('srcdoc');};
  testButton.onclick=async()=>{
    testOverlay.hidden=false;testOverlay.style.display='flex';
    testFrame.srcdoc='<p style="font:16px system-ui;color:white;padding:24px">Caricamento anteprima…</p>';
    try{
      const response=await fetch(testRoot+'index.html',{cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      let html=await response.text();
      html=html.replace(/<head([^>]*)>/i,'<head$1><base href="'+testRoot+'">');
      testFrame.srcdoc=html;
    }catch(err){testFrame.srcdoc='<p style="font:16px system-ui;color:white;padding:24px">Anteprima non disponibile: '+String(err.message).replace(/[&<>"']/g,'')+'</p>';}
  };
  const previousCheck=checkAdmin;
  checkAdmin=async function(...args){
    await previousCheck(...args);
    panel.hidden=true;
    accountTab.hidden=true;
    testButton.hidden=true;
    if (!token) return;
    try {
      const user=await request('/auth/v1/user');
      const email=(user.email||'').toLowerCase();
      const display=email===PRIMARY_EMAIL?'BlazeRevolution':email.endsWith('@accounts.hydra.invalid')?(user.app_metadata?.hydra_username || email.split('@')[0]):'Amministratore';
      document.getElementById('admin-welcome').textContent='Accesso amministratore attivo · '+display;
      const isOwner=email===PRIMARY_EMAIL;
      testButton.hidden=!isOwner;
      accountTab.hidden=!isOwner;
      panel.hidden=!isOwner;
      if (isOwner) await refresh();
    } catch(err){ if(!accountTab.hidden)msg.textContent='Errore caricamento account: '+err.message; }
  };
  if (token) checkAdmin();
})();
