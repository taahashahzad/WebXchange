import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} WebXchange — All rights reserved</span>
      <div className={styles.links}>
        <a href="#terms">Terms</a>
        <span>•</span>
        <a href="#privacy">Privacy</a>
        <span>•</span>
        <a href="#support">Support</a>
      </div>
    </footer>
  );
}
