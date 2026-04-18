import { supabase } from '../lib/supabaseClient';

/** Fetch all websites owned by the current user. */
export async function getMyWebsites(userId) {
  const { data, error } = await supabase
    .from('websites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** Add a new website. */
export async function addWebsite(userId, website) {
  const payload = {
    user_id:       userId,
    url:           website.url,
    daily_cap:     website.dailyCap,
    min_duration:  website.minDuration,
    device_target: website.deviceTarget,
    geo_target:    website.geoTarget
      ? website.geoTarget.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      : null,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('websites')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Update an existing website. */
export async function updateWebsite(websiteId, updates) {
  const { data, error } = await supabase
    .from('websites')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', websiteId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Toggle active <-> paused. */
export async function toggleWebsiteStatus(websiteId, currentStatus) {
  const next = currentStatus === 'active' ? 'paused' : 'active';
  return updateWebsite(websiteId, { status: next });
}

/** Delete a website. */
export async function deleteWebsite(websiteId) {
  const { error } = await supabase
    .from('websites')
    .delete()
    .eq('id', websiteId);
  if (error) throw error;
}

/**
 * Pick the next website for a surfer to visit.
 *
 * FIX 1: Removed supabase.raw() — it does not exist in supabase-js v2.
 * FIX 2: Now correctly fetches ALL active sites not owned by the surfer,
 *        then filters the daily cap check in JavaScript. This is why the
 *        second account saw no sites — the broken .raw() call threw an
 *        error before any sites could be returned.
 */
export async function getNextSurfTarget(userId) {
  const { data, error } = await supabase
    .from('websites')
    .select('*')
    .eq('status', 'active')
    .neq('user_id', userId);   // exclude surfer's own sites

  if (error) throw error;
  if (!data || data.length === 0) return null;

  // Filter out any sites that have already hit their daily cap
  const available = data.filter(site => site.visits_today < site.daily_cap);
  if (available.length === 0) return null;

  // Pick randomly so variety is maintained across sessions
  return available[Math.floor(Math.random() * available.length)];
}
