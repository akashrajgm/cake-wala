import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { products, categories, fetchProducts, loading } = useStore();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategorySelect = (category) => {
    const newCat = selectedCategory === category ? null : category;
    setSelectedCategory(newCat);
    fetchProducts(newCat);
  };

  return (
    <div style={styles.container}>
      {/* Visual Bakery Store Banner */}
      <div style={styles.banner}>
        <div style={styles.bannerContent}>
          <span style={styles.bannerBadge}>Freshly Baked Daily 🌾</span>
          <h1 style={styles.bannerTitle}>Artisanal Sweetness Crafted with Love</h1>
          <p style={styles.bannerSub}>Premium gourmet ingredients, local recipes, baked fresh every single morning.</p>
        </div>
      </div>

      {/* Dynamic Category Pill Selector */}
      <div style={styles.categorySection}>
        <h3 style={styles.sectionHeader}>Explore Catalog 🥐</h3>
        <div style={styles.pillContainer}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                style={{
                  ...styles.pill,
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-solid)',
                  color: isSelected ? 'white' : 'var(--color-text)',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-card-border)',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog Grid */}
      <div style={styles.catalogSection}>
        {loading ? (
          <div style={styles.loaderContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loaderText}>Unlocking sweet delights...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={styles.emptyCatalog}>
            <span>🌾</span>
            <p>Our bakers are currently baking fresh batches. Check back in a moment!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '20px',
  },
  banner: {
    position: 'relative',
    backgroundColor: '#3E2723', // Dark cocoa color psychology
    backgroundImage: 'linear-gradient(135deg, #3E2723 0%, #2D1A17 100%)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px 24px',
    color: 'white',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-md)',
  },
  bannerContent: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'var(--color-accent)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    backdropFilter: 'blur(4px)',
  },
  bannerTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: '26px',
    fontWeight: '700',
    color: '#FCFBF7',
    lineHeight: '1.2',
  },
  bannerSub: {
    fontSize: '13px',
    color: '#D7CCC8',
    lineHeight: '1.4',
  },
  categorySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-text)',
    paddingLeft: '2px',
  },
  pillContainer: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '6px',
    scrollbarWidth: 'none', /* Firefox */
    msOverflowStyle: 'none',  /* IE 10+ */
  },
  pill: {
    flexShrink: 0,
    fontSize: '13px',
    fontWeight: '700',
    padding: '10px 18px',
    borderRadius: 'var(--radius-lg)',
    border: '1.5px solid var(--color-card-border)',
    boxShadow: 'var(--shadow-sm)',
  },
  catalogSection: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '200px',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 0',
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
  loaderText: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    fontWeight: '600',
  },
  emptyCatalog: {
    textAlign: 'center',
    padding: '40px',
    color: 'var(--color-text-muted)',
    fontSize: '14px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
};
