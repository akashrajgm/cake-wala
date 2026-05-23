import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';

export default function OrderHistory({ onBackToStore, onTrackOrder }) {
  const { orders, fetchMyOrders, loading } = useStore();
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  return (
    <div style={styles.container}>
      {/* Visual thermal Receipt Drawer Modal */}
      {selectedReceipt && (
        <div style={styles.overlay} onClick={() => setSelectedReceipt(null)}>
          <div style={styles.receiptDrawer} onClick={(e) => e.stopPropagation()} className="animate-pop-in">
            <div style={styles.receiptHeader}>
              <h3 style={styles.receiptHeaderTitle}>Thermal Receipt</h3>
              <button onClick={() => setSelectedReceipt(null)} style={styles.closeReceiptBtn}>✕</button>
            </div>
            
            <div style={styles.receiptPaper} id="printable-receipt">
              {/* Bakery Receipt logo details */}
              <div style={styles.paperBrand}>
                <h2>🍰 Cake-Wala</h2>
                <p>12th Main Rd, Indiranagar, Bangalore</p>
                <p>Phone: +919988776655</p>
                <p style={{ marginTop: '8px' }}>*** TAX INVOICE ***</p>
              </div>

              <div style={styles.paperDivider}>--------------------------------</div>

              <div style={styles.paperMetadata}>
                <p>ORDER ID: #{selectedReceipt.id.slice(0, 18).toUpperCase()}</p>
                <p>DATE: {new Date(selectedReceipt.created_at).toLocaleString()}</p>
                <p>PATRON PHONE: {selectedReceipt.phone || "+919988776655"}</p>
              </div>

              <div style={styles.paperDivider}>--------------------------------</div>

              {/* Items listing */}
              <div style={styles.paperItems}>
                {selectedReceipt.items.map((item, idx) => (
                  <div style={styles.paperItemRow} key={idx}>
                    <div style={styles.paperItemDetails}>
                      <span>{item.product.name}</span>
                      <span style={styles.itemQtyMultiplier}>x{item.quantity}</span>
                    </div>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={styles.paperDivider}>--------------------------------</div>

              <div style={styles.paperTotal}>
                <span>GRAND TOTAL</span>
                <strong>₹{selectedReceipt.total_price}</strong>
              </div>

              <div style={styles.paperDivider}>--------------------------------</div>

              <div style={styles.paperPayment}>
                <p>PAYMENT METHOD: {selectedReceipt.payment_method.toUpperCase()}</p>
                <p>PAYMENT STATUS: {selectedReceipt.payment_status.toUpperCase()}</p>
                <p style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  DELIVERY PIN: {selectedReceipt.destination_lat.toFixed(4)}, {selectedReceipt.destination_lng.toFixed(4)}
                </p>
              </div>

              <div style={styles.paperDivider}>--------------------------------</div>

              <div style={styles.paperFooter}>
                <p>Baked fresh with love!</p>
                <p>Thank you for your sweet support!</p>
                <p>Visit again soon 🧁</p>
              </div>
            </div>

            <div style={styles.receiptActions}>
              <button 
                onClick={() => window.print()} 
                style={styles.printBtn}
              >
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.historyHeader}>
        <button onClick={onBackToStore} style={styles.backBtn}>← Home</button>
        <h2 style={styles.title}>Your Order History 📜</h2>
      </div>

      {loading ? (
        <div style={styles.loaderContainer}>
          <div style={styles.spinner}></div>
          <p>Retrieving past receipts...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={styles.emptyContainer}>
          <span>🌾</span>
          <p style={styles.emptyText}>You haven't placed any bakery orders yet!</p>
          <button onClick={onBackToStore} style={styles.shopBtn}>Explore Treats</button>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map((order) => (
            <div key={order.id} style={styles.orderCard} className="animate-slide-up nav-shadow">
              <div style={styles.cardHeader}>
                <span style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span 
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: order.status === 'delivered' ? '#E8F5E9' : order.status === 'dispatched' ? '#FFF3E0' : '#EFEBE9',
                    color: order.status === 'delivered' ? '#2E7D32' : order.status === 'dispatched' ? '#E65100' : '#4E342E'
                  }}
                >
                  {order.status.toUpperCase()}
                </span>
              </div>
              
              <div style={styles.cardBody}>
                <p style={styles.itemsSummary}>
                  {order.items.map(item => `${item.product.name} (x${item.quantity})`).join(', ')}
                </p>
                
                <div style={styles.paymentInfoSummary}>
                  <span>💳 {order.payment_method.toUpperCase()}</span>
                  <span style={{ color: order.payment_status === 'completed' ? 'green' : 'var(--color-primary)' }}>
                    • {order.payment_status.toUpperCase()}
                  </span>
                </div>

                <div style={styles.cardFooter}>
                  <button 
                    onClick={() => setSelectedReceipt(order)} 
                    style={styles.billBtn}
                  >
                    🧾 View Bill
                  </button>
                  
                  {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                    <button 
                      onClick={() => onTrackOrder(order.id)} 
                      style={styles.trackBtn}
                    >
                      Track Live 🛵
                    </button>
                  ) : (
                    <button 
                      onClick={() => onTrackOrder(order.id)} 
                      style={styles.viewBtn}
                    >
                      Track Map
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px',
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '10px',
    borderBottom: '1.5px solid var(--color-card-border)',
  },
  backBtn: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '240px',
    gap: '14px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(211, 84, 0, 0.15)',
    borderTop: '3px solid var(--color-primary)',
    borderRadius: 'var(--radius-round)',
    animation: 'pulseSteam 1s linear infinite',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    textAlign: 'center',
    gap: '16px',
  },
  emptyText: {
    color: 'var(--color-text-muted)',
    fontSize: '14px',
  },
  shopBtn: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '700',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  orderCard: {
    backgroundColor: 'var(--color-surface-solid)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-card-border)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '12px 16px',
    borderBottom: '1.5px solid var(--color-card-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 27, 24, 0.01)',
  },
  orderDate: {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
  },
  statusBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '4px',
    letterSpacing: '0.5px',
  },
  cardBody: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  itemsSummary: {
    fontSize: '13px',
    color: 'var(--color-text)',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  paymentInfoSummary: {
    display: 'flex',
    gap: '10px',
    fontSize: '12px',
    fontWeight: '600',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px dashed var(--color-card-border)',
    paddingTop: '12px',
  },
  trackBtn: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    fontSize: '12px',
    fontWeight: '700',
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    boxShadow: '0 4px 8px rgba(211, 84, 0, 0.15)',
  },
  billBtn: {
    backgroundColor: 'white',
    color: 'var(--color-text)',
    fontSize: '12px',
    fontWeight: '700',
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-primary)',
  },
  viewBtn: {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '12px',
    fontWeight: '700',
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-card-border)',
  },

  /* --- THERMAL RECEIPT DRAWER STYLES --- */
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  receiptDrawer: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--color-card-border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  receiptHeader: {
    padding: '16px 20px',
    borderBottom: '1.5px solid var(--color-card-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptHeaderTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  closeReceiptBtn: {
    fontSize: '18px',
    color: 'var(--color-text-muted)',
  },
  receiptPaper: {
    padding: '24px 20px',
    backgroundColor: '#FFFFFC', /* Light paper finish */
    fontFamily: 'Courier, monospace', /* Traditional receipt typewriter font */
    color: '#000000',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '440px',
    overflowY: 'auto',
  },
  paperBrand: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  paperDivider: {
    textAlign: 'center',
    fontSize: '12px',
    letterSpacing: '-1.5px',
    opacity: 0.5,
  },
  paperMetadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
  },
  paperItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  paperItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: '13px',
  },
  paperItemDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    maxWidth: '220px',
  },
  itemQtyMultiplier: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  paperTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px',
    fontWeight: '800',
  },
  paperPayment: {
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  paperFooter: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '12px',
    marginTop: '10px',
  },
  receiptActions: {
    padding: '16px',
    borderTop: '1.5px solid var(--color-card-border)',
    display: 'flex',
    justifyContent: 'center',
  },
  printBtn: {
    width: '100%',
    backgroundColor: 'var(--color-text)',
    color: 'white',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '700',
    fontSize: '14px',
    textAlign: 'center',
  },
};
