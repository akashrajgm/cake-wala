import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';

export default function OrderHistory({ onBackToStore, onTrackOrder }) {
  const { orders, fetchMyOrders, loading } = useStore();

  useEffect(() => {
    fetchMyOrders();
  }, []);

  return (
    <div style={styles.container}>
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
                <div style={styles.cardFooter}>
                  <div style={styles.priceContainer}>
                    <span style={styles.totalLabel}>Total Paid:</span>
                    <span style={styles.totalPrice}>₹{order.total_price}</span>
                  </div>
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
                      View Details
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
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px dashed var(--color-card-border)',
    paddingTop: '12px',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  totalLabel: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  totalPrice: {
    fontSize: '16px',
    fontWeight: '800',
    color: 'var(--color-text)',
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
  viewBtn: {
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text)',
    fontSize: '12px',
    fontWeight: '700',
    padding: '8px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--color-card-border)',
  },
};
