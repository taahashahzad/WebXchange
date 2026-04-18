import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all websites pending moderation.
 * Only callable by admin users (enforced by RLS).
 */
export async function getPendingWebsites() {
  const { data, error } = await supabase
    .from('websites')
    .select(`
      *,
      profiles (
        full_name,
        username
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true }); // oldest first

  if (error) throw error;
  return data;
}

/**
 * Fetch recently moderated websites (approved or rejected in last 7 days).
 */
export async function getRecentlyModerated() {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data, error } = await supabase
    .from('websites')
    .select(`
      *,
      profiles (
        full_name,
        username
      )
    `)
    .in('status', ['active', 'rejected'])
    .gte('updated_at', since.toISOString())
    .order('updated_at', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data;
}

/**
 * Approve a website — sets status to 'active' so it enters the surf queue.
 */
export async function approveWebsite(websiteId) {
  const { data, error } = await supabase
    .from('websites')
    .update({
      status:     'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', websiteId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reject a website with an optional reason stored in a note.
 */
export async function rejectWebsite(websiteId, reason = '') {
  const { data, error } = await supabase
    .from('websites')
    .update({
      status:      'rejected',
      updated_at:  new Date().toISOString(),
    })
    .eq('id', websiteId)
    .select()
    .single();

  if (error) throw error;

  // Log the rejection reason as a credit transaction note (reuses existing table)
  if (reason) {
    await supabase.from('credit_transactions').insert({
      user_id:     data.user_id,
      amount:      0,
      type:        'refund',
      description: `Website rejected: ${reason}`,
      ref_id:      websiteId,
    });
  }

  return data;
}

/**
 * Fetch platform-wide stats for the admin dashboard header.
 */
export async function getAdminStats() {
  const [pendingRes, activeRes, usersRes, sessionsRes] = await Promise.all([
    supabase.from('websites').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('websites').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('surf_sessions').select('id', { count: 'exact', head: true })
      .eq('completed', true)
      .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
  ]);

  return {
    pending:       pendingRes.count  ?? 0,
    active:        activeRes.count   ?? 0,
    totalUsers:    usersRes.count    ?? 0,
    sessionsToday: sessionsRes.count ?? 0,
  };
}