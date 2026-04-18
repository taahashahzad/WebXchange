import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, KPI, SectionTitle, Table } from '../components/UI';
import { getLeaderboard } from '../services/analyticsService';
import styles from './Leaderboard.module.css';

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const rows = await getLeaderboard();
      setData(rows);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const rows = data.map((row, i) => {
    const rank = i + 1;
    return [
      <span>{RANK_MEDALS[rank] || rank}</span>,
      <span className={styles.username}>{row.username || row.full_name || 'Anonymous'}</span>,
      (row.visits_delivered || 0).toLocaleString(),
      (row.credits_earned_today || 0).toLocaleString(),
    ];
  });

  return (
    <div className={styles.page}>
      <SectionTitle
        title="Community Leaderboard"
        action={
          <Button onClick={load}>
            {loading ? '⏳ Loading…' : '🔄 Refresh'}
          </Button>
        }
      />

      {error && (
        <div style={{ color: '#b00020', background: '#ffeef0', border: '1px solid #ffd2d8', padding: '10px 14px', borderRadius: 10, fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.grid}>
        <Card>
          {loading
            ? <div className={styles.loadingRow}>Loading leaderboard…</div>
            : data.length === 0
              ? <div className={styles.loadingRow}>No data yet — start surfing to appear here!</div>
              : <Table
                  headers={['Rank', 'User / Website', 'Visits Today', 'Credits Earned']}
                  rows={rows}
                  highlightTop={3}
                />
          }
        </Card>

        <div className={styles.sideStats}>
          <Card><KPI icon="🌍" value="Top Country" label="United States" iconBg="#eef7ff" /></Card>
          <Card><KPI icon="📱" value="Top Device" label="Mobile" iconBg="#e9f7ef" iconColor="#0b7a3e" /></Card>

          <Card>
            <SectionTitle title="Device Split" />
            <div className={styles.pieChart}>
              <div className={styles.piePlaceholder}>
                <div className={styles.donut} />
                <div className={styles.pieLegend}>
                  <span><span className={styles.dot} style={{ background: '#0a73ff' }} />Mobile 58%</span>
                  <span><span className={styles.dot} style={{ background: '#2cc0ff' }} />Desktop 32%</span>
                  <span><span className={styles.dot} style={{ background: '#00c853' }} />Tablet 10%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Today's Highlights" />
            <div className={styles.highlights}>
              <div className={styles.highlightRow}>
                <span>Most active region</span>
                <Badge>🌎 Americas</Badge>
              </div>
              <div className={styles.highlightRow}>
                <span>Peak hour</span>
                <Badge>🕐 14:00 UTC</Badge>
              </div>
              <div className={styles.highlightRow}>
                <span>Avg. session</span>
                <Badge variant="success">42s</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
