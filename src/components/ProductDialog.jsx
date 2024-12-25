import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { PhotoCamera, QrCode } from '@mui/icons-material';
import BarcodeScanner from './BarcodeScanner';

const categories = [
  'Electronics',
  'Clothing',
  'Food',
  'Beverages',
  'Home & Garden',
  'Other',
];

const initialFormData = {
  productCode: '',
  title: '',
  retailPrice: '',
  wholesalePrice: '',
  category: '',
  discount: '0',
  stockQuantity: '',
  supplier: '',
  barcode: '',
};

export default function ProductDialog({ open, onClose, onSubmit, editData = null }) {
  const [formData, setFormData] = useState(editData || initialFormData);
  const [showScanner, setShowScanner] = useState(false);

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

  const handleScan = (result) => {
    setFormData(prev => ({
      ...prev,
      barcode: result,
      productCode: result,
    }));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmit,
        }}
      >
        <DialogTitle>
          {editData ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  name="productCode"
                  label="Product Code"
                  fullWidth
                  required
                  value={formData.productCode}
                  onChange={handleInputChange}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowScanner(true)}
                        edge="end"
                        sx={{ color: 'primary.main' }}
                      >
                        <QrCode />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
              {formData.barcode && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Barcode: {formData.barcode}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Title"
                fullWidth
                required
                value={formData.title}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="retailPrice"
                label="Retail Price"
                type="number"
                fullWidth
                required
                value={formData.retailPrice}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="wholesalePrice"
                label="Wholesale Price"
                type="number"
                fullWidth
                required
                value={formData.wholesalePrice}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="category"
                label="Category"
                select
                fullWidth
                required
                value={formData.category}
                onChange={handleInputChange}
              >
                {categories.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="stockQuantity"
                label="Stock Quantity"
                type="number"
                fullWidth
                required
                value={formData.stockQuantity}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="discount"
                label="Discount %"
                type="number"
                fullWidth
                value={formData.discount}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="supplier"
                label="Supplier"
                fullWidth
                required
                value={formData.supplier}
                onChange={handleInputChange}
              />
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
          >
            {editData ? 'Update' : 'Add'} Product
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