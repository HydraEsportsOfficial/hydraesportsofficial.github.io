'use strict';
// Hydra 4.2.1.18 — Login with username only; Supabase Auth remains authoritative.
// The internal account identifier is not a mailbox and is never requested from the user.
(() => {
  const POTEC_EMAIL = 'potec@accounts.hydra.invalid';
  const form = document.getElementById('login-form');
  if (!form) return;
  const originalLogin = form.onsubmit;
  form.onsubmit = async function(e) {
    const username = document.getElementById('login-name').value.trim();
    if (username.toLowerCase() !== 'potec') return originalLogin.call(this, e);
    e.preventDefault();
    const password = document.getElementById('login-password').value;
    try {
      const r = await request('/auth/v1/token?grant_type=password', {
        method: 'POST', body: JSON.stringify({email:POTEC_EMAIL, password})
      });
      token = r.access_token;
      sessionStorage.setItem('hydra_session', JSON.stringify({access_token:r.access_token,refresh_token:r.refresh_token}));
      document.getElementById('login-password').value = '';
      await checkAdmin();
      if (token) document.getElementById('admin-welcome').textContent = 'Accesso amministratore attivo · Potec';
    } catch(err) {
      token = null;
      sessionStorage.removeItem('hydra_session');
      alert('Accesso non riuscito: ' + err.message);
    }
  };

  const adminBox = document.getElementById('admin-box');
  if (!adminBox) return;
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.id = 'hydra-potec-setup';
  panel.style.cssText = 'margin:20px 0;padding:18px;border:1px solid #4a6280;border-radius:12px';
  panel.innerHTML = '<h3>Secondo amministratore · Potec</h3>' +
    '<p class="muted">Da eseguire una sola volta, mentre sei connesso come Admin principale. Non serve alcuna email.</p>' +
    '<form id="hydra-potec-create-form" style="display:flex;gap:10px;align-items:end;flex-wrap:wrap">' +
    '<label class="field" style="flex:1;min-width:180px">Password di Potec<input type="password" id="hydra-potec-password" required minlength="8" autocomplete="new-password" placeholder="Password scelta per Potec"></label>' +
    '<button type="submit" class="btn">Crea Potec</button></form>' +
    '<p id="hydra-potec-message" role="status" aria-live="polite"></p>';
  adminBox.appendChild(panel);
  panel.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const pass = document.getElementById('hydra-potec-password');
    const msg = document.getElementById('hydra-potec-message');
    const btn = panel.querySelector('button');
    btn.disabled = true;
    msg.textContent = 'Creazione in corso…';
    try {
      const response = await fetch(URL_BASE + '/functions/v1/hydra-create-potec', {
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':PUBLIC_KEY,'Authorization':'Bearer '+token},
        body:JSON.stringify({password:pass.value})
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Errore '+response.status);
      pass.value = '';
      msg.textContent = '✓ ' + result.message + '. Potec può ora accedere con il suo username.';
      panel.querySelector('form').hidden = true;
    } catch(err) {
      msg.textContent = 'Errore: ' + err.message;
    } finally { btn.disabled = false; }
  });
})();
