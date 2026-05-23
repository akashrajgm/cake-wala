import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

export default function Auth({ onAuthSuccess, onClose }) {
  const { loginUser, registerUser, error, loading } = useStore();
  const [isLoginTab, setIsLoginTab] = useState(true);
  
  // Fields state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (isLoginTab) {
      const success = await loginUser(email, password);
      if (success) {
        onAuthSuccess();
        onClose();
      }
    } else {
      if (!fullName.trim()) {
        setValidationError("Full Name is required.");
        return;
      }
      const success = await registerUser(fullName, email, phone, password);
      if (success) {
        onAuthSuccess();
        onClose();
      }
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={styles.card} 
        onClick={(e) => e.stopPropagation()} 
        className="animate-pop-in"
      >
        <div style={styles.header}>
          <div style={styles.tabContainer}>
            <button 
              onClick={() => setIsLoginTab(true)}
              style={{
                ...styles.tab,
                color: isLoginTab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: isLoginTab ? '3px solid var(--color-primary)' : 'none'
              }}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLoginTab(false)}
              style={{
                ...styles.tab,
                color: !isLoginTab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                borderBottom: !isLoginTab ? '3px solid var(--color-primary)' : 'none'
              }}
            >
              Join Us
            </button>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.brandSection}>
            <span style={styles.icon}>🧁</span>
            <h3 style={styles.brandTitle}>Welcome to Cake-Wala</h3>
            <p style={styles.brandSubtitle}>
              {isLoginTab 
                ? "Enter your credentials to unlock sweet rewards!" 
                : "Create an account to save order history and track deliveries."}
            </p>
          </div>

          {(error || validationError) && (
            <div style={styles.errorBox}>
              ⚠️ {validationError || error}
            </div>
          )}

          {!isLoginTab && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input 
                type="text" 
                placeholder="Chef Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {!isLoginTab && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number (Optional)</label>
              <input 
                type="tel" 
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button 
            type="submit" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? "Authenticating..." : isLoginTab ? "Access Account" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 27, 24, 0.45)',
    backdropFilter: 'blur(6px)',
    zIndex: 1100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--color-card-border)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '10px 20px 0',
    borderBottom: '1px solid var(--color-card-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabContainer: {
    display: 'flex',
    gap: '20px',
  },
  tab: {
    padding: '16px 4px 12px',
    fontSize: '15px',
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: '18px',
    color: 'var(--color-text-muted)',
    paddingBottom: '6px',
  },
  form: {
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  brandSection: {
    textAlign: 'center',
    marginBottom: '10px',
  },
  icon: {
    fontSize: '44px',
    display: 'block',
    marginBottom: '6px',
  },
  brandTitle: {
    fontSize: '18px',
    fontFamily: 'var(--font-serif)',
    fontWeight: '700',
  },
  brandSubtitle: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    lineHeight: '1.4',
    padding: '0 10px',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
    border: '1px solid #FFCDD2',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '600',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '12px 16px',
    fontSize: '14px',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '700',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(211, 84, 0, 0.25)',
    marginTop: '10px',
  },
};
