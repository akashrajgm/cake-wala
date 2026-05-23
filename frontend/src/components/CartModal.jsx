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

  if (!isOpen) return null;

  const cartItems = Object.values(cart);
  const total = getCartTotal();

  const handleLandmarkChange = (index) => {
    setSelectedLandmark(index);
    setCustomAddress(PRESET_LANDMARKS[index].address);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) {
      onAuthClick();
      return;
    }
    
    const landmark = PRESET_LANDMARKS[selectedLandmark];
    const order = await placeOrder(customAddress, landmark.lat, landmark.lng);
    
    if (order) {
      onOrderSuccess();
      onClose();
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={styles.drawer} 
        onClick={(e) => e.stopPropagation()} 
        className="animate-pop-in"
      >
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
              <form onSubmit={handleCheckout} style={styles.checkoutForm}>
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

                <button 
                  type="submit" 
                  style={styles.checkoutSubmit}
                  disabled={loading}
                >
                  {loading ? "Placing Order..." : "Place Bakery Order & Track Live"}
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
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-text)',
    borderBottom: '1.5px solid var(--color-card-border)',
    paddingBottom: '6px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
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
};
