import React, { createContext, useState, useEffect, useContext } from 'react';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  
  // Core States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cakewala_cart');
    return savedCart ? JSON.parse(savedCart) : {};
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('cakewala_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cakewala_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('cakewala_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync Auth to LocalStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('cakewala_token', token);
      localStorage.setItem('cakewala_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cakewala_token');
      localStorage.removeItem('cakewala_user');
    }
  }, [token, user]);

  // --- CATALOG APIS ---
  const fetchProducts = async (category = null) => {
    setLoading(true);
    try {
      let url = `${API_URL}/products`;
      if (category) url += `?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load catalog products.");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/products/categories`);
      if (!res.ok) throw new Error("Failed to load categories.");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  // --- CART MUTATIONS ---
  const addToCart = (product) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[product.id]) {
        updated[product.id].quantity += 1;
      } else {
        updated[product.id] = { product, quantity: 1 };
      }
      return updated;
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[productId]) {
        updated[productId].quantity = quantity;
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const getCartTotal = () => {
    return Object.values(cart).reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((count, item) => count + item.quantity, 0);
  };

  // --- PASSWORDLESS PHONE OTP APIS ---
  const sendOTP = async (phone) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to generate OTP.");
      }
      
      // Returns the OTP generated so our PWA can display it in sandbox mode!
      return data.otp;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (phone, otp, fullName = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, full_name: fullName })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Invalid OTP code.");
      }
      
      setToken(data.access_token);
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    clearCart();
    setOrders([]);
    setActiveOrder(null);
  };

  // --- ORDER APIS ---
  const placeOrder = async (deliveryAddress, destLat, destLng, paymentMethod = "COD", paymentStatus = "pending") => {
    if (!token) {
      setError("Please sign in to place an order.");
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    const itemsPayload = Object.keys(cart).map(pid => ({
      product_id: pid,
      quantity: cart[pid].quantity
    }));
    
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          items: itemsPayload,
          delivery_address: deliveryAddress,
          destination_lat: destLat,
          destination_lng: destLng,
          payment_method: paymentMethod,
          payment_status: paymentStatus
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Checkout failed.");
      
      clearCart();
      setActiveOrder(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/orders/user/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load past orders.");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to retrieve order details.");
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(err.message);
      return null;
    }
  };

  // --- UPGRADES: ADMIN CORE REST CALLS ---
  
  const fetchAdminAnalytics = async () => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/admin/analytics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load admin analytics.");
      const data = await res.json();
      return data;
    } catch (err) {
      console.error(err.message);
      return null;
    }
  };

  const adminAddProduct = async (productData) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create product SKU.");
      await fetchProducts(); // Refresh storefront products catalog
      return data;
    } catch (err) {
      console.error(err.message);
      return null;
    }
  };

  const adminUpdateProduct = async (productId, productData) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update product SKU.");
      await fetchProducts(); // Refresh storefront products catalog
      return data;
    } catch (err) {
      console.error(err.message);
      return null;
    }
  };

  const adminDeleteProduct = async (productId) => {
    if (!token) return false;
    try {
      const res = await fetch(`${API_URL}/admin/products/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to delete product SKU.");
      }
      await fetchProducts(); // Refresh storefront products catalog
      return true;
    } catch (err) {
      console.error(err.message);
      return false;
    }
  };

  // Auto-run core fetches
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  return (
    <StoreContext.Provider value={{
      API_URL,
      products,
      categories,
      cart,
      token,
      user,
      orders,
      activeOrder,
      loading,
      error,
      setActiveOrder,
      fetchProducts,
      fetchCategories,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      getCartTotal,
      getCartCount,
      sendOTP,
      verifyOTP,
      logoutUser,
      placeOrder,
      fetchMyOrders,
      fetchOrderDetails,
      fetchAdminAnalytics,
      adminAddProduct,
      adminUpdateProduct,
      adminDeleteProduct
    }}>
      {children}
    </StoreContext.Provider>
  );
};
