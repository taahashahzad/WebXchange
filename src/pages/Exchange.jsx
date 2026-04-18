import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Notice, ProgressBar, SectionTitle } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import useSurfTimer from '../hooks/useSurfTimer';
import { getNextSurfTarget } from '../services/websiteService';
import { startSurfSession, completeSurfSession, skipSurfSession, getTodaySurfStats } from '../services/surfService';
import styles from './Exchange.module.css';

const CREDITS_PER_VISIT = 8;

export default function Exchange() {
  const { user, refreshProfile } = useAuth();

  const [currentSite,  setCurrentSite]  = useState(null);
  const [sessionId,    setSessionId]     = useState(null);
  const [sessionStats, setSessionStats]  = useState({ sitesVisited: 0, skipped: 0, creditsEarned: 0 });
  const [queueLoading, setQueueLoading]  = useState(true);
  const [errorMsg,     setErrorMsg]      = useState('');
  const [noSites,      setNoSites]       = useState(false);

  const { remaining, progress, done, start } = useSurfTimer(30);

  useEffect(() => {
    if (!user) return;
    getTodaySurfStats(user.id).then(setSessionStats).catch(console.error);
  }, [user]);

  const loadNext = useCallback(async () => {
    if (!user) return;
    setQueueLoading(true);
    setErrorMsg('');
    setNoSites(false);
    setCurrentSite(null);
    setSessionId(null);

    try {
      const site = await getNextSurfTarget(user.id);

      if (!site) {
        // Distinguish: no other users have added sites yet vs daily caps exhausted
        setNoSites(true);
        setQueueLoading(false);
        return;
      }

      setCurrentSite(site);
      const sess = await startSurfSession(user.id, site.id);
      setSessionId(sess.id);
      start();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setQueueLoading(false);
    }
  }, [user, start]);

  useEffect(() => { loadNext(); }, [loadNext]);

  async function handleNext() {
    if (!done || !sessionId || !currentSite) return;
    try {
      await completeSurfSession(sessionId, user.id, currentSite.id, 30, CREDITS_PER_VISIT);
      setSessionStats(s => ({
        sitesVisited:  s.sitesVisited + 1,
        creditsEarned: s.creditsEarned + CREDITS_PER_VISIT,
        skipped:       s.skipped,
      }));
      await refreshProfile();
    } catch (err) {
      setErrorMsg(err.message);
    }
    loadNext();
  }

  async function handleSkip() {
    if (sessionId) {
      try { await skipSurfSession(sessionId); } catch (_) {}
    }
    setSessionStats(s => ({ ...s, skipped: s.skipped + 1 }));
    loadNext();
  }

  const placeholderTitle = queueLoading
    ? 'Finding next site…'
    : noSites
      ? 'No sites in the queue right now'
      : 'Ready';

  const placeholderNote = noSites
    ? 'Other users need to add websites first, or all daily caps have been reached. Try again later.'
    : '';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <SectionTitle title="Surf & Earn Credits" />
        <Notice>Keep this tab active to earn credits. Anti-bot checks may appear.</Notice>
      </div>

      <div className={styles.sessionStats}>
        <Card className={styles.statChip}>
          <span className={styles.statLabel}>Session Credits</span>
          <span className={styles.statValue}>+{sessionStats.creditsEarned}</span>
        </Card>
        <Card className={styles.statChip}>
          <span className={styles.statLabel}>Sites Visited</span>
          <span className={styles.statValue}>{sessionStats.sitesVisited}</span>
        </Card>
        <Card className={styles.statChip}>
          <span className={styles.statLabel}>Skipped</span>
          <span className={styles.statValue}>{sessionStats.skipped}</span>
        </Card>
      </div>

      {errorMsg && (
        <div style={{
          background: 'var(--color-background-danger)',
          border: '1px solid var(--color-border-danger)',
          color: 'var(--color-text-danger)',
          padding: '10px 14px',
          borderRadius: 10,
          fontSize: 14,
        }}>
          Error: {errorMsg}
        </div>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className={styles.viewerBar}>
          <div className={styles.viewerUrl}>
            Viewing:{' '}
            <span className={styles.urlText}>
              {queueLoading
                ? 'Searching queue…'
                : currentSite
                  ? currentSite.url
                  : 'No site loaded'}
            </span>
          </div>
          <div className={styles.viewerBadges}>
            <Badge>⏱ {remaining}s</Badge>
            <Badge variant="success">💳 +{CREDITS_PER_VISIT} credits</Badge>
          </div>
        </div>

        <div className={styles.iframePlaceholder}>
          {!queueLoading && currentSite ? (
            <iframe
              src={currentSite.url}
              title="surf-frame"
              className={styles.iframe}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className={styles.iframePlaceholderInner}>
              <div className={styles.placeholderIcon}>{queueLoading ? '⏳' : '🔍'}</div>
              <div className={styles.placeholderTitle}>{placeholderTitle}</div>
              {placeholderNote && (
                <div className={styles.placeholderNote}>{placeholderNote}</div>
              )}
              {noSites && (
                <button
                  onClick={loadNext}
                  style={{
                    marginTop: 16,
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: '1px solid #475569',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <ProgressBar value={progress} />
          <div className={styles.controlActions}>
            <div className={styles.timerLabel}>
              {done && currentSite
                ? '✅ Time complete — click Next to earn credits!'
                : currentSite
                  ? `⏳ ${remaining}s remaining`
                  : 'Waiting for a site…'}
            </div>
            <div className={styles.controlBtns}>
              <Button onClick={handleSkip} disabled={queueLoading || noSites}>
                Skip (no credits)
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!done || queueLoading || !currentSite}
              >
                Next Website ▶
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
