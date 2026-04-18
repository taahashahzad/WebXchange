import { supabase } from '../lib/supabaseClient';

/**
 * Fetch 7-day traffic trend for a user's websites.
 * Returns array: [{ day: 'Mon', visits: 120 }, ...]
 */
export async function getTrafficTrend(userId) {
  const since = new Date();
  since.setDate(since.getDate() - 6);

  const { data, error } = await supabase
    .from('traffic_logs')
    .select('created_at')
    .eq('owner_id', userId)
    .gte('created_at', since.toISOString());
  if (error) throw error;

  // Group by day-of-week label
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    counts[d.toDateString()] = { day: days[d.getDay()], visits: 0 };
  }
  data.forEach(row => {
    const key = new Date(row.created_at).toDateString();
    if (counts[key]) counts[key].visits++;
  });

  return Object.values(counts);
}

/**
 * Dashboard KPIs for the current user.
 */
export async function getDashboardStats(userId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Run queries in parallel
  const [profileRes, visitsRes, sessionsRes] = await Promise.all([
    supabase.from('profiles').select('credits').eq('id', userId).single(),
    supabase
      .from('traffic_logs')
      .select('duration_secs', { count: 'exact' })
      .eq('owner_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('surf_sessions')
      .select('credits_earned')
      .eq('surfer_id', userId)
      .eq('completed', true)
      .gte('created_at', sevenDaysAgo.toISOString()),
  ]);

  if (profileRes.error) throw profileRes.error;

  const visits = visitsRes.count ?? 0;
  const durations = (visitsRes.data || []).map(r => r.duration_secs).filter(Boolean);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  return {
    credits:     profileRes.data.credits,
    visits7d:    visits,
    avgDuration: `${avgDuration}s`,
    ctr:         visits > 0 ? `${((visits / (visits + 50)) * 100).toFixed(1)}%` : '0%',
  };
}

/**
 * Fetch the top 10 leaderboard rows for today.
 */
export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard_today')
    .select('*')
    .limit(10);
  if (error) throw error;
  return data;
}

/**
 * Fetch a user's credit transaction history.
 */
export async function getCreditHistory(userId, limit = 20) {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
