import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
} from '@mui/material';
import { QrCode, Delete, Add } from '@mui/icons-material';
import BarcodeScanner from './BarcodeScanner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion, AnimatePresence } from 'framer-motion';

const initialFormData = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  items: [],
  totalAmount: 0,
  status: 'pending',
};

export default function OrderDialog({ open, onClose, onSubmit, editData = null }) {
  const [formData, setFormData] = useState(editData || initialFormData);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleScan = async (barcode) => {
    setLoading(true);
    setError(null);
    try {
      const productRef = doc(db, 'products', barcode);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = productSnap.data();
        if (productData.stockQuantity > 0) {
          setFormData(prev => {
            const existingItemIndex = prev.items.findIndex(
              item => item.productCode === barcode
            );

            let newItems;
            if (existingItemIndex >= 0) {
              newItems = [...prev.items];
              newItems[existingItemIndex] = {
                ...newItems[existingItemIndex],
                quantity: newItems[existingItemIndex].quantity + 1,
                subtotal: (newItems[existingItemIndex].quantity + 1) * productData.retailPrice,
              };
            } else {
              newItems = [
                ...prev.items,
                {
                  productCode: barcode,
                  title: productData.title,
                  price: productData.retailPrice,
                  quantity: 1,
                  subtotal: productData.retailPrice,
                },
              ];
            }

            const totalAmount = newItems.reduce(
              (sum, item) => sum + item.subtotal,
              0
            );

            return {
              ...prev,
              items: newItems,
              totalAmount,
            };
          });
        } else {
          setError('Product is out of stock');
        }
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Error fetching product details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index) => {
    setFormData(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const totalAmount = newItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      return {
        ...prev,
        items: newItems,
        totalAmount,
      };
    });
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        quantity: newQuantity,
        subtotal: newQuantity * newItems[index].price,
      };
      
      const totalAmount = newItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      
      return {
        ...prev,
        items: newItems,
        totalAmount,
      };
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmit,
        }}
      >
        <DialogTitle>
          {editData ? 'Edit Order' : 'New Order'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="customerName"
                label="Customer Name"
                fullWidth
                required
                value={formData.customerName}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="customerEmail"
                label="Customer Email"
                type="email"
                fullWidth
                value={formData.customerEmail}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="customerPhone"
                label="Customer Phone"
                fullWidth
                value={formData.customerPhone}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="subtitle1">Products</Typography>
                <IconButton
                  onClick={() => setShowScanner(true)}
                  color="primary"
                  disabled={loading}
                >
                  <QrCode />
                </IconButton>
                {loading && <Typography variant="caption">Loading...</Typography>}
                {error && (
                  <Typography variant="caption" color="error">
                    {error}
                  </Typography>
                )}
              </Box>
              <List>
                <AnimatePresence>
                  {formData.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <ListItem>
                        <ListItemText
                          primary={item.title}
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              ${item.price.toFixed(2)} × {item.quantity} = ${item.subtotal.toFixed(2)}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          >
                            -
                          </IconButton>
                          <Typography
                            component="span"
                            sx={{ mx: 1 }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => removeItem(index)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </List>
              {formData.items.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ py: 4 }}
                >
                  Scan products to add them to the order
                </Typography>
              )}
              {formData.items.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Chip
                    label={`Total: $${formData.totalAmount.toFixed(2)}`}
                    color="primary"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={formData.items.length === 0}
          >
            {editData ? 'Update' : 'Create'} Order
          </Button>
        </DialogActions>
      </Dialog>

      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
    </>
  );
} 