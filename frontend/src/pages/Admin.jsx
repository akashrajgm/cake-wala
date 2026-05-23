import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';

export default function Admin({ onBackToStore }) {
  const { 
    products, 
    fetchProducts, 
    fetchAdminAnalytics, 
    adminAddProduct, 
    adminUpdateProduct, 
    adminDeleteProduct, 
    loading 
  } = useStore();

  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("analytics"); // analytics, inventory
  const [showAddForm, setShowAddForm] = useState(false);

  // New product form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600");
  const [category, setCategory] = useState("Cakes");
  const [isAvailable, setIsAvailable] = useState(true);

  const loadData = async () => {
    await fetchProducts();
    const data = await fetchAdminAnalytics();
    if (data) {
      setAnalytics(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStockToggle = async (productId, currentStatus) => {
    const updated = await adminUpdateProduct(productId, { is_available: !currentStatus });
    if (updated) {
      loadData();
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this bakery SKU?")) {
      const deleted = await adminDeleteProduct(productId);
      if (deleted) {
        loadData();
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const newProd = {
      name,
      description,
      price: parseFloat(price),
      image_url: imageUrl,
      category,
      is_available: isAvailable
    };

    const added = await adminAddProduct(newProd);
    if (added) {
      setShowAddForm(false);
      setName("");
      setDescription("");
      setPrice("");
      loadData();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header section */}
      <div style={styles.adminHeader}>
        <button onClick={onBackToStore} style={styles.backBtn}>← Home</button>
        <h2 style={styles.title}>Admin Panel 👑</h2>
      </div>

      {/* Tabs selectors */}
      <div style={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab("analytics")}
          style={{
            ...styles.tab,
            color: activeTab === "analytics" ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === "analytics" ? '3px solid var(--color-primary)' : 'none'
          }}
        >
          Sales Charts
        </button>
        <button 
          onClick={() => setActiveTab("inventory")}
          style={{
            ...styles.tab,
            color: activeTab === "inventory" ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: activeTab === "inventory" ? '3px solid var(--color-primary)' : 'none'
          }}
        >
          Bakery Stock
        </button>
      </div>

      {/* 1. SALES CHARTS TAB */}
      {activeTab === "analytics" && (
        <div style={styles.analyticsTab} className="animate-slide-up">
          {analytics ? (
            <>
              {/* Metric Card grid */}
              <div style={styles.metricsGrid}>
                <div style={styles.metricCard} className="nav-shadow">
                  <span style={styles.metricIcon}>💰</span>
                  <span style={styles.metricLabel}>TOTAL EARNINGS</span>
                  <h2 style={styles.metricValue}>₹{analytics.total_revenue}</h2>
                </div>
                <div style={styles.metricCard} className="nav-shadow">
                  <span style={styles.metricIcon}>🧾</span>
                  <span style={styles.metricLabel}>TOTAL INVOICES</span>
                  <h2 style={styles.metricValue}>{analytics.total_orders}</h2>
                </div>
                <div style={styles.metricCard} className="nav-shadow">
                  <span style={styles.metricIcon}>👥</span>
                  <span style={styles.metricLabel}>UNIQUE CUSTOMERS</span>
                  <h2 style={styles.metricValue}>{analytics.unique_customers}</h2>
                </div>
              </div>

              {/* Top Selling Products lists */}
              <div style={styles.chartCard} className="nav-shadow">
                <h4 style={styles.chartHeader}>Top Selling Bakery SKUs 📈</h4>
                {analytics.top_selling_products.length === 0 ? (
                  <p style={styles.emptyText}>No sales recorded yet. Place checkout orders to track analytics!</p>
                ) : (
                  <div style={styles.topProductsList}>
                    {analytics.top_selling_products.map((prod, idx) => (
                      <div key={idx} style={styles.topProductRow}>
                        <div style={styles.topProductInfo}>
                          <span style={styles.topProductRank}>{idx + 1}</span>
                          <div>
                            <h5 style={styles.topProductName}>{prod.name}</h5>
                            <span style={styles.topProductCat}>{prod.category}</span>
                          </div>
                        </div>
                        <div style={styles.topProductStats}>
                          <span>x{prod.quantity_sold} sold</span>
                          <strong style={{ color: 'var(--color-primary)' }}>₹{prod.revenue}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={styles.loaderContainer}>
              <div style={styles.spinner}></div>
              <p>Calculating sales metrics...</p>
            </div>
          )}
        </div>
      )}

      {/* 2. BAKERY INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div style={styles.inventoryTab} className="animate-slide-up">
          <div style={styles.inventoryActions}>
            <button 
              onClick={() => setShowAddForm(true)} 
              style={styles.addBtn}
            >
              Add New Treat +
            </button>
          </div>

          {/* Add SKU popup form modal */}
          {showAddForm && (
            <div style={styles.overlay} onClick={() => setShowAddForm(false)}>
              <form 
                onSubmit={handleAddSubmit} 
                style={styles.formCard}
                onClick={(e) => e.stopPropagation()}
                className="animate-pop-in"
              >
                <div style={styles.formHeader}>
                  <h4>Add Bakery Product</h4>
                  <button type="button" onClick={() => setShowAddForm(false)} style={styles.closeFormBtn}>✕</button>
                </div>
                
                <div style={styles.formBody}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Product Title</label>
                    <input type="text" placeholder="Gourmet Cupcake" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
                      <option value="Cakes">Cakes</option>
                      <option value="Pastries">Pastries</option>
                      <option value="Breads">Breads</option>
                      <option value="Cookies">Cookies</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Pricing (INR)</label>
                    <input type="number" placeholder="150" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Image URL</label>
                    <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea 
                      placeholder="High fidelity description of the dessert..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>

                  <button type="submit" style={styles.submitBtn}>Save SKU to Store</button>
                </div>
              </form>
            </div>
          )}

          {/* Inventory lists */}
          <div style={styles.inventoryList}>
            {products.map((product) => (
              <div key={product.id} style={styles.inventoryItemCard} className="nav-shadow">
                <img src={product.image_url} alt={product.name} style={styles.inventoryItemImg} />
                <div style={styles.inventoryItemInfo}>
                  <h4 style={styles.inventoryItemName}>{product.name}</h4>
                  <span style={styles.inventoryItemCat}>{product.category} • ₹{product.price}</span>
                </div>
                
                <div style={styles.inventoryControls}>
                  <button 
                    onClick={() => handleStockToggle(product.id, product.is_available)}
                    style={{
                      ...styles.stockBtn,
                      backgroundColor: product.is_available ? '#E8F5E9' : '#FFEBEE',
                      color: product.is_available ? '#2E7D32' : '#D32F2F',
                    }}
                  >
                    {product.is_available ? "In Stock" : "Sold Out"}
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    style={styles.deleteBtn}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
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
  adminHeader: {
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
  tabsContainer: {
    display: 'flex',
    gap: '20px',
    borderBottom: '1px solid var(--color-card-border)',
  },
  tab: {
    padding: '12px 4px',
    fontSize: '14px',
    fontWeight: '700',
  },
  analyticsTab: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '14px',
  },
  metricCard: {
    backgroundColor: 'var(--color-surface-solid)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    border: '1.5px solid var(--color-card-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative',
    overflow: 'hidden',
  },
  metricIcon: {
    position: 'absolute',
    right: '16px',
    top: '20px',
    fontSize: '32px',
    opacity: 0.15,
  },
  metricLabel: {
    fontSize: '10px',
    fontWeight: '800',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.8px',
  },
  metricValue: {
    fontSize: '26px',
    fontWeight: '800',
    color: 'var(--color-text)',
  },
  chartCard: {
    backgroundColor: 'var(--color-surface-solid)',
    borderRadius: 'var(--radius-md)',
    padding: '20px',
    border: '1.5px solid var(--color-card-border)',
  },
  chartHeader: {
    fontSize: '14px',
    fontWeight: '700',
    borderBottom: '1px solid var(--color-card-border)',
    paddingBottom: '8px',
    marginBottom: '14px',
  },
  emptyText: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    padding: '20px',
  },
  topProductsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  topProductRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    borderBottom: '1px dashed var(--color-card-border)',
    paddingBottom: '8px',
  },
  topProductInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  topProductRank: {
    fontSize: '12px',
    fontWeight: '800',
    backgroundColor: 'rgba(211, 84, 0, 0.05)',
    color: 'var(--color-primary)',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topProductName: {
    fontSize: '13px',
    fontWeight: '700',
  },
  topProductCat: {
    fontSize: '10px',
    color: 'var(--color-text-muted)',
  },
  topProductStats: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  inventoryTab: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inventoryActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  addBtn: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: '700',
    boxShadow: 'var(--shadow-sm)',
  },
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
  formCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'var(--color-bg)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  },
  formHeader: {
    padding: '18px 24px',
    borderBottom: '1px solid var(--color-card-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeFormBtn: {
    fontSize: '18px',
    color: 'var(--color-text-muted)',
  },
  formBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
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
  },
  submitBtn: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    width: '100%',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    fontWeight: '700',
    marginTop: '10px',
  },
  inventoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  inventoryItemCard: {
    backgroundColor: 'var(--color-surface-solid)',
    borderRadius: 'var(--radius-md)',
    padding: '10px',
    border: '1.5px solid var(--color-card-border)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  inventoryItemImg: {
    width: '46px',
    height: '46px',
    borderRadius: 'var(--radius-sm)',
    objectFit: 'cover',
  },
  inventoryItemInfo: {
    flexGrow: 1,
  },
  inventoryItemName: {
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'var(--font-serif)',
  },
  inventoryItemCat: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
  },
  inventoryControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  stockBtn: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
  },
  deleteBtn: {
    fontSize: '14px',
    padding: '6px',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    gap: '14px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid rgba(211, 84, 0, 0.1)',
    borderTop: '3px solid var(--color-primary)',
    borderRadius: '50%',
    animation: 'pulseSteam 1s linear infinite',
  },
};
