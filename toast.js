// ============================================
// EDUMANAGER — Système de notifications Toast
// ============================================
(function () {
  const style = document.createElement('style');
  style.textContent = `
    #toast-container {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      max-width: 340px;
    }
    .toast-notif {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      box-shadow: 0 4px 20px rgba(0,0,0,0.13);
      pointer-events: all;
      animation: toastIn .25s cubic-bezier(.34,1.56,.64,1) forwards;
      max-width: 340px;
      line-height: 1.45;
      background: #fff;
      border-left: 3px solid #ccc;
    }
    .toast-notif.out {
      animation: toastOut .2s ease forwards;
    }
    .toast-ok   { border-left-color: #1A8B5A; color: #0d5c3b; }
    .toast-err  { border-left-color: #C0392B; color: #7a1f1f; }
    .toast-info { border-left-color: #1B5FA6; color: #0c3d73; }
    .toast-warn { border-left-color: #D4700A; color: #7a3e06; }
    .toast-notif-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
    .toast-notif-body { flex: 1; word-break: break-word; }
    .toast-notif-close {
      cursor: pointer; opacity: .45; font-size: 14px;
      background: none; border: none; flex-shrink: 0;
      padding: 0 2px; line-height: 1; margin-top: 2px;
    }
    .toast-notif-close:hover { opacity: 1; }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(20px) scale(.96); }
      to   { opacity: 1; transform: translateX(0)    scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; max-height: 100px; padding: 12px 16px; margin-bottom: 0; }
      to   { opacity: 0; max-height: 0;     padding: 0;          margin-bottom: -8px; transform: translateX(12px); }
    }
    @media (max-width: 480px) {
      #toast-container { top:10px; right:10px; left:10px; max-width:none; }
      .toast-notif { max-width: none; }
    }
  `;
  document.head.appendChild(style);

  function getContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      (document.body || document.documentElement).appendChild(c);
    }
    return c;
  }

  window.toast = function (msg, type, duration) {
    type     = type     || 'info';
    duration = (duration === undefined) ? 4000 : duration;
    const icons = { ok:'✅', err:'❌', info:'ℹ️', warn:'⚠️' };
    const t = document.createElement('div');
    t.className = 'toast-notif toast-' + type;
    t.innerHTML =
      '<span class="toast-notif-icon">' + (icons[type] || 'ℹ️') + '</span>' +
      '<span class="toast-notif-body">' + msg + '</span>' +
      '<button class="toast-notif-close" onclick="this.parentElement.remove()">✕</button>';
    getContainer().appendChild(t);
    if (duration > 0) {
      setTimeout(function () {
        t.classList.add('out');
        setTimeout(function () { t.remove(); }, 220);
      }, duration);
    }
    return t;
  };

  window.toastOk   = function (m, d) { return window.toast(m, 'ok',   d); };
  window.toastErr  = function (m, d) { return window.toast(m, 'err',  d); };
  window.toastInfo = function (m, d) { return window.toast(m, 'info', d); };
  window.toastWarn = function (m, d) { return window.toast(m, 'warn', d); };

  // Afficher les identifiants de connexion dans un joli modal toast
  window.afficherIdentifiants = function (nom, mat, mdp, role) {
    var roleLabel = role === 'eleve' ? 'à l\'élève' : role === 'professeur' ? 'au professeur' : 'au parent';
    var t = window.toast(
      '<strong>' + nom + ' ajouté(e) avec succès !</strong><br>' +
      '<div style="margin-top:8px;padding:8px 10px;background:#f9f9f9;border-radius:6px;font-family:monospace;font-size:12px;line-height:1.8">' +
      '📋 Matricule : <strong>' + mat + '</strong><br>' +
      '🔑 Mot de passe : <strong>' + mdp + '</strong>' +
      '</div>' +
      '<div style="font-size:11px;color:#888;margin-top:6px">Donnez ces identifiants ' + roleLabel + '. Il devra changer son mot de passe à la première connexion.</div>',
      'ok',
      0
    );
    return t;
  };
})();
