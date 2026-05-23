import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import LiveMap from '../components/LiveMap';

export default function TrackOrder({ orderId, onBackToStore }) {
  const { fetchOrderDetails, token, activeOrder, setActiveOrder } = useStore();
  const [order, setOrder] = useState(null);
  const [riderCoords, setRiderCoords] = useState({ lat: 12.97189, lng: 77.64115 });
  const [eta, setEta] = useState(25);
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);

  // 1. Fetch initial order record on mount
  useEffect(() => {
    const loadOrder = async () => {
      const data = await fetchOrderDetails(orderId);
      if (data) {
        setOrder(data);
        setStatus(data.status);
        if (data.tracking) {
          setRiderCoords({
            lat: data.tracking.current_lat,
            lng: data.tracking.current_lng
          });
          setEta(data.tracking.eta_minutes);
        }
      } else {
        setError("Could not retrieve tracking details.");
      }
    };
    loadOrder();
  }, [orderId]);

  // 2. Connect WebSocket for Real-Time Coordinates
  useEffect(() => {
    if (!orderId) return;

    const baseApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsUri = baseApiUrl.replace(/^http/, "ws") + `/ws/track/${orderId}`;
    console.log(`Connecting to Delivery stream: ${wsUri}`);
    
    const ws = new WebSocket(wsUri);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to delivery tracking WebSocket channel.");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WebSocket Broadcast Frame:", data);
      
      if (data.type === "tracking_update") {
        setRiderCoords({
          lat: data.current_lat,
          lng: data.current_lng
        });
        setEta(data.eta_minutes);
        setStatus(data.status);
        
        // Sync back global activeOrder if needed
        if (data.status === "delivered" && activeOrder) {
          setActiveOrder(prev => prev ? { ...prev, status: "delivered" } : null);
        }
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket channel closed.");
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [orderId]);

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={onBackToStore} style={styles.backBtn}>Return to Store</button>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.spinner}></div>
        <p>Loading tracking feeds...</p>
      </div>
    );
  }

  // Stepper calculations based on active status
  const steps = ["pending", "preparing", "dispatched", "delivered"];
  const currentStepIdx = steps.indexOf(status);

  return (
    <div style={styles.container}>
      {/* Title & Floating Header */}
      <div style={styles.trackHeader}>
        <button onClick={onBackToStore} style={styles.backBtnText}>← Home</button>
        <h2 style={styles.title}>Track Order 🏍️</h2>
        <span style={styles.orderLabel}>ID: #{orderId.slice(0, 8)}</span>
      </div>

      {/* ETA Countdown Block */}
      <div style={styles.etaBox} className="glass nav-shadow animate-slide-up">
        {status === "delivered" ? (
          <div style={styles.arrivedSection}>
            <span style={styles.arrivedIcon}>🎉</span>
            <div>
              <h3 style={styles.arrivedTitle}>Your Order Has Arrived!</h3>
              <p style={styles.arrivedSub}>Baked fresh, delivered hot. Enjoy your treats!</p>
            </div>
          </div>
        ) : (
          <div style={styles.etaContent}>
            <div style={styles.etaText}>
              <span style={styles.etaLabel}>ESTIMATED ARRIVAL TIME</span>
              <h1 style={styles.etaClock}>
                {eta} <span style={{ fontSize: '20px', fontWeight: '600' }}>mins</span>
              </h1>
            </div>
            <div style={styles.riderBox}>
              <span style={styles.riderAvatar}>🛵</span>
              <div>
                <h4 style={styles.riderName}>Express Rider</h4>
                <p style={styles.riderStatus}>
                  {status === "pending" && "Waiting for kitchen..."}
                  {status === "preparing" && "Chef is baking your cakes!"}
                  {status === "dispatched" && "Rider is heading your way!"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stepper Status Visualization */}
      <div style={styles.stepperBox} className="animate-slide-up">
        <div style={styles.progressLine}>
          <div 
            style={{
              ...styles.progressBar,
              width: `${(currentStepIdx / (steps.length - 1)) * 100}%`
            }}
          />
        </div>
        
        <div style={styles.stepsContainer}>
          <div style={styles.stepCol}>
            <div style={{ ...styles.stepDot, backgroundColor: currentStepIdx >= 0 ? 'var(--color-primary)' : '#DFDCD8' }}>📝</div>
            <span style={styles.stepLabelText}>Placed</span>
          </div>
          <div style={styles.stepCol}>
            <div style={{ ...styles.stepDot, backgroundColor: currentStepIdx >= 1 ? 'var(--color-primary)' : '#DFDCD8' }}>🍳</div>
            <span style={styles.stepLabelText}>Baking</span>
          </div>
          <div style={styles.stepCol}>
            <div style={{ ...styles.stepDot, backgroundColor: currentStepIdx >= 2 ? 'var(--color-primary)' : '#DFDCD8' }}>🛵</div>
            <span style={styles.stepLabelText}>On Way</span>
          </div>
          <div style={styles.stepCol}>
            <div style={{ ...styles.stepDot, backgroundColor: currentStepIdx >= 3 ? 'var(--color-primary)' : '#DFDCD8' }}>🍰</div>
            <span style={styles.stepLabelText}>Delivered</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Component */}
      <div style={styles.mapSection} className="animate-slide-up">
        <LiveMap 
          bakeryLat={12.97189}
          bakeryLng={77.64115}
          customerLat={order.destination_lat}
          customerLng={order.destination_lng}
          riderLat={riderCoords.lat}
          riderLng={riderCoords.lng}
        />
      </div>

      {/* Delivery details card */}
      <div style={styles.detailsCard} className="animate-slide-up">
        <h4 style={styles.detailsHeader}>Delivery Details</h4>
        <div style={styles.detailsBody}>
          <p style={styles.detailRow}>
            <span style={styles.detailLabel}>Recipient Address:</span>
            <span style={styles.detailValue}>{order.delivery_address}</span>
          </p>
          <p style={styles.detailRow}>
            <span style={styles.detailLabel}>Invoice Total:</span>
            <span style={{ ...styles.detailValue, fontWeight: '700', color: 'var(--color-primary)' }}>₹{order.total_price}</span>
          </p>
        </div>
      </div>
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
  trackHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '10px',
    borderBottom: '1.5px solid var(--color-card-border)',
  },
  backBtnText: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--color-text)',
  },
  orderLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    backgroundColor: 'var(--color-card-border)',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  etaBox: {
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-card-border)',
  },
  arrivedSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  arrivedIcon: {
    fontSize: '44px',
  },
  arrivedTitle: {
    fontSize: '18px',
    fontFamily: 'var(--font-serif)',
    fontWeight: '700',
  },
  arrivedSub: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  etaContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaText: {
    display: 'flex',
    flexDirection: 'column',
  },
  etaLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.5px',
  },
  etaClock: {
    fontSize: '32px',
    fontWeight: '800',
    color: 'var(--color-primary)',
    lineHeight: '1',
    marginTop: '4px',
  },
  riderBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderLeft: '1.5px solid var(--color-card-border)',
    paddingLeft: '16px',
  },
  riderAvatar: {
    fontSize: '28px',
  },
  riderName: {
    fontSize: '14px',
    fontWeight: '700',
  },
  riderStatus: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
  },
  stepperBox: {
    position: 'relative',
    padding: '10px 0',
  },
  progressLine: {
    position: 'absolute',
    top: '32px',
    left: '32px',
    right: '32px',
    height: '4px',
    backgroundColor: '#DFDCD8',
    zIndex: 1,
    borderRadius: '2px',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '2px',
    transition: 'width var(--transition-smooth)',
  },
  stepsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  stepCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    width: '64px',
  },
  stepDot: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius-round)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '16px',
    color: 'white',
    boxShadow: 'var(--shadow-sm)',
    border: '2px solid white',
    transition: 'background-color var(--transition-smooth)',
  },
  stepLabelText: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
  },
  mapSection: {
    width: '100%',
  },
  detailsCard: {
    backgroundColor: 'var(--color-surface-solid)',
    borderRadius: 'var(--radius-md)',
    padding: '18px',
    border: '1px solid var(--color-card-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  detailsHeader: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-card-border)',
    paddingBottom: '6px',
  },
  detailsBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
  },
  detailValue: {
    fontSize: '13px',
    color: 'var(--color-text)',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    textAlign: 'center',
    gap: '16px',
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
};
