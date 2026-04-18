import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, KPI, SectionTitle } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { plans } from '../data/mockData';
import styles from './Pricing.module.css';

const FEATURES_PERKS = [
  { icon: '✅', label: 'Fraud Protection',   iconBg: '#eef7ff', iconColor: 'var(--primary)' },
  { icon: '📊', label: 'Realtime Analytics', iconBg: '#e9f7ef', iconColor: '#0b7a3e' },
  { icon: '🛡️', label: 'Secure Exchange',    iconBg: '#fff3e8', iconColor: '#8a5300' },
  { icon: '💬', label: 'Priority Support',   iconBg: '#eef7ff', iconColor: 'var(--primary)' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  function handleCTA(plan) {
    if (plan.id === 'free') {
      navigate(isLoggedIn ? '/dashboard' : '/auth');
    } else {
      alert(`The ${plan.name} plan is coming soon! We'll notify you when it's available.`);
    }
  }

  return (
    <div className={styles.page}>
      <SectionTitle title="Choose Your Plan & Get More Traffic" />

      <div className={styles.plansGrid}>
        {plans.map(plan => (
          <div
            key={plan.id}
            className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
          >
            {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
            <h3 className={styles.planName}>{plan.name}</h3>
            <div className={styles.price}>
              {plan.price}
              {plan.period && <span className={styles.period}>{plan.period}</span>}
            </div>
            <ul className={styles.features}>
              {plan.features.map((f, i) => (
                <li key={i}>
                  <span className={styles.checkIcon}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.popular ? 'primary' : 'ghost'}
              onClick={() => handleCTA(plan)}
              style={{ width: '100%', marginTop: 'auto' }}
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>

      {/* Feature perks strip */}
      <Card>
        <div className={styles.perksGrid}>
          {FEATURES_PERKS.map((p, i) => (
            <KPI key={i} icon={p.icon} value={p.label} label="" iconBg={p.iconBg} iconColor={p.iconColor} />
          ))}
        </div>
      </Card>

      {/* FAQ teaser */}
      <Card>
        <SectionTitle title="Frequently Asked Questions" />
        <div className={styles.faqList}>
          {[
            { q: 'How are credits calculated?', a: 'Each visit earns ~8–12 credits depending on duration and quality score. Longer views earn more.' },
            { q: 'Is the traffic real?',         a: 'Yes — all traffic comes from verified human users in the network. Anti-bot checks run continuously.' },
            { q: 'Can I cancel anytime?',        a: 'Absolutely. Pro plans are billed monthly and you can cancel or downgrade at any time from your dashboard.' },
          ].map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <div className={styles.faqQ}>Q: {faq.q}</div>
              <div className={styles.faqA}>{faq.a}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}