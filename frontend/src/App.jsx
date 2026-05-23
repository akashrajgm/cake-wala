import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import Header from './components/Header';
import CartModal from './components/CartModal';
import Home from './pages/Home';
import Auth from './pages/Auth';
import TrackOrder from './pages/TrackOrder';
import OrderHistory from './pages/OrderHistory';
import './index.css';

function MainApp() {
  const { activeOrder, setActiveOrder, token, user } = useStore();
  
  // Navigation states
  const [screen, setScreen] = useState("home"); // home, history, track
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // Modal states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
  };

  const handleOrderSuccess = () => {
    setIsCartOpen(false);
    if (activeOrder) {
      setSelectedOrderId(activeOrder.id);
      setScreen("track");
    } else {
      // In case state hasn't flushed synchronously, read it from context
      setScreen("history");
    }
  };

  const handleTrackOrderTrigger = (orderId) => {
    setSelectedOrderId(orderId);
    setScreen("track");
  };

  return (
    <div className="app-container">
      {/* Dynamic Floating Brand Header */}
      <Header 
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
        onHistoryClick={() => setScreen("history")}
      />

      {/* Screen Routing Grid */}
      <main style={{ flexGrow: 1 }}>
        {screen === "home" && <Home />}
        
        {screen === "history" && (
          <OrderHistory 
            onBackToStore={() => setScreen("home")}
            onTrackOrder={handleTrackOrderTrigger}
          />
        )}
        
        {screen === "track" && (
          <TrackOrder 
            orderId={selectedOrderId || (activeOrder && activeOrder.id)}
            onBackToStore={() => {
              setActiveOrder(null);
              setScreen("home");
            }}
          />
        )}
      </main>

      {/* Elegant Bottom Floating Mobile Nav Bar (Zomato Style) */}
      {screen === "home" && (
        <div style={styles.bottomNav} className="glass nav-shadow">
          <button 
            onClick={() => setScreen("home")} 
            style={{ ...styles.navItem, color: 'var(--color-primary)' }}
          >
            <span style={styles.navIcon}>🍰</span>
            <span style={styles.navLabel}>Treats</span>
          </button>
          
          <button 
            onClick={() => token ? setScreen("history") : setIsAuthOpen(true)}
            style={{ ...styles.navItem, color: screen === "history" ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <span style={styles.navIcon}>📜</span>
            <span style={styles.navLabel}>Orders</span>
          </button>

          <button 
            onClick={() => token ? setIsCartOpen(true) : setIsAuthOpen(true)}
            style={styles.navItem}
          >
            <span style={styles.navIcon}>🛒</span>
            <span style={styles.navLabel}>Cart</span>
          </button>
        </div>
      )}

      {/* Modals & Dialog Portals */}
      <CartModal 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onAuthClick={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
        onOrderSuccess={handleOrderSuccess}
      />

      {isAuthOpen && (
        <Auth 
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
}

// Master App Wrapper putting Context at root
export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}

const styles = {
  bottomNav: {
    position: 'fixed',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '480px',
    height: '68px',
    backgroundColor: 'var(--color-surface)',
    borderTop: '1px solid var(--color-card-border)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 900,
    paddingBottom: '4px',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    color: 'var(--color-text-muted)',
  },
  navIcon: {
    fontSize: '20px',
  },
  navLabel: {
    fontSize: '11px',
    fontWeight: '700',
  },
};
