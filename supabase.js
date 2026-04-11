// ============================================
// EDUMANAGER — Configuration Supabase
// ============================================
const SUPABASE_URL = 'https://rcojerlzguwqpclyudjo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjb2plcmx6Z3V3cXBjbHl1ZGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTg1MzIsImV4cCI6MjA5MTAzNDUzMn0.4R_NOrYLdhkVMKw87Z33FLS9LoAUAgVj_Uk_RBCf8tg';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// SYSTÈME DE TOAST GLOBAL
// ============================================
(function initToastSystem() {
  const style = document.createElement('style');
  style.textContent = `
    #toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      max-width: 340px;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      pointer-events: all;
      animation: toastIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards;
      max-width: 340px;
      line-height: 1.4;
    }
    .toast.out {
      animation: toastOut 0.2s ease forwards;
    }
    .toast-ok   { background:#fff; border-left: 3px solid #1A8B5A; color: #0d5c3b; }
    .toast-err  { background:#fff; border-left: 3px solid #C0392B; color: #7a1f1f; }
    .toast-info { background:#fff; border-left: 3px solid #1B5FA6; color: #0c3d73; }
    .toast-warn { background:#fff; border-left: 3px solid #D4700A; color: #7a3e06; }
    .toast-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
    .toast-close { margin-left: auto; cursor: pointer; opacity: 0.5; font-size: 14px; padding: 0 2px; background:none; border:none; flex-shrink:0; }
    .toast-close:hover { opacity: 1; }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(24px) scale(0.96); }
      to   { opacity: 1; transform: translateX(0)    scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateX(0) scale(1); max-height: 80px; margin-bottom: 0; }
      to   { opacity: 0; transform: translateX(20px) scale(0.95); max-height: 0; padding: 0; margin: 0; }
    }
    @media (max-width: 480px) {
      #toast-container { top: 12px; right: 12px; left: 12px; max-width: none; }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'toast-container';
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(container);
  });
  // Fallback si DOMContentLoaded déjà passé
  if (document.body) document.body.appendChild(container);
})();

/**
 * Affiche un toast de notification.
 * @param {string} msg   - Message à afficher
 * @param {'ok'|'err'|'info'|'warn'} type - Type de notification
 * @param {number} duration - Durée en ms (0 = permanent)
 */
function toast(msg, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { ok: '✅', err: '❌', info: 'ℹ️', warn: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span style="flex:1">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(t);

  if (duration > 0) {
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 220);
    }, duration);
  }

  return t;
}

// Alias pratiques
const toastOk   = (msg, d) => toast(msg, 'ok', d);
const toastErr  = (msg, d) => toast(msg, 'err', d);
const toastInfo = (msg, d) => toast(msg, 'info', d);
const toastWarn = (msg, d) => toast(msg, 'warn', d);

// ============================================
// UTILITAIRES GLOBAUX
// ============================================

async function getUtilisateur() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from('utilisateurs').select('*, ecoles(*)').eq('id', user.id).maybeSingle();
  return data;
}

function validerMotDePasse(mdp) {
  const erreurs = [];
  if (mdp.length < 8) erreurs.push('Au moins 8 caractères requis');
  if (!/[A-Z]/.test(mdp)) erreurs.push('Au moins une lettre majuscule requise');
  if (!/[0-9]/.test(mdp)) erreurs.push('Au moins un chiffre requis');
  if (!/[^A-Za-z0-9]/.test(mdp)) erreurs.push('Au moins un symbole requis (!@#$...)');
  return erreurs;
}

function genererCode(nom) {
  const ini = nom.split(' ').map(m => m[0]).join('').toUpperCase().substring(0, 3);
  const annee = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `${ini}-${annee}-${rand}`;
}

function genererEmail(matricule, code) {
  const mat = matricule.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const c = (code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return mat + '@' + c + '.gn';
}

function genererMotDePasse(matricule) {
  const lettres = matricule.replace(/-/g, '').substring(0, 3).toUpperCase();
  const chiffres = Math.floor(1000 + Math.random() * 9000);
  const symboles = ['@', '#', '$', '!', '%', '&'][Math.floor(Math.random() * 6)];
  const minuscule = matricule.replace(/-/g, '').substring(3, 5).toLowerCase();
  return lettres + chiffres + symboles + minuscule;
}

function genererMatriculeEleve(code, annee, seq) {
  const c = (code || 'ECO').split('-')[0].substring(0, 3).toUpperCase();
  const a = String(annee || new Date().getFullYear()).slice(-2);
  return `ELV-${c}-${a}-${String(seq).padStart(4, '0')}`;
}

function genererMatriculePersonne(nom, sexe, dateNaissance, seq) {
  var nomClean = (nom || 'XX').replace(/[^a-zA-Z]/g, '').toUpperCase();
  var prefix = (nomClean + 'XX').substring(0, 2);
  var genre = (sexe === 'F' || sexe === 'f') ? '1' : '2';
  var code = 'XXXX';
  if (dateNaissance) {
    var d = new Date(dateNaissance);
    var jour = d.getDate();
    var mois = d.getMonth() + 1;
    var annee = d.getFullYear() % 100;
    var charset = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    var c1 = charset[(jour * 3) % 34];
    var c2 = charset[(mois + jour) % 34];
    var c3 = charset[(annee * 7) % 34];
    var c4 = charset[((jour + mois) * 5) % 34];
    code = '' + c1 + c2 + c3 + c4;
  }
  var sequence = String(seq || 1).padStart(4, '0');
  return prefix + genre + code + sequence;
}

function genererMatriculeProfesseur(nom, sexe, dateNaissance, seq) {
  return genererMatriculePersonne(nom, sexe, dateNaissance, seq);
}

function genererMatriculeParent(nom, sexe, dateNaissance, seq) {
  return genererMatriculePersonne(nom, sexe, dateNaissance, seq);
}

async function validerPaiement(paiementId, adminId, ecoleId, plan) {
  const limites = {
    standard: { max_admins: 2, max_eleves: 500 },
    premium:  { max_admins: 4, max_eleves: 999999 }
  };
  await db.from('paiements').update({
    statut: 'valide', valide_par: adminId, valide_le: new Date().toISOString()
  }).eq('id', paiementId);
  await db.from('ecoles').update({
    plan, abonnement_actif: true,
    plan_expire_le: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ...limites[plan]
  }).eq('id', ecoleId);
}

async function creerCompteAuth(emailInterne, mdpTemp) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body: JSON.stringify({ email: emailInterne, password: mdpTemp })
    });
    return await res.json();
  } catch (e) {
    console.error('Erreur création compte:', e);
    return null;
  }
}

// ============================================
// GESTION SIDEBAR MOBILE (standard)
// ============================================
function initSidebarMobile() {
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.querySelector('.sidebar');
  const overlay   = document.getElementById('sidebar-overlay');

  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('active');
  }
  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
  }

  if (hamburger) hamburger.addEventListener('click', () => {
    sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  if (overlay) overlay.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  // Exposer globalement pour les onclick inline existants
  window.toggleSidebar = () => sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
  window.closeSidebar  = closeSidebar;
}

// ============================================
// CONFIRMATION AVANT SUPPRESSION
// ============================================
function confirmer(msg) {
  return window.confirm(msg);
}

// ============================================
// FORMAT DATE FR
// ============================================
function dateFR(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ============================================
// NOTE COLOR
// ============================================
function noteColor(val) {
  const n = Number(val);
  if (isNaN(n)) return '';
  return n >= 14 ? 'note-high' : n >= 10 ? 'note-mid' : 'note-low';
}

console.log('✅ EduManager Supabase connecté');
