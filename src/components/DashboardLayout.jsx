import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Tooltip,
  SwipeableDrawer,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  ShoppingCart,
  People,
  Assessment,
  Settings,
  Person,
  ChevronLeft,
  AccountCircle,
  ExitToApp,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import NotificationsMenu from './NotificationsMenu';
import { motion } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { toast } from 'react-toastify';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Products', icon: <Inventory />, path: '/products' },
  { text: 'Orders', icon: <ShoppingCart />, path: '/orders' },
  { text: 'Customers', icon: <People />, path: '/customers' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
];

const bottomMenuItems = [
  { text: 'Settings', icon: <Settings />, path: '/settings' },
  { text: 'Profile', icon: <Person />, path: '/profile' },
];

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileAction = (path) => {
    navigate(path);
    handleProfileMenuClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedRight: () => !open && setOpen(true),
    onSwipedLeft: () => open && setOpen(false),
    trackMouse: true,
  });

  const DrawerContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        minHeight: 64,
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          LaCasa Admin
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} edge="end">
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'background.default',
          }}
        >
          <Avatar src={currentUser?.photoURL} alt={currentUser?.displayName}>
            {currentUser?.email?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {currentUser?.displayName || currentUser?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Admin
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      <List sx={{ flex: 1, px: 2, py: 1 }}>
        {menuItems.map((item) => (
          <motion.div
            key={item.text}
            whileHover={{ x: 10 }}
            whileTap={{ scale: 0.95 }}
          >
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile) setOpen(false);
              }}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: '8px',
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </motion.div>
        ))}
      </List>

      <Divider />

      {!isMobile && (
        <List sx={{ px: 2, py: 1 }}>
          {bottomMenuItems.map((item) => (
            <motion.div
              key={item.text}
              whileHover={{ x: 10 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setOpen(false);
                }}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </motion.div>
          ))}
        </List>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }} {...swipeHandlers}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { md: open ? `${drawerWidth}px` : 0 },
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.drawer + 1,
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <NotificationsMenu />
          <Tooltip title="Account">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="large"
              edge="end"
              aria-label="account"
              aria-haspopup="true"
            >
              <AccountCircle />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1,
                },
              },
            }}
          >
            <MenuItem onClick={() => handleProfileAction('/profile')}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => handleProfileAction('/settings')}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <ExitToApp fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        {isMobile ? (
          <SwipeableDrawer
            variant="temporary"
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRight: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <DrawerContent />
          </SwipeableDrawer>
        ) : (
          <Drawer
            variant="persistent"
            open={open}
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                borderRight: `1px solid ${theme.palette.divider}`,
                height: '100%',
              },
            }}
          >
            <DrawerContent />
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { md: open ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
} 