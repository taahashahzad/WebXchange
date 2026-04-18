import { supabase } from '../lib/supabaseClient';

/**
 * Create a pending surf session row when a user starts viewing a site.
 * Returns the session id to be used when completing or skipping.
 */
export async function startSurfSession(surferId, websiteId) {
  const { data, error } = await supabase
    .from('surf_sessions')
    .insert({ surfer_id: surferId, website_id: websiteId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Mark session complete and atomically transfer credits via DB function.
 * The `complete_surf_session` SQL function handles all ledger updates.
 */
export async function completeSurfSession(sessionId, surferId, websiteId, durationSecs, credits) {
  const { error } = await supabase.rpc('complete_surf_session', {
    p_session_id: sessionId,
    p_surfer_id:  surferId,
    p_website_id: websiteId,
    p_duration:   durationSecs,
    p_credits:    credits,
  });
  if (error) throw error;
}

/**
 * Mark session as skipped (no credits awarded).
 */
export async function skipSurfSession(sessionId) {
  const { error } = await supabase
    .from('surf_sessions')
    .update({ skipped: true })
    .eq('id', sessionId);
  if (error) throw error;
}

/**
 * Get today's surf stats for the surfer.
 */
export async function getTodaySurfStats(surferId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('surf_sessions')
    .select('credits_earned, completed, skipped')
    .eq('surfer_id', surferId)
    .gte('created_at', today);
  if (error) throw error;

  const completed = data.filter(s => s.completed);
  const skipped   = data.filter(s => s.skipped);
  const totalCredits = completed.reduce((sum, s) => sum + (s.credits_earned || 0), 0);

  return { sitesVisited: completed.length, skipped: skipped.length, creditsEarned: totalCredits };
}
