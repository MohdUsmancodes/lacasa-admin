import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const MotionCard = motion(Card);

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phoneNumber: currentUser?.phoneNumber || '',
    photoURL: currentUser?.photoURL || '',
  });

  const handleEditToggle = () => {
    if (editing) {
      setProfileData({
        displayName: currentUser?.displayName || '',
        email: currentUser?.email || '',
        phoneNumber: currentUser?.phoneNumber || '',
        photoURL: currentUser?.photoURL || '',
      });
    }
    setEditing(!editing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile({
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
      });
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Error updating profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            elevation={0}
            sx={{ borderRadius: 2 }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  editing && (
                    <IconButton
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                      size="small"
                    >
                      <PhotoCamera fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <Avatar
                  src={profileData.photoURL}
                  sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                />
              </Badge>
              <Typography variant="h6" gutterBottom>
                {profileData.displayName || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profileData.email}
              </Typography>
              <Button
                variant={editing ? 'contained' : 'outlined'}
                color={editing ? 'error' : 'primary'}
                startIcon={editing ? <CancelIcon /> : <EditIcon />}
                onClick={handleEditToggle}
                sx={{ mt: 2 }}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            elevation={0}
            sx={{ borderRadius: 2 }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  Personal Information
                </Typography>
                {editing && (
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    name="displayName"
                    value={profileData.displayName}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profileData.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </MotionCard>

          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            elevation={0}
            sx={{ borderRadius: 2, mt: 3 }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Security
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                sx={{ mr: 2 }}
              >
                Change Password
              </Button>
              <Button
                variant="outlined"
                color="primary"
              >
                Enable 2FA
              </Button>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
} 