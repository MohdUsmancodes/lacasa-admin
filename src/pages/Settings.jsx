import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery,
  IconButton,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { toast } from 'react-toastify';
import { DarkMode, LightMode } from '@mui/icons-material';

const MotionCard = motion(Card);

export default function Settings() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser, toggleDarkMode, isDarkMode } = useAuth();
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordChange = async () => {
    setError('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Create credential with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );

      // Reauthenticate user
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwordData.newPassword);
      
      toast.success('Password updated successfully');
      setOpenPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else {
        setError('Failed to update password. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        sx={{ 
          mb: isMobile ? 2 : 4, 
          fontWeight: 600,
          textAlign: isMobile ? 'center' : 'left' 
        }}
      >
        Settings
      </Typography>

      <Stack spacing={isMobile ? 2 : 3}>
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          elevation={0}
          sx={{ borderRadius: 2 }}
        >
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 3, fontWeight: 600 }}>
              Appearance
            </Typography>
            <Stack 
              direction="row" 
              alignItems="center" 
              justifyContent="space-between"
              spacing={2}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" color="primary">
                  {isDarkMode ? <DarkMode /> : <LightMode />}
                </IconButton>
                <Typography>Dark Mode</Typography>
              </Box>
              <Switch
                checked={isDarkMode}
                onChange={toggleDarkMode}
                color="primary"
              />
            </Stack>
          </CardContent>
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          elevation={0}
          sx={{ borderRadius: 2 }}
        >
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 3, fontWeight: 600 }}>
              Account Security
            </Typography>
            <Stack spacing={2}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Logged in as: {currentUser?.email}
              </Alert>
              <Button
                variant="outlined"
                onClick={() => setOpenPasswordDialog(true)}
                fullWidth={isMobile}
              >
                Change Password
              </Button>
            </Stack>
          </CardContent>
        </MotionCard>
      </Stack>

      <Dialog 
        open={openPasswordDialog} 
        onClose={() => {
          setOpenPasswordDialog(false);
          setError('');
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              error={error === 'Current password is incorrect'}
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              error={error === 'Password should be at least 6 characters'}
              helperText="Password must be at least 6 characters"
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              error={error === 'New passwords do not match'}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => {
              setOpenPasswordDialog(false);
              setError('');
              setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePasswordChange}
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 