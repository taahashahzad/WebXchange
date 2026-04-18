import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, Input, Select, SectionTitle } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { addWebsite, updateWebsite, getMyWebsites } from '../services/websiteService';
import styles from './AddWebsite.module.css';

export default function AddWebsite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit'); // present when editing an existing site

  const [form, setForm] = useState({
    url: '', dailyCap: 500, minDuration: '30', deviceTarget: 'all', geoTarget: '',
  });
  const [busy,   setBusy]   = useState(false);
  const [msg,    setMsg]    = useState('');
  const [errMsg, setErrMsg] = useState('');

  // Pre-fill form when editing
  useEffect(() => {
    if (!editId || !user) return;
    getMyWebsites(user.id).then(sites => {
      const site = sites.find(s => s.id === editId);
      if (site) {
        setForm({
          url:          site.url,
          dailyCap:     site.daily_cap,
          minDuration:  String(site.min_duration),
          deviceTarget: site.device_target,
          geoTarget:    (site.geo_target || []).join(', '),
        });
      }
    });
  }, [editId, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(''); setErrMsg(''); setBusy(true);
    try {
      if (editId) {
        await updateWebsite(editId, {
          url:           form.url,
          daily_cap:     form.dailyCap,
          min_duration:  Number(form.minDuration),
          device_target: form.deviceTarget,
          geo_target:    form.geoTarget
            ? form.geoTarget.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
            : null,
        });
        setMsg('✅ Website updated successfully!');
      } else {
        await addWebsite(user.id, {
          url: form.url, dailyCap: form.dailyCap,
          minDuration: Number(form.minDuration),
          deviceTarget: form.deviceTarget, geoTarget: form.geoTarget,
        });
        setMsg('✅ Website saved! Redirecting to dashboard…');
        setTimeout(() => navigate('/dashboard'), 1400);
      }
    } catch (err) {
      setErrMsg(err.message);
    } finally { setBusy(false); }
  }

  return (
    <div className={styles.page}>
      <SectionTitle title={editId ? 'Edit Website' : 'Add Website'} />
      <div className={styles.grid}>
        <Card>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              label="Website URL"
              type="url"
              placeholder="https://yourdomain.com"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              required
            />

            <div className={styles.fieldGroup}>
              <label className={styles.rangeLabel}>
                Daily Traffic Limit
                <input
                  type="range" min={50} max={5000} value={form.dailyCap}
                  onChange={e => setForm(f => ({ ...f, dailyCap: Number(e.target.value) }))}
                  className={styles.range}
                />
                <span className={styles.rangeValue}>{form.dailyCap.toLocaleString()} visits / day</span>
              </label>
            </div>

            <div className={styles.twoCol}>
              <Select
                label="Min View Duration"
                value={form.minDuration}
                onChange={e => setForm(f => ({ ...f, minDuration: e.target.value }))}
              >
                <option value="30">30 seconds</option>
                <option value="45">45 seconds</option>
                <option value="60">60 seconds</option>
              </Select>
              <Select
                label="Device Targeting"
                value={form.deviceTarget}
                onChange={e => setForm(f => ({ ...f, deviceTarget: e.target.value }))}
              >
                <option value="all">All Devices</option>
                <option value="desktop">Desktop Only</option>
                <option value="mobile">Mobile Only</option>
              </Select>
            </div>

            <Input
              label="Geo Targeting (optional)"
              placeholder="e.g., US, PK, GB — leave blank for global"
              value={form.geoTarget}
              onChange={e => setForm(f => ({ ...f, geoTarget: e.target.value }))}
            />

            {msg    && <div className={styles.successMsg}>{msg}</div>}
            {errMsg && <div className={styles.errMsg}>⚠️ {errMsg}</div>}

            <div className={styles.formActions}>
              <Button onClick={() => navigate('/dashboard')}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : editId ? 'Update Website' : 'Save Website'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className={styles.tipsCard}>
          <h3>Preview & Tips</h3>
          <p className={styles.muted}>
            Ensure your page loads under 3s and hides intrusive popups. Use clear CTAs above the fold.
          </p>
          <div className={styles.previewBox}>
            {form.url
              ? <span className={styles.previewUrl}>{form.url}</span>
              : <span className={styles.muted}>Enter a URL to preview</span>
            }
          </div>
          <ul className={styles.tips}>
            <li>Daily cap saves credits and smooths delivery.</li>
            <li>Use device / geo targeting for better engagement.</li>
            <li>Longer duration may increase your quality score.</li>
            <li>Avoid pages with aggressive redirects or popups.</li>
          </ul>
          <div className={styles.creditEstimate}>
            <div className={styles.creditTitle}>Estimated daily credit cost</div>
            <div className={styles.creditAmount}>
              ~{Math.ceil(form.dailyCap * 0.8).toLocaleString()} credits
            </div>
            <div className={styles.muted} style={{ fontSize: 12 }}>
              Based on {form.dailyCap.toLocaleString()} visits at ~0.8 credits / visit
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
