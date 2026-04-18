import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Chip, Badge, KPI, ProgressBar } from '../components/UI';
import { testimonials } from '../data/mockData';
import styles from './Home.module.css';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <Card className={styles.heroCard}>
          <Chip>🟢 Live: 12,540 active users</Chip>
          <h1 className={styles.heroTitle}>Boost Your Website Traffic Automatically</h1>
          <p className={styles.heroDesc}>
            Join the exchange network. Earn credits by visiting others and spend them to get real
            visits back. Geo / device targeting and anti-fraud included.
          </p>
          <div className={styles.heroActions}>
            <Button variant="primary" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/auth')}>Get Started</Button>
            <Button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              How it works
            </Button>
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <div className={styles.statsHeader}>
            <h2>Today's Exchange</h2>
            <Badge>Realtime</Badge>
          </div>
          <div className={styles.statsGrid}>
            <Card>
              <KPI icon="↗" value="125,380" label="Visits exchanged today" iconBg="#eef7ff" />
            </Card>
            <Card>
              <KPI icon="⏱" value="30–60s" label="Avg. view duration" iconBg="#e9f7ef" iconColor="#0b7a3e" />
            </Card>
          </div>
          <div className={styles.activityRow}>
            <span className={styles.muted}>Network activity</span>
            <ProgressBar value={72} style={{ marginTop: 8 }} />
          </div>
        </Card>
      </div>

      {/* How it works */}
      <div id="how-it-works" className={styles.section}>
        <div className={styles.grid3}>
          <Card>
            <KPI icon="1" value="" label="" iconBg="#eef7ff" />
            <h3 style={{ margin: '10px 0 6px' }}>Sign Up</h3>
            <p className={styles.muted}>Create your account and verify email to join the exchange.</p>
          </Card>
          <Card>
            <KPI icon="2" value="" label="" iconBg="#e9f7ef" iconColor="#0b7a3e" />
            <h3 style={{ margin: '10px 0 6px' }}>Add Website</h3>
            <p className={styles.muted}>Submit your URL, set daily caps, geo / device targeting, and duration.</p>
          </Card>
          <Card>
            <KPI icon="3" value="" label="" iconBg="#fff3e8" iconColor="#8a5300" />
            <h3 style={{ margin: '10px 0 6px' }}>Earn & Spend Credits</h3>
            <p className={styles.muted}>Surf other sites to earn credits; spend credits to receive traffic.</p>
          </Card>
        </div>
      </div>

      {/* Testimonials */}
      <Card className={styles.section}>
        <h2 style={{ marginBottom: 16 }}>Testimonials</h2>
        <div className={styles.grid3}>
          {testimonials.map((t, i) => (
            <Card key={i}>
              <strong>{t.name}</strong>
              <p className={styles.muted} style={{ marginTop: 6 }}>"{t.text}"</p>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
