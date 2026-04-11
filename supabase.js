// ============================================
// EDUMANAGER — Configuration Supabase
// ============================================
const SUPABASE_URL = 'https://rcojerlzguwqpclyudjo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjb2plcmx6Z3V3cXBjbHl1ZGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTg1MzIsImV4cCI6MjA5MTAzNDUzMn0.4R_NOrYLdhkVMKw87Z33FLS9LoAUAgVj_Uk_RBCf8tg';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  const mat = matricule.replace(/-/g, '').toLowerCase();
  const c = (code || '').replace(/-/g, '').toLowerCase();
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
  // 2 premières lettres du nom
  var nomClean = (nom || 'XX').replace(/[^a-zA-Z]/g, '').toUpperCase();
  var prefix = (nomClean + 'XX').substring(0, 2);
  
  // Genre : 1=féminin, 2=masculin
  var genre = (sexe === 'F' || sexe === 'f') ? '1' : '2';
  
  // Coder la date de naissance
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
  
  // Séquence 4 chiffres
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
    premium: { max_admins: 4, max_eleves: 999999 }
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

// Créer compte Auth depuis Admin
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

// Gestion sidebar mobile
function initSidebarMobile() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Fermer sidebar sur clic nav (mobile)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar?.classList.remove('open');
        overlay?.classList.remove('active');
      }
    });
  });
}

console.log('✅ EduManager Supabase connecté');
