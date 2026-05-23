import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';

const PRESET_LANDMARKS = [
  { name: "Bellandur Tech Zone", address: "Flat 302, Outer Ring Rd, Bellandur, Bangalore - 560103", lat: 12.92876, lng: 77.67843 },
  { name: "Koramangala Sweet Block", address: "Villa 14, 5th Block, Koramangala, Bangalore - 560034", lat: 12.93524, lng: 77.62444 },
  { name: "HSR Layout Sector 3", address: "Apartment A2, 24th Main Road, HSR Layout, Bangalore - 560102", lat: 12.91032, lng: 77.64551 },
  { name: "Whitefield Prestige", address: "Penthouse C, ITPL Main Rd, Whitefield, Bangalore - 560066", lat: 12.96981, lng: 77.74998 }
];

export default function CartModal({ isOpen, onClose, onAuthClick, onOrderSuccess }) {
  const { cart, updateCartQuantity, removeFromCart, getCartTotal, user, token, placeOrder, loading } = useStore();
  const [selectedLandmark, setSelectedLandmark] = useState(0);
  const [customAddress, setCustomAddress] = useState(PRESET_LANDMARKS[0].address);
  const [paymentMethod, setPaymentMethod] = useState("COD"); // COD, UPI
  
  // Simulated PhonePe Overlay Drawer states
  const [showPhonePe, setShowPhonePe] = useState(false);
  const [payingPhonePe, setPayingPhonePe] = useState(false);

  if (!isOpen) return null;

  const cartItems = Object.values(cart);
  const total = getCartTotal();

  const handleLandmarkChange = (index) => {
    setSelectedLandmark(index);
    setCustomAddress(PRESET_LANDMARKS[index].address);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onAuthClick();
      return;
    }

    if (paymentMethod === "UPI") {
      setShowPhonePe(true);
    } else {
      // Cash on Delivery Checkout
      const landmark = PRESET_LANDMARKS[selectedLandmark];
      const order = await placeOrder(customAddress, landmark.lat, landmark.lng, "COD", "pending");
      if (order) {
        onOrderSuccess();
        onClose();
      }
    }
  };

  const handlePhonePePayment = async () => {
    setPayingPhonePe(true);
    // Simulate transaction authorization delay of 1.5 seconds
    setTimeout(async () => {
      const landmark = PRESET_LANDMARKS[selectedLandmark];
      const order = await placeOrder(customAddress, landmark.lat, landmark.lng, "UPI", "completed");
      setPayingPhonePe(false);
      setShowPhonePe(false);
      
      if (order) {
        onOrderSuccess();
        onClose();
      }
    }, 1500);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={styles.drawer} 
        onClick={(e) => e.stopPropagation()} 
        className="animate-pop-in"
      >
        {/* Elegant PhonePe UPI Overlay Portal */}
        {showPhonePe && (
          <div style={styles.phonePeOverlay} className="animate-slide-up">
            <div style={styles.phonePeHeader}>
              <button onClick={() => setShowPhonePe(false)} style={styles.phonePeBack}>← Back</button>
              <h3 style={styles.phonePeTitle}>📱 PhonePe Secure</h3>
            </div>
            
            <div style={styles.phonePeBody}>
              <div style={styles.phonePeMerchant}>
                <span style={styles.merchantIcon}>🍰</span>
                <div>
                  <h4 style={styles.merchantName}>Cake-Wala Bakery Store</h4>
                  <p style={styles.merchantSub}>Secure UPI Payment Merchant</p>
                </div>
              </div>

              <div style={styles.amountBanner}>
                <span style={styles.amountLabel}>AMOUNT TO PAY</span>
                <h1 style={styles.amountValue}>₹{total}</h1>
              </div>

              {/* Secure QR Code simulation */}
              <div style={styles.qrContainer}>
                <div style={styles.qrCodePlaceholder}>
                  {/* Clean SVG visual QR Mockup */}
                  <svg width="140" height="140" viewBox="0 0 100 100" style={{ opacity: 0.8 }}>
                    <path d="M5 5h30v30H5zm10 10h10v10H15zm50-10h30v30H65zm10 10h10v10H75zM5 65h30v30H5zm10 10h10v10H15zm55 5h10v10H70zm15-15h10v10H85zm-15-15h10v10H70zm15 0h10v10H85z" fill="var(--color-text)" />
                    <rect x="42" y="42" width="16" height="16" fill="var(--color-primary)" rx="2" />
                  </svg>
                  <span style={styles.qrText}>Scan QR Code with any UPI App</span>
                </div>
              </div>

              <button 
                onClick={handlePhonePePayment} 
                style={styles.phonePeSubmit}
                disabled={payingPhonePe}
              >
                {payingPhonePe ? (
                  <div style={styles.phonePeLoading}>
                    <div style={styles.smallSpinner}></div>
                    <span>Authorizing UPI Pay...</span>
                  </div>
                ) : (
                  `Pay ₹${total} via PhonePe Simulator ⚡`
                )}
              </button>
              
              <p style={styles.phonePeSecurityLabel}>🔒 256-bit bank grade encryption sandbox</p>
            </div>
          </div>
        )}

        <div style={styles.header}>
          <h2 style={styles.title}>Your Bakery Cart 🥐</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div style={styles.emptyContainer}>
            <span style={styles.emptyIcon}>🧁</span>
            <p style={styles.emptyText}>Your cart is completely empty. Start browsing our delicious treats!</p>
            <button onClick={onClose} style={styles.shopBtn}>Browse Bakery</button>
          </div>
        ) : (
          <div style={styles.body}>
            {/* Cart Items List */}
            <div style={styles.itemsList}>
              {cartItems.map((item) => (
                <div style={styles.itemRow} key={item.product.id}>
                  <img src={item.product.image_url} alt={item.product.name} style={styles.itemImg} />
                  <div style={styles.itemInfo}>
                    <h4 style={styles.itemName}>{item.product.name}</h4>
                    <p style={styles.itemPrice}>₹{item.product.price} each</p>
                  </div>
                  <div style={styles.qtyContainer}>
                    <button 
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      style={styles.qtyBtn}
                    >
                      -
                    </button>
                    <span style={styles.qtyText}>{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      style={styles.qtyBtn}
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} style={styles.removeBtn}>✕</button>
                </div>
              ))}
            </div>

            {/* Invoicing calculation details */}
            <div style={styles.summaryBox}>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Delivery Charges</span>
                <span style={{ color: 'green', fontWeight: '600' }}>FREE</span>
              </div>
              <div style={{ ...styles.summaryRow, borderTop: '1px dashed var(--color-card-border)', paddingTop: '10px', marginTop: '10px' }}>
                <span style={{ fontWeight: '700' }}>Grand Total</span>
                <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '18px' }}>₹{total}</span>
              </div>
            </div>

            {/* Authentication and Checkout block */}
            {!token ? (
              <div style={styles.authPrompt}>
                <p style={styles.promptText}>Please sign in to complete your transaction</p>
                <button onClick={onAuthClick} style={styles.checkoutSubmit}>Sign In & Checkout</button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} style={styles.checkoutForm}>
                <h3 style={styles.sectionTitle}>Delivery Directions 🏍️</h3>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Select Delivery Landmark (for simulated coordinates):</label>
                  <select 
                    value={selectedLandmark} 
                    onChange={(e) => handleLandmarkChange(parseInt(e.target.value))}
                    style={styles.select}
                  >
                    {PRESET_LANDMARKS.map((landmark, idx) => (
                      <option key={idx} value={idx}>
                        {landmark.name} (Simulated Route)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Detailed Delivery Address:</label>
                  <textarea 
                    value={customAddress} 
                    onChange={(e) => setCustomAddress(e.target.value)}
                    style={styles.textarea}
                    required
                    rows={2}
                  />
                </div>

                {/* Highly aesthetic Payment method tabs bar */}
                <h3 style={styles.sectionTitle}>Select Payment Method 💳</h3>
                <div style={styles.paymentTabs}>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    style={{
                      ...styles.paymentTab,
                      borderColor: paymentMethod === "COD" ? 'var(--color-primary)' : 'var(--color-card-border)',
                      backgroundColor: paymentMethod === "COD" ? 'rgba(211, 84, 0, 0.05)' : 'white',
                    }}
                  >
                    <span style={styles.paymentIcon}>💵</span>
                    <span style={styles.paymentLabelText}>Cash On Delivery</span>
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    style={{
                      ...styles.paymentTab,
                      borderColor: paymentMethod === "UPI" ? 'var(--color-primary)' : 'var(--color-card-border)',
                      backgroundColor: paymentMethod === "UPI" ? 'rgba(211, 84, 0, 0.05)' : 'white',
                    }}
                  >
                    <span style={styles.paymentIcon}>📱</span>
                    <span style={styles.paymentLabelText}>UPI / PhonePe</span>
                  </button>
                </div>

                <button 
                  type="submit" 
                  style={styles.checkoutSubmit}
                  disabled={loading}
                >
                  {loading ? "Placing Order..." : paymentMethod === "UPI" ? "Proceed to UPI Payment" : "Place COD Order & Track"}
                </button>
              </form>
            )}
          </div>
        )}
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
    backgroundColor: 'rgba(44, 27, 24, 0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: '100%',
    maxWidth: '440px',
    height: '100%',
    backgroundColor: 'var(--color-bg)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    position: 'relative',
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid var(--color-card-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  closeBtn: {
    fontSize: '20px',
    color: 'var(--color-text-muted)',
  },
  emptyContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    textAlign: 'center',
    gap: '16px',
  },
  emptyIcon: {
    fontSize: '64px',
  },
  emptyText: {
    color: 'var(--color-text-muted)',
    fontSize: '15px',
    lineHeight: '1.5',
  },
  shopBtn: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '700',
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flexGrow: 1,
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'var(--color-surface-solid)',
    padding: '10px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-card-border)',
  },
  itemImg: {
    width: '50px',
    height: '50px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
  },
  itemInfo: {
    flexGrow: 1,
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '700',
    fontFamily: 'var(--font-serif)',
  },
  itemPrice: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  qtyContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-sm)',
    padding: '2px',
    border: '1.5px solid var(--color-card-border)',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '700',
    fontSize: '14px',
  },
  qtyText: {
    fontSize: '13px',
    fontWeight: '700',
    minWidth: '20px',
    textAlign: 'center',
  },
  removeBtn: {
    color: 'red',
    fontSize: '14px',
    padding: '4px',
  },
  summaryBox: {
    backgroundColor: 'var(--color-surface-solid)',
    borderRadius: 'var(--radius-md)',
    padding: '18px',
    border: '1.5px solid var(--color-card-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: 'var(--color-text)',
  },
  authPrompt: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '10px',
  },
  promptText: {
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    fontWeight: '600',
  },
  checkoutForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '10px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--color-text)',
    borderBottom: '1.5px solid var(--color-card-border)',
    paddingBottom: '6px',
    marginTop: '6px',
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
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    borderRadius: 'var(--radius-sm)',
    resize: 'none',
  },
  paymentTabs: {
    display: 'flex',
    gap: '12px',
  },
  paymentTab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-card-border)',
    transition: 'all var(--transition-fast)',
  },
  paymentIcon: {
    fontSize: '22px',
  },
  paymentLabelText: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  checkoutSubmit: {
    width: '100%',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '700',
    fontSize: '15px',
    boxShadow: '0 6px 14px rgba(211, 84, 0, 0.2)',
    textAlign: 'center',
  },
  
  /* --- PHONEPE OVERLAY DRAWER STYLES --- */
  phonePeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'var(--color-bg)',
    zIndex: 1050,
    display: 'flex',
    flexDirection: 'column',
  },
  phonePeHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid var(--color-card-border)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#673AB7', /* PhonePe Purple */
    color: 'white',
  },
  phonePeBack: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'white',
  },
  phonePeTitle: {
    fontSize: '16px',
    fontWeight: '700',
    fontFamily: 'var(--font-sans)',
  },
  phonePeBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    flexGrow: 1,
    justifyContent: 'center',
  },
  phonePeMerchant: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(103, 58, 183, 0.05)',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(103, 58, 183, 0.1)',
  },
  merchantIcon: {
    fontSize: '28px',
  },
  merchantName: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  merchantSub: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
  },
  amountBanner: {
    textAlign: 'center',
    backgroundColor: 'var(--color-surface-solid)',
    border: '1.5px solid var(--color-card-border)',
    padding: '18px',
    borderRadius: 'var(--radius-md)',
  },
  amountLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.5px',
  },
  amountValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#673AB7',
    marginTop: '4px',
  },
  qrContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodePlaceholder: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--color-card-border)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  qrText: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    fontWeight: '700',
  },
  phonePeSubmit: {
    backgroundColor: '#673AB7', /* PhonePe Purple */
    color: 'white',
    width: '100%',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '15px',
    fontWeight: '700',
    boxShadow: '0 6px 16px rgba(103, 58, 183, 0.35)',
  },
  phonePeLoading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
  },
  smallSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'pulseSteam 1s linear infinite',
  },
  phonePeSecurityLabel: {
    textAlign: 'center',
    fontSize: '10px',
    color: 'var(--color-text-muted)',
    fontWeight: '600',
  },
};
