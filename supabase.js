// ============================================
// EDUMANAGER — Configuration Supabase
// VERSION EXPERTE STABLE
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
      background: #fff;
    }
    .toast.out {
      animation: toastOut 0.2s ease forwards;
    }
    .toast-ok   { border-left: 3px solid #1A8B5A; color: #0d5c3b; }
    .toast-err  { border-left: 3px solid #C0392B; color: #7a1f1f; }
    .toast-info { border-left: 3px solid #1B5FA6; color: #0c3d73; }
    .toast-warn { border-left: 3px solid #D4700A; color: #7a3e06; }
    .toast-icon {
      font-size: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .toast-close {
      margin-left: auto;
      cursor: pointer;
      opacity: 0.5;
      font-size: 14px;
      padding: 0 2px;
      background: none;
      border: none;
      flex-shrink: 0;
    }
    .toast-close:hover {
      opacity: 1;
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(24px) scale(0.96); }
      to   { opacity: 1; transform: translateX(0) scale(1); }
    }
    @keyframes toastOut {
      from { opacity: 1; transform: translateX(0) scale(1); max-height: 80px; margin-bottom: 0; }
      to   { opacity: 0; transform: translateX(20px) scale(0.95); max-height: 0; padding: 0; margin: 0; }
    }
    @media (max-width: 480px) {
      #toast-container {
        top: 12px;
        right: 12px;
        left: 12px;
        max-width: none;
      }
    }
  `;
  document.head.appendChild(style);

  function appendContainer() {
    if (!document.getElementById('toast-container') && document.body) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendContainer);
  } else {
    appendContainer();
  }
})();

/**
 * Affiche un toast de notification.
 * @param {string} msg
 * @param {'ok'|'err'|'info'|'warn'} type
 * @param {number} duration
 */
function toast(msg, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return null;

  const icons = {
    ok: '✅',
    err: '❌',
    info: 'ℹ️',
    warn: '⚠️'
  };

  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span style="flex:1">${msg}</span>
    <button class="toast-close" type="button">✕</button>
  `;

  const closeBtn = t.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      if (t.parentNode) t.remove();
    });
  }

  container.appendChild(t);

  if (duration > 0) {
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => {
        if (t.parentNode) t.remove();
      }, 220);
    }, duration);
  }

  return t;
}

const toastOk   = (msg, d) => toast(msg, 'ok', d);
const toastErr  = (msg, d) => toast(msg, 'err', d);
const toastInfo = (msg, d) => toast(msg, 'info', d);
const toastWarn = (msg, d) => toast(msg, 'warn', d);

// ============================================
// UTILITAIRES SESSION / PROFIL
// ============================================

async function getCurrentAuthUser() {
  try {
    const { data, error } = await db.auth.getUser();
    if (error || !data || !data.user) return null;
    return data.user;
  } catch (e) {
    console.error('Erreur getCurrentAuthUser:', e);
    return null;
  }
}

async function getUtilisateur() {
  try {
    const user = await getCurrentAuthUser();
    if (!user) return null;

    // 1) Recherche par id
    let res = await db
      .from('utilisateurs')
      .select('*, ecoles(*)')
      .eq('id', user.id)
      .maybeSingle();

    if (res.data) return res.data;

    // 2) Fallback par auth_id
    res = await db
      .from('utilisateurs')
      .select('*, ecoles(*)')
      .eq('auth_id', user.id)
      .maybeSingle();

    if (res.data) return res.data;

    return null;
  } catch (e) {
    console.error('Erreur getUtilisateur:', e);
    return null;
  }
}

async function requireAuth(roleAttendu = null, redirectTo = 'index.html') {
  const utilisateur = await getUtilisateur();

  if (!utilisateur) {
    window.location.href = redirectTo;
    return null;
  }

  if (roleAttendu && utilisateur.role !== roleAttendu) {
    toastErr('Accès refusé.');
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 800);
    return null;
  }

  return utilisateur;
}

async function logout() {
  try {
    await db.auth.signOut();
  } catch (e) {
    console.error('Erreur logout:', e);
  }
  window.location.href = 'index.html';
}

// ============================================
// VALIDATION MOT DE PASSE
// ============================================

function validerMotDePasse(mdp) {
  const erreurs = [];

  if (!mdp || mdp.length < 8) {
    erreurs.push('Au moins 8 caractères requis');
  }
  if (!/[A-Z]/.test(mdp || '')) {
    erreurs.push('Au moins une lettre majuscule requise');
  }
  if (!/[0-9]/.test(mdp || '')) {
    erreurs.push('Au moins un chiffre requis');
  }
  if (!/[^A-Za-z0-9]/.test(mdp || '')) {
    erreurs.push('Au moins un symbole requis (!@#$...)');
  }

  return erreurs;
}

// ============================================
// GÉNÉRATION CODES / EMAILS / MOTS DE PASSE
// ============================================

function genererCode(nom) {
  const baseNom = String(nom || '').trim();
  const ini = baseNom
    .split(' ')
    .filter(Boolean)
    .map(m => m[0])
    .join('')
    .toUpperCase()
    .substring(0, 3) || 'ECO';

  const annee = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 999).toString().padStart(3, '0');

  return `${ini}-${annee}-${rand}`;
}

function genererEmail(matricule, code) {
  const mat = String(matricule || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const c = String(code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return mat + '@' + c + '.gn';
}

function genererMotDePasse(matricule) {
  const source = String(matricule || 'USER001');
  const lettres = source.replace(/-/g, '').substring(0, 3).toUpperCase() || 'EDU';
  const chiffres = Math.floor(1000 + Math.random() * 9000);
  const symboles = ['@', '#', '$', '!', '%', '&'][Math.floor(Math.random() * 6)];
  const minuscule = source.replace(/-/g, '').substring(3, 5).toLowerCase() || 'xx';
  return lettres + chiffres + symboles + minuscule;
}

function genererMatriculeEleve(code, annee, seq) {
  const c = (String(code || 'ECO').split('-')[0] || 'ECO').substring(0, 3).toUpperCase();
  const a = String(annee || new Date().getFullYear()).slice(-2);
  return `ELV-${c}-${a}-${String(seq || 1).padStart(4, '0')}`;
}

function genererMatriculePersonne(nom, sexe, dateNaissance, seq) {
  const nomClean = String(nom || 'XX').replace(/[^a-zA-Z]/g, '').toUpperCase();
  const prefix = (nomClean + 'XX').substring(0, 2);
  const genre = (sexe === 'F' || sexe === 'f') ? '1' : '2';

  let code = 'XXXX';

  if (dateNaissance) {
    const d = new Date(dateNaissance);
    if (!isNaN(d.getTime())) {
      const jour = d.getDate();
      const mois = d.getMonth() + 1;
      const annee = d.getFullYear() % 100;
      const charset = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

      const c1 = charset[(jour * 3) % 34];
      const c2 = charset[(mois + jour) % 34];
      const c3 = charset[(annee * 7) % 34];
      const c4 = charset[((jour + mois) * 5) % 34];
      code = '' + c1 + c2 + c3 + c4;
    }
  }

  const sequence = String(seq || 1).padStart(4, '0');
  return prefix + genre + code + sequence;
}

function genererMatriculeProfesseur(nom, sexe, dateNaissance, seq) {
  return genererMatriculePersonne(nom, sexe, dateNaissance, seq);
}

function genererMatriculeParent(nom, sexe, dateNaissance, seq) {
  return genererMatriculePersonne(nom, sexe, dateNaissance, seq);
}

// ============================================
// PAIEMENTS / PLANS
// ============================================

async function validerPaiement(paiementId, adminId, ecoleId, plan) {
  const limites = {
    standard: { max_admins: 2, max_eleves: 500 },
    premium: { max_admins: 4, max_eleves: 999999 }
  };

  const infosPlan = limites[plan] || limites.standard;

  await db.from('paiements').update({
    statut: 'valide',
    valide_par: adminId,
    valide_le: new Date().toISOString()
  }).eq('id', paiementId);

  await db.from('ecoles').update({
    plan: plan,
    abonnement_actif: true,
    plan_expire_le: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    max_admins: infosPlan.max_admins,
    max_eleves: infosPlan.max_eleves
  }).eq('id', ecoleId);
}

// ============================================
// CRÉATION DE COMPTE AUTH
// ============================================

/*
PRIORITÉ :
1. Appeler l'Edge Function create-school-user
2. Fallback temporaire vers /auth/v1/signup si la fonction n'existe pas encore

IMPORTANT :
- Le fallback peut créer des comptes non confirmés
- Donc pour la première connexion fiable, il faut mettre en place l'Edge Function
*/
async function creerCompteAuth(emailInterne, mdpTemp, role = 'membre') {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-school-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      body: JSON.stringify({
        email: emailInterne,
        password: mdpTemp,
        user_metadata: {
          role: role
        }
      })
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json) {
      return {
        user: json.user || null,
        data: json,
        via: 'edge-function'
      };
    }

    console.warn('Edge Function indisponible ou en erreur, fallback signup utilisé.', json);

    const fallbackRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY
      },
      body: JSON.stringify({
        email: emailInterne,
        password: mdpTemp
      })
    });

    const fallbackJson = await fallbackRes.json().catch(() => ({}));

    if (!fallbackRes.ok) {
      return {
        error:
          fallbackJson?.msg ||
          fallbackJson?.message ||
          fallbackJson?.error_description ||
          fallbackJson?.error ||
          'Erreur de création du compte Auth'
      };
    }

    return {
      user: fallbackJson.user || null,
      data: fallbackJson,
      via: 'signup-fallback',
      warning: 'Compte créé via fallback. La première connexion peut échouer si email non confirmé.'
    };
  } catch (e) {
    console.error('Erreur creerCompteAuth:', e);
    return {
      error: e.message || 'Erreur réseau lors de la création du compte'
    };
  }
}

// Alias de compatibilité
async function createUserViaEdge(email, password, role) {
  return await creerCompteAuth(email, password, role);
}

// ============================================
// MISE À JOUR MOT DE PASSE UTILISATEUR CONNECTÉ
// ============================================

async function updatePassword(newPassword) {
  try {
    const { error } = await db.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (e) {
    return { error: e.message || 'Erreur mise à jour mot de passe' };
  }
}

// ============================================
// GESTION SIDEBAR MOBILE
// ============================================

function initSidebarMobile() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      if (sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  window.toggleSidebar = () => {
    if (sidebar && sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  };

  window.closeSidebar = closeSidebar;
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

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// ============================================
// NOTE COLOR
// ============================================

function noteColor(val) {
  const n = Number(val);
  if (isNaN(n)) return '';
  if (n >= 14) return 'note-high';
  if (n >= 10) return 'note-mid';
  return 'note-low';
}

// ============================================
// HELPERS DIVERS
// ============================================

function safeText(v, fallback = '—') {
  if (v === null || v === undefined || v === '') return fallback;
  return String(v);
}

function isUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

// ============================================
// DEBUG
// ============================================

console.log('✅ EduManager Supabase connecté');