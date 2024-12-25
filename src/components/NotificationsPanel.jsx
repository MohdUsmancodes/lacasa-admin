import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning,
  Info,
  CheckCircle,
  Error,
  Close,
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const notificationSound = new Audio('/notification.mp3');

export default function NotificationsPanel({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { notifications, clearNotifications, markAllAsRead } = useNotifications();
  const [playSound, setPlaySound] = useState(true);

  useEffect(() => {
    if (playSound && notifications.length > 0 && notifications[0].unread) {
      notificationSound.play().catch(error => console.log('Error playing sound:', error));
    }
  }, [notifications, playSound]);

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <Warning sx={{ color: 'warning.main' }} />;
      case 'success':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'error':
        return <Error sx={{ color: 'error.main' }} />;
      default:
        return <Info sx={{ color: 'info.main' }} />;
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 400,
          p: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Notifications
        </Typography>
        <Box>
          <IconButton size="small" onClick={() => setPlaySound(!playSound)} sx={{ mr: 1 }}>
            {playSound ? '🔔' : '🔕'}
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      {notifications.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={clearNotifications}
            >
              Clear all
            </Typography>
          </Box>
          <List>
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ListItem
                    sx={{
                      bgcolor: notification.unread ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      {getIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.message}
                      secondary={getTimeAgo(notification.timestamp)}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: notification.unread ? 600 : 400,
                      }}
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </>
      ) : (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No notifications</Typography>
        </Box>
      )}
    </Drawer>
  );
} 