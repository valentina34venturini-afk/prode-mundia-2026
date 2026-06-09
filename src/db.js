// =====================================================================
// db.js — Capa de acceso a datos (Supabase)
// Todas las funciones son async y retornan datos o { error }.
// =====================================================================
import { supabase } from './lib/supabase';

// ---- AUTH -----------------------------------------------------------

/** Envía un "magic link" al email. El usuario solo tiene que hacer clic. */
export async function signInWithEmail(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  return { error };
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Escucha cambios de sesión. Llama a callback(session) cada vez que cambia. */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription; // llamar .unsubscribe() para limpiar
}

// ---- PERFIL ---------------------------------------------------------

/** Devuelve el perfil del usuario o null si no existe. */
export async function getProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, created_at')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

/**
 * Crea el perfil por primera vez.
 * Retorna { data, error }. Si el display_name ya existe → error.code === '23505'
 */
export async function createProfile(userId, displayName) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, display_name: displayName })
    .select()
    .single();
  return { data, error };
}

// ---- ROSTER ---------------------------------------------------------

/** Devuelve todos los perfiles ordenados por fecha de registro. */
export async function getRoster() {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name')
    .order('created_at');
  return data || [];
}

// ---- PRONÓSTICOS ----------------------------------------------------

/**
 * Devuelve los pronósticos de un usuario como objeto:
 *   { matchId: { h: number, a: number }, ... }
 */
export async function getPredictions(userId) {
  const { data } = await supabase
    .from('predictions')
    .select('match_id, goals_home, goals_away')
    .eq('user_id', userId);
  if (!data) return {};
  return Object.fromEntries(data.map(r => [r.match_id, { h: r.goals_home, a: r.goals_away }]));
}

/**
 * Guarda (upsert) los pronósticos de un usuario.
 * preds: { matchId: { h: number, a: number }, ... }
 */
export async function savePredictions(userId, preds) {
  const rows = Object.entries(preds).map(([match_id, { h, a }]) => ({
    user_id: userId,
    match_id,
    goals_home: Number(h),
    goals_away: Number(a),
  }));
  if (!rows.length) return null;
  const { error } = await supabase
    .from('predictions')
    .upsert(rows, { onConflict: 'user_id,match_id' });
  return error;
}

/**
 * Devuelve TODOS los pronósticos de todos los usuarios (para el leaderboard).
 * Array de { user_id, match_id, goals_home, goals_away }
 */
export async function getAllPredictions() {
  const { data } = await supabase
    .from('predictions')
    .select('user_id, match_id, goals_home, goals_away');
  return data || [];
}

// ---- RESULTADOS -----------------------------------------------------

/**
 * Devuelve los resultados reales como objeto:
 *   { matchId: { h: number, a: number }, ... }
 */
export async function getResults() {
  const { data } = await supabase
    .from('results')
    .select('match_id, goals_home, goals_away');
  if (!data) return {};
  return Object.fromEntries(data.map(r => [r.match_id, { h: r.goals_home, a: r.goals_away }]));
}

/** Guarda o actualiza el resultado de un partido. */
export async function saveResult(matchId, h, a) {
  const { error } = await supabase
    .from('results')
    .upsert({ match_id: matchId, goals_home: h, goals_away: a }, { onConflict: 'match_id' });
  return error;
}

/** Borra el resultado de un partido. */
export async function deleteResult(matchId) {
  const { error } = await supabase
    .from('results')
    .delete()
    .eq('match_id', matchId);
  return error;
}

// ---- ELIMINATORIAS --------------------------------------------------

/**
 * Devuelve los partidos de eliminatoria cargados por el admin.
 * Formato compatible con GROUP_MATCHES.
 */
export async function getKnockouts() {
  const { data } = await supabase
    .from('knockout_matches')
    .select('*')
    .order('created_at');
  return (data || []).map(r => ({
    id: r.id,
    stage: 'ko',
    label: r.label,
    t1: r.team1,
    t2: r.team2,
    ko: r.kickoff || '',
  }));
}

/** Agrega un nuevo partido de eliminatoria. */
export async function addKnockout(match) {
  const { error } = await supabase.from('knockout_matches').insert({
    id: match.id,
    label: match.label,
    team1: match.t1,
    team2: match.t2,
    kickoff: match.ko || null,
  });
  return error;
}

// ---- CONFIGURACIÓN / PIN --------------------------------------------

/** Devuelve el PIN del organizador o null si no está configurado. */
export async function getPin() {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'admin_pin')
    .maybeSingle();
  return data?.value || null;
}

/** Guarda o actualiza el PIN. */
export async function setPin(pin) {
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'admin_pin', value: pin }, { onConflict: 'key' });
  return error;
}
