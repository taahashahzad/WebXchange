import React from 'react';
import styles from './UI.module.css';

// Card
export function Card({ children, className = '', style = {} }) {
  return (
    <div className={`${styles.card} ${className}`} style={style}>
      {children}
    </div>
  );
}

// Button
export function Button({ children, variant = 'ghost', onClick, disabled, type = 'button', style = {} }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`${styles.btn} ${variant === 'primary' ? styles.primary : styles.ghost} ${disabled ? styles.disabled : ''}`}
    >
      {children}
    </button>
  );
}

// Badge
export function Badge({ children, variant = 'default', style = {} }) {
  const variantClass = {
    default: styles.badgeDefault,
    success: styles.badgeSuccess,
    danger: styles.badgeDanger,
    warning: styles.badgeWarning,
  }[variant] || styles.badgeDefault;

  return (
    <span className={`${styles.badge} ${variantClass}`} style={style}>
      {children}
    </span>
  );
}

// KPI block
export function KPI({ icon, value, label, iconBg = '#eef7ff', iconColor = 'var(--primary)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        display: 'grid', placeItems: 'center',
        fontSize: 18, flexShrink: 0,
        background: iconBg, color: iconColor,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-display)', wordBreak: 'break-word' }}>
          {value}
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</div>
      </div>
    </div>
  );
}

// SectionTitle
export function SectionTitle({ title, action }) {
  return (
    <div className={styles.sectionTitle}>
      <h2>{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}

// Progress bar
export function ProgressBar({ value = 0, style = {} }) {
  return (
    <div className={styles.progress} style={style}>
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// Notice / alert
export function Notice({ children }) {
  return <div className={styles.notice}>{children}</div>;
}

// Chip
export function Chip({ children }) {
  return <span className={styles.chip}>{children}</span>;
}

// Input
export function Input({ label, type = 'text', placeholder, value, onChange, required, style = {} }) {
  return (
    <label className={styles.fieldLabel} style={style}>
      {label}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={styles.input}
      />
    </label>
  );
}

// Select
export function Select({ label, value, onChange, children, style = {} }) {
  return (
    <label className={styles.fieldLabel} style={style}>
      {label}
      <select value={value} onChange={onChange} className={styles.input}>
        {children}
      </select>
    </label>
  );
}

// Table
export function Table({ headers, rows, highlightTop = 0 }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {headers.map((h, i) => <th key={i}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={i < highlightTop ? { background: '#fffbea' } : {}}>
            {row.map((cell, j) => <td key={j}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
