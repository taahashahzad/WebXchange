import { useState, useEffect, useRef, useCallback } from 'react';

export default function useSurfTimer(duration = 30) {
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setRemaining(duration);
    setRunning(true);
  }, [duration]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const progress = ((duration - remaining) / duration) * 100;
  const done = remaining === 0;

  return { remaining, progress, done, start };
}
