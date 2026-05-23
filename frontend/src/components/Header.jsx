import React from 'react';
import { useStore } from '../context/StoreContext';

export default function Header({ onCartClick, onAuthClick, onHistoryClick }) {
  const { user, logoutUser, getCartCount } = useStore();
  const cartCount = getCartCount();

  return (
    <header className="glass fixed-top" style={styles.header}>
      <div style={styles.headerContainer}>
        <div style={styles.brand} onClick={() => window.location.reload()}>
          <span style={styles.brandIcon}>🍰</span>
          <span style={styles.brandText}>Cake-Wala</span>
        </div>
        
        <div style={styles.navActions}>
          {user ? (
            <div style={styles.userSection}>
              <button 
                onClick={onHistoryClick} 
                style={styles.historyBtn} 
                title="Order History"
              >
                📜
              </button>
              <div style={styles.avatar} title={user.full_name}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <button onClick={logoutUser} style={styles.logoutBtn} title="Sign Out">
                🚪
              </button>
            </div>
          ) : (
            <button onClick={onAuthClick} style={styles.authBtn}>
              Sign In
            </button>
          )}

          <button onClick={onCartClick} style={styles.cartButton} className="animate-pop-in">
            <span>🛒</span>
            {cartCount > 0 && (
              <span style={styles.badge} key={cartCount}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 900,
    width: '100%',
    padding: '14px 20px',
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-card-border)',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '480px',
    margin: '0 auto',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  brandIcon: {
    fontSize: '24px',
  },
  brandText: {
    fontFamily: 'var(--font-serif)',
    fontSize: '21px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
    color: 'var(--color-text)',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  historyBtn: {
    fontSize: '18px',
    padding: '6px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-round)',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '700',
  },
  logoutBtn: {
    fontSize: '16px',
    padding: '6px',
  },
  authBtn: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: '1.5px solid var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
  },
  cartButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-round)',
    backgroundColor: 'var(--color-text)',
    color: 'white',
    fontSize: '18px',
  },
  badge: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    fontSize: '11px',
    fontWeight: '700',
    width: '20px',
    height: '20px',
    borderRadius: 'var(--radius-round)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '2px solid var(--color-bg)',
    animation: 'pulseSteam 1s ease-in-out',
  },
};
