import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, Button, Badge, KPI, SectionTitle, Notice, Table } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getTrafficTrend } from '../services/analyticsService';
import { getMyWebsites, toggleWebsiteStatus, deleteWebsite } from '../services/websiteService';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats,    setStats]    = useState(null);
  const [trend,    setTrend]    = useState([]);
  const [websites, setWebsites] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const [s, t, w] = await Promise.all([
        getDashboardStats(user.id),
        getTrafficTrend(user.id),
        getMyWebsites(user.id),
      ]);
      setStats(s); setTrend(t); setWebsites(w);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(site) {
    try {
      const updated = await toggleWebsiteStatus(site.id, site.status);
      setWebsites(ws => ws.map(w => w.id === updated.id ? updated : w));
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(siteId) {
    if (!window.confirm('Delete this website?')) return;
    try {
      await deleteWebsite(siteId);
      setWebsites(ws => ws.filter(w => w.id !== siteId));
    } catch (err) { alert(err.message); }
  }

  const websiteRows = websites.map(site => [
    <span className={styles.url}>{site.url}</span>,
    <Badge variant={site.status === 'active' ? 'success' : 'danger'}>
      {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
    </Badge>,
    site.daily_cap.toLocaleString(),
    site.geo_target?.join(', ') || 'Global',
    <div className={styles.actions}>
      <Button onClick={() => navigate(`/add-website?edit=${site.id}`)}>Edit</Button>
      <Button onClick={() => handleToggle(site)}>
        {site.status === 'active' ? 'Pause' : 'Resume'}
      </Button>
      <Button onClick={() => handleDelete(site.id)}>🗑</Button>
    </div>,
  ]);

  if (loading) return <div className={styles.loader}>Loading dashboard…</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard Overview</h2>
        {error && <Notice>{error}</Notice>}
      </div>

      {stats && (
        <div className={styles.kpiGrid}>
          <Card><KPI icon="💳" value={stats.credits.toLocaleString()} label="Credits Balance" iconBg="#eef7ff" /></Card>
          <Card><KPI icon="👁️" value={stats.visits7d.toLocaleString()} label="Visits (7 days)" iconBg="#e9f7ef" iconColor="#0b7a3e" /></Card>
          <Card><KPI icon="📈" value={stats.ctr} label="CTR" iconBg="#fff3e8" iconColor="#8a5300" /></Card>
          <Card><KPI icon="⏱" value={stats.avgDuration} label="Avg. Duration" iconBg="#eef7ff" /></Card>
        </div>
      )}

      <div className={styles.midGrid}>
        <Card>
          <SectionTitle title="Traffic Trend" action={<Badge>7 days</Badge>} />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0a73ff" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0a73ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13 }} />
              <Area type="monotone" dataKey="visits" stroke="#0a73ff" strokeWidth={2.5} fill="url(#grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle title="Quick Actions" />
          <div className={styles.quickActions}>
            <Button variant="primary" onClick={() => navigate('/add-website')}>➕ Add Website</Button>
            <Button onClick={() => navigate('/exchange')}>▶ Start Surfing</Button>
            <Button onClick={() => navigate('/pricing')}>💠 Buy Credits</Button>
            <Button onClick={() => load()}>🔄 Refresh</Button>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          title={`Your Websites (${websites.length})`}
          action={<Button onClick={() => navigate('/add-website')}>Add New</Button>}
        />
        {websites.length === 0
          ? <p className={styles.empty}>No websites yet. <button className={styles.link} onClick={() => navigate('/add-website')}>Add your first one →</button></p>
          : <Table headers={['Website', 'Status', 'Daily Cap', 'Geo', 'Actions']} rows={websiteRows} />
        }
      </Card>
    </div>
  );
}
