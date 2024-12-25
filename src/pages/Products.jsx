import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
} from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, QrCode } from '@mui/icons-material';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import ProductDialog from '../components/ProductDialog';
import BarcodeScanner from '../components/BarcodeScanner';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddProduct = () => {
    setEditData(null);
    setOpenDialog(true);
  };

  const handleEditProduct = (product) => {
    setEditData(product);
    setOpenDialog(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Error deleting product');
      console.error(error);
    }
  };

  const handleScanProduct = async (barcode) => {
    const product = products.find(p => p.barcode === barcode);
    if (product) {
      setSelectedProduct(product);
      setEditData(product);
      setOpenDialog(true);
    } else {
      toast.info('Product not found. Add it as a new product?');
      setEditData({ barcode });
      setOpenDialog(true);
    }
  };

  const handleDialogSubmit = async (formData) => {
    try {
      const productData = {
        ...formData,
        retailPrice: Number(formData.retailPrice) || 0,
        wholesalePrice: Number(formData.wholesalePrice) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        discount: Number(formData.discount) || 0,
        updatedAt: new Date(),
      };

      if (editData?.id) {
        // Update existing product
        await updateDoc(doc(db, 'products', editData.id), productData);
        toast.success('Product updated successfully');
      } else {
        // Add new product
        const docRef = await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date(),
        });
        toast.success('Product added successfully');
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error saving product');
    }
  };

  const columns = [
    { field: 'productCode', headerName: 'Code', width: 130 },
    { field: 'title', headerName: 'Title', width: 200 },
    {
      field: 'retailPrice',
      headerName: 'Retail Price',
      width: 130,
      renderCell: (params) => {
        const value = params.value || 0;
        return `$${Number(value).toFixed(2)}`;
      },
    },
    {
      field: 'wholesalePrice',
      headerName: 'Wholesale',
      width: 130,
      renderCell: (params) => {
        const value = params.value || 0;
        return `$${Number(value).toFixed(2)}`;
      },
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value || 'N/A'}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'stockQuantity',
      headerName: 'Stock',
      width: 100,
      renderCell: (params) => {
        const value = params.value || 0;
        return (
          <Chip
            label={value}
            size="small"
            color={value < 10 ? 'error' : 'success'}
          />
        );
      },
    },
    {
      field: 'discount',
      headerName: 'Discount',
      width: 100,
      renderCell: (params) => {
        const value = params.value || 0;
        return value > 0 ? (
          <Chip
            label={`${value}%`}
            size="small"
            color="secondary"
          />
        ) : '-';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton
              onClick={() => handleEditProduct(params.row)}
              size="small"
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              onClick={() => handleDeleteProduct(params.row.id)}
              size="small"
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Products
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<QrCode />}
              onClick={() => setShowScanner(true)}
            >
              Scan Product
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
            >
              Add Product
            </Button>
          </Box>
        </Box>

        {products.length === 0 && !loading ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No products found. Add some products to get started.
          </Alert>
        ) : (
          <Card>
            <DataGrid
              rows={products}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              checkboxSelection
              disableSelectionOnClick
              autoHeight
              loading={loading}
              components={{
                Toolbar: GridToolbar,
              }}
              sx={{
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            />
          </Card>
        )}
      </Box>

      <ProductDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleDialogSubmit}
        editData={editData}
      />

      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanProduct}
      />
    </motion.div>
  );
} 