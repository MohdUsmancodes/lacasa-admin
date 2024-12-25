import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, where, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Create audio element with the correct public path
    audioRef.current = new Audio('/assets/notification.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.5;
    
    // Enable sound on first user interaction
    const enableSound = async () => {
      try {
        if (audioRef.current) {
          setHasInteracted(true);
          // Try to play and immediately pause to enable audio
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    // Add event listeners for user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => document.addEventListener(event, enableSound, { once: true }));

    return () => {
      events.forEach(event => document.removeEventListener(event, enableSound));
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = async () => {
    if (!soundEnabled || !audioRef.current || !hasInteracted) return;

    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
      if (error.name === 'NotAllowedError') {
        setSoundEnabled(false);
      }
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    // Listen for low stock notifications
    const productsQuery = query(
      collection(db, 'products'),
      where('stockQuantity', '<', 10)
    );

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const product = change.doc.data();
          if (product.stockQuantity < 10) {
            addNotification({
              type: 'warning',
              message: `Low stock alert: ${product.title} (${product.stockQuantity} remaining)`,
              timestamp: new Date(),
              unread: true,
            });
          }
        }
      });
    });

    // Listen for new orders
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && change.doc.data().createdAt) {
          const order = change.doc.data();
          // Only show notification for new orders, not existing ones
          const orderTime = order.createdAt.toDate();
          const now = new Date();
          if (now - orderTime < 1000 * 60) { // Within the last minute
            addNotification({
              type: 'success',
              message: `New order received from ${order.customer?.name || 'Unknown Customer'}`,
              timestamp: new Date(),
              unread: true,
            });

            // Update product stock quantities
            order.items.forEach(async (item) => {
              const productRef = doc(db, 'products', item.id);
              try {
                await updateDoc(productRef, {
                  stockQuantity: increment(-item.quantity)
                });
              } catch (error) {
                console.error('Error updating stock quantity:', error);
                addNotification({
                  type: 'error',
                  message: `Failed to update stock for ${item.title}`,
                  timestamp: new Date(),
                  unread: true,
                });
              }
            });
          }
        }
        if (change.type === 'modified') {
          const order = change.doc.data();
          addNotification({
            type: 'info',
            message: `Order #${change.doc.id.slice(-6)} status updated to ${order.status}`,
            timestamp: new Date(),
            unread: true,
          });
        }
      });
    });

    // Listen for customer updates
    const customersQuery = query(
      collection(db, 'customers'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const customer = change.doc.data();
          addNotification({
            type: 'info',
            message: `Customer ${customer.name}'s information updated`,
            timestamp: new Date(),
            unread: true,
          });
        }
      });
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeCustomers();
    };
  }, [currentUser]);

  const addNotification = async (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: new Date(),
      unread: true,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    if (hasInteracted) {
      await playNotificationSound();
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      unread: false,
    })));
    setUnreadCount(0);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(notification => {
      if (notification.id === notificationId && notification.unread) {
        setUnreadCount(count => Math.max(0, count - 1));
        return { ...notification, unread: false };
      }
      return notification;
    }));
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    clearNotifications,
    markAllAsRead,
    markAsRead,
    soundEnabled,
    setSoundEnabled,
    hasInteracted,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
} 