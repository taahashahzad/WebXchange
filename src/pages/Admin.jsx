import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate }  from 'react-router-dom';
import { Card, Button, Badge, KPI, SectionTitle } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import {
  getPendingWebsites,
  getRecentlyModerated,
  approveWebsite,
  rejectWebsite,
  getAdminStats,
} from '../services/adminService';
import styles from './Admin.module.css';

export default function Admin() {
  const { profile } = useAuth();
  const navigate    = useNavigate();

  const [tab,       setTab]       = useState('pending'); // 'pending' | 'recent'
  const [pending,   setPending]   = useState([]);
  const [recent,    setRecent]    = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [reasons,   setReasons]   = useState({});   // { [websiteId]: reason string }
  const [busy,      setBusy]      = useState({});   // { [websiteId]: true }

  // Redirect non-admins immediately
  useEffect(() => {
    if (profile && !profile.is_admin) navigate('/', { replace: true });
  }, [profile, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r, s] = await Promise.all([
        getPendingWebsites(),
        getRecentlyModerated(),
        getAdminStats(),
      ]);
      setPending(p);
      setRecent(r);
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id) {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await approveWebsite(id);
      setPending(p => p.filter(s => s.id !== id));
      setStats(s => s ? { ...s, pending: s.pending - 1, active: s.active + 1 } : s);
    } catch (err) { alert(err.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  }

  async function handleReject(id) {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await rejectWebsite(id, reasons[id] || '');
      setPending(p => p.filter(s => s.id !== id));
      setStats(s => s ? { ...s, pending: s.pending - 1 } : s);
    } catch (err) { alert(err.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  }

  if (!profile?.is_admin) return null;

  return (
    <div className={styles.page}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Admin — Moderation Queue</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            Review submitted websites before they enter the surf pool.
          </p>
        </div>
        <Button onClick={load}>Refresh</Button>
      </div>

      {/* Platform stats */}
      {stats && (
        <div className={styles.statsRow}>
          <Card>
            <KPI icon="⏳" value={stats.pending}       label="Awaiting review"   iconBg="#fff6e5" iconColor="#7a4f00" />
          </Card>
          <Card>
            <KPI icon="✅" value={stats.active}        label="Active sites"      iconBg="#e9f7ef" iconColor="#0b7a3e" />
          </Card>
          <Card>
            <KPI icon="👤" value={stats.totalUsers}    label="Total users"       iconBg="#eef7ff" />
          </Card>
          <Card>
            <KPI icon="🏄" value={stats.sessionsToday} label="Sessions today"    iconBg="#eef7ff" />
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'pending' ? styles.tabActive : ''}`}
            onClick={() => setTab('pending')}
          >
            Pending ({pending.length})
          </button>
          <button
            className={`${styles.tab} ${tab === 'recent' ? styles.tabActive : ''}`}
            onClick={() => setTab('recent')}
          >
            Recently moderated
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <div className={styles.loader}>Loading queue…</div>}

      {/* Pending tab */}
      {!loading && tab === 'pending' && (
        <>
          {pending.length === 0 ? (
            <Card>
              <div className={styles.queueEmpty}>
                <div className={styles.icon}>🎉</div>
                <div>Queue is empty — all submissions reviewed.</div>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map(site => (
                <SiteCard
                  key={site.id}
                  site={site}
                  busy={!!busy[site.id]}
                  reason={reasons[site.id] || ''}
                  onReasonChange={val => setReasons(r => ({ ...r, [site.id]: val }))}
                  onApprove={() => handleApprove(site.id)}
                  onReject={() => handleReject(site.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Recent tab */}
      {!loading && tab === 'recent' && (
        <Card>
          <SectionTitle title="Recently moderated (last 7 days)" />
          {recent.length === 0
            ? <div className={styles.queueEmpty}><div>No moderation activity in the last 7 days.</div></div>
            : recent.map(site => (
                <div key={site.id} className={styles.recentRow}>
                  <div className={styles.recentUrl}>{site.url}</div>
                  <div className={styles.recentMeta}>
                    {site.profiles?.full_name || 'Unknown user'}
                  </div>
                  <Badge variant={site.status === 'active' ? 'success' : 'danger'}>
                    {site.status}
                  </Badge>
                  <div className={styles.recentMeta}>
                    {new Date(site.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))
          }
        </Card>
      )}

    </div>
  );
}

// ── Sub-component: single site card in the queue ─────────────
function SiteCard({ site, busy, reason, onReasonChange, onApprove, onReject }) {
  const owner    = site.profiles;
  const submittedAt = new Date(site.created_at).toLocaleString();

  return (
    <div className={styles.siteCard}>
      <div className={styles.siteCardHeader}>
        <div style={{ flex: 1 }}>
          <div className={styles.siteUrl}>
            <a href={site.url} target="_blank" rel="noopener noreferrer">{site.url}</a>
          </div>
          <div className={styles.siteMeta}>
            <span>Submitted by <strong>{owner?.full_name || owner?.username || 'unknown'}</strong></span>
            <span>{submittedAt}</span>
            <span>Cap: {site.daily_cap.toLocaleString()} visits/day</span>
            <span>Min duration: {site.min_duration}s</span>
          </div>
        </div>

        {/* Mini preview thumbnail — links open the site */}
        <a href={site.url} target="_blank" rel="noopener noreferrer" className={styles.previewThumb}>
          Preview
        </a>
      </div>

      <div className={styles.siteCardBody}>
        {/* Targeting chips */}
        <div className={styles.targetChips}>
          <span className={styles.chip}>Device: {site.device_target}</span>
          {site.geo_target?.length > 0
            ? site.geo_target.map(g => <span key={g} className={styles.chip}>{g}</span>)
            : <span className={styles.chip}>Global</span>
          }
        </div>

        {/* Action controls */}
        <div className={styles.actionRow}>
          <input
            className={styles.rejectInput}
            placeholder="Rejection reason (optional)"
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
            disabled={busy}
          />
          <Button
            onClick={onReject}
            disabled={busy}
            style={{ background: '#ffeef0', color: '#b00020', border: '1px solid #ffd2d8' }}
          >
            {busy ? '…' : 'Reject'}
          </Button>
          <Button variant="primary" onClick={onApprove} disabled={busy}>
            {busy ? '…' : 'Approve'}
          </Button>
        </div>
      </div>
    </div>
  );
}