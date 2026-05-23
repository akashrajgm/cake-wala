import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

export default function Auth({ onAuthSuccess, onClose }) {
  const { sendOTP, verifyOTP, error, loading } = useStore();
  
  // Auth Phases
  // 1: Enter Phone Number
  // 2: Enter OTP
  const [phase, setPhase] = useState(1);
  
  // Fields state
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    const formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      setValidationError("Please enter phone number in international format, e.g., +919988776655");
      return;
    }

    const code = await sendOTP(formattedPhone);
    if (code) {
      setGeneratedOtp(code);
      setPhase(2);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (otp.length !== 4) {
      setValidationError("Verification code must be exactly 4 digits.");
      return;
    }

    const success = await verifyOTP(phone.trim(), otp.trim(), fullName.trim());
    if (success) {
      onAuthSuccess();
      onClose();
    }
  };

  // Helper utility to instantly trigger Admin Log in for easy evaluations
  const handleAdminBypass = async () => {
    setPhone("+919988776655");
    setFullName("Chef Bakery Admin");
    const code = await sendOTP("+919988776655");
    if (code) {
      setGeneratedOtp(code);
      setOtp(code); // Pre-fill OTP
      setPhase(2);
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
          <h2 style={styles.headerTitle}>Passwordless Authentication</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Developer Sandbox helper banner */}
        {phase === 2 && generatedOtp && (
          <div style={styles.developerBanner}>
            <span style={styles.devIcon}>🛠️</span>
            <div style={styles.devContent}>
              <span style={styles.devLabel}>[DEVELOPER TOOLS] SMS SIMULATOR</span>
              <p style={styles.devText}>
                Mock SMS sent to {phone}! Your verification code is: 
                <strong style={styles.otpToken}> {generatedOtp}</strong>
              </p>
              <button 
                type="button"
                onClick={() => setOtp(generatedOtp)}
                style={styles.autoFillBtn}
              >
                Auto-fill Code ⚡
              </button>
            </div>
          </div>
        )}

        <div style={styles.body}>
          <div style={styles.brandSection}>
            <span style={styles.brandIcon}>🧁</span>
            <h3 style={styles.brandTitle}>Cake-Wala bakery</h3>
            <p style={styles.brandSub}>
              {phase === 1 
                ? "Experience effortless login! No passwords to forget. Sign in via Phone OTP."
                : "Type in the 4-digit code generated for your mobile number."}
            </p>
          </div>

          {(error || validationError) && (
            <div style={styles.errorBox}>
              ⚠️ {validationError || error}
            </div>
          )}

          {phase === 1 ? (
            <form onSubmit={handleSendOTP} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name (For New Signups)</label>
                <input 
                  type="text" 
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mobile Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+919988776655"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <button 
                type="submit" 
                style={styles.submitBtn}
                disabled={loading}
              >
                {loading ? "Generating OTP..." : "Get Verification Code"}
              </button>

              <div style={styles.divider}>
                <span style={styles.dividerLine}></span>
                <span style={styles.dividerText}>OR</span>
                <span style={styles.dividerLine}></span>
              </div>

              <button 
                type="button" 
                onClick={handleAdminBypass}
                style={styles.adminBypassBtn}
              >
                🔐 Sign In as Store Admin (+919988776655)
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Enter 4-Digit Verification Code</label>
                <input 
                  type="text" 
                  maxLength={4}
                  placeholder="0 0 0 0"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={styles.otpInput}
                  required
                />
              </div>

              <button 
                type="submit" 
                style={styles.submitBtn}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <button 
                type="button" 
                onClick={() => setPhase(1)}
                style={styles.changePhoneBtn}
              >
                ← Edit Phone Number
              </button>
            </form>
          )}
        </div>
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
    padding: '18px 24px',
    borderBottom: '1px solid var(--color-card-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  closeBtn: {
    fontSize: '18px',
    color: 'var(--color-text-muted)',
  },
  developerBanner: {
    backgroundColor: 'var(--color-surface)',
    borderBottom: '1.5px solid var(--color-accent)',
    padding: '14px 18px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  devIcon: {
    fontSize: '20px',
  },
  devContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  devLabel: {
    fontSize: '9px',
    fontWeight: '800',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.8px',
  },
  devText: {
    fontSize: '12px',
    color: 'var(--color-text)',
    lineHeight: '1.4',
  },
  otpToken: {
    color: 'var(--color-primary)',
    fontWeight: '800',
    fontSize: '14px',
  },
  autoFillBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-text)',
    fontSize: '10px',
    fontWeight: '800',
    padding: '4px 10px',
    borderRadius: '4px',
    marginTop: '4px',
    boxShadow: 'var(--shadow-sm)',
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  brandSection: {
    textAlign: 'center',
  },
  brandIcon: {
    fontSize: '44px',
    display: 'block',
    marginBottom: '6px',
  },
  brandTitle: {
    fontSize: '18px',
    fontFamily: 'var(--font-serif)',
    fontWeight: '700',
  },
  brandSub: {
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  otpInput: {
    padding: '16px 20px',
    fontSize: '22px',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: '8px',
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
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '4px 0',
  },
  dividerLine: {
    flexGrow: 1,
    height: '1px',
    backgroundColor: 'var(--color-card-border)',
  },
  dividerText: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
  },
  adminBypassBtn: {
    width: '100%',
    backgroundColor: 'var(--color-surface-solid)',
    color: 'var(--color-text)',
    border: '1.5px solid var(--color-primary)',
    padding: '12px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '700',
    fontSize: '13px',
  },
  changePhoneBtn: {
    color: 'var(--color-primary)',
    fontSize: '12px',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: '6px',
  },
};
