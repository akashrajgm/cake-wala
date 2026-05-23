import React from 'react';
import { useStore } from '../context/StoreContext';

export default function ProductCard({ product }) {
  const { addToCart, cart } = useStore();
  const cartItem = cart[product.id];
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div style={styles.card} className="animate-slide-up nav-shadow">
      <div style={styles.imageWrapper}>
        <img 
          src={product.image_url} 
          alt={product.name} 
          style={styles.image} 
          loading="lazy"
        />
        <span style={styles.categoryBadge}>{product.category}</span>
        {quantity > 0 && <span style={styles.qtyBadge}>{quantity}</span>}
      </div>
      
      <div style={styles.content}>
        <h3 style={styles.title}>{product.name}</h3>
        <p style={styles.description}>{product.description}</p>
        
        <div style={styles.footer}>
          <div style={styles.priceContainer}>
            <span style={styles.currency}>₹</span>
            <span style={styles.price}>{parseInt(product.price)}</span>
          </div>
          
          <button 
            onClick={() => addToCart(product)} 
            style={styles.addBtn}
            title="Add item to Cart"
          >
            Add +
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-surface-solid)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--color-card-border)',
    transition: 'transform var(--transition-smooth)',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '180px',
    backgroundColor: '#EAE5DB',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform var(--transition-smooth)',
  },
  categoryBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    backgroundColor: 'rgba(252, 251, 247, 0.9)',
    color: 'var(--color-text)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(44, 27, 24, 0.05)',
  },
  qtyBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    fontSize: '12px',
    fontWeight: '700',
    width: '26px',
    height: '26px',
    borderRadius: 'var(--radius-round)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'var(--shadow-sm)',
    border: '2px solid white',
  },
  content: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: '8px',
  },
  title: {
    fontSize: '17px',
    fontFamily: 'var(--font-serif)',
    fontWeight: '700',
    lineHeight: '1.25',
    color: 'var(--color-text)',
  },
  description: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    lineHeight: '1.4',
    flexGrow: 1,
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    color: 'var(--color-text)',
  },
  currency: {
    fontSize: '14px',
    fontWeight: '600',
    marginRight: '2px',
  },
  price: {
    fontSize: '20px',
    fontWeight: '800',
  },
  addBtn: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    fontWeight: '700',
    fontSize: '13px',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 4px 10px rgba(211, 84, 0, 0.25)',
  },
};
