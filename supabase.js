const SUPABASE_URL = 'https://rcojerlzguwqpclyudjo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjb2plcmx6Z3V3cXBjbHl1ZGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NTg1MzIsImV4cCI6MjA5MTAzNDUzMn0.4R_NOrYLdhkVMKw87Z33FLS9LoAUAgVj_Uk_RBCf8tg';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getUtilisateur() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from('utilisateurs').select('*, ecoles(*)').eq('id', user.id).maybeSingle();
  return data;
}

function validerMotDePasse(mdp) {
  const erreurs = [];
  if (mdp.length < 8) erreurs.push('Au moins 8 caractères');
  if (!/[A-Z]/.test(mdp)) erreurs.push('Au moins une majuscule');
  if (!/[0-9]/.test(mdp)) erreurs.push('Au moins un chiffre');
  if (!/[^A-Za-z0-9]/.test(mdp)) erreurs.push('Au moins un symbole');
  return erreurs;
}

function genererCode(nom) {
  const ini = nom.split(' ').map(m => m[0]).join('').toUpperCase().substring(0,3);
  const annee = new Date().getFullYear();
  const rand = Math.floor(Math.random()*999).toString().padStart(3,'0');
  return `${ini}-${annee}-${rand}`;
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
    plan_expire_le: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    ...limites[plan]
  }).eq('id', ecoleId);
}

async function signalerHarcelement(ecoleId, contenu) {
  const { data } = await db.from('signalements').insert([{ ecole_id: ecoleId, contenu }]).select().single();
  return data;
}

async function getStatsGlobales() {
  const [ecoles, eleves, paiements] = await Promise.all([
    db.from('ecoles').select('id', { count: 'exact' }),
    db.from('eleves').select('id', { count: 'exact' }),
    db.from('paiements').select('montant').eq('statut','valide')
  ]);
  const revenu = (paiements.data || []).reduce((s,p) => s + Number(p.montant), 0);
  return { total_ecoles: ecoles.count || 0, total_eleves: eleves.count || 0, revenu_total: revenu };
}

console.log('✅ EduManager Supabase connecté');