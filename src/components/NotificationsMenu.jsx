import { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning,
  Info,
  CheckCircle,
  Error,
  ClearAll,
  DoneAll,
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsMenu() {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    notifications,
    unreadCount,
    clearNotifications,
    markAllAsRead,
    markAsRead,
    soundEnabled,
    setSoundEnabled,
  } = useNotifications();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notificationId) => {
    markAsRead(notificationId);
  };

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
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        aria-controls={open ? 'notifications-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ ml: 2 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="notifications-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            maxHeight: '80vh',
            width: 360,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          <Box>
            {notifications.length > 0 && (
              <>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSoundEnabled(!soundEnabled);
                  }}
                  title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
                >
                  {soundEnabled ? '🔔' : '🔕'}
                </IconButton>
                <IconButton size="small" onClick={markAllAsRead} title="Mark all as read">
                  <DoneAll />
                </IconButton>
                <IconButton size="small" onClick={clearNotifications} title="Clear all">
                  <ClearAll />
                </IconButton>
              </>
            )}
          </Box>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <MenuItem
                  onClick={() => handleNotificationClick(notification.id)}
                  sx={{
                    bgcolor: notification.unread ? 'action.hover' : 'transparent',
                    py: 1.5,
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
                    secondaryTypographyProps={{
                      variant: 'caption',
                    }}
                  />
                </MenuItem>
                <Divider />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </Menu>
    </>
  );
} 