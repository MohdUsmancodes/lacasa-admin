import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
  useMediaQuery,
  Autocomplete,
  InputAdornment,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart,
  Receipt,
  QrCode as QrCodeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { collection, addDoc, getDocs, serverTimestamp, doc, getDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { DataGrid } from '@mui/x-data-grid';
import BarcodeScanner from '../components/BarcodeScanner';

const MotionCard = motion(Card);

const initialCustomerData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  type: 'retail',
};

export default function Orders() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openCart, setOpenCart] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState(initialCustomerData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);

        // Fetch customers
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const customersData = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(customersData);

        // Fetch orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product) => {
    if (!product.stockQuantity || product.stockQuantity === 0) {
      toast.error('Product is out of stock');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        toast.error(`Only ${product.stockQuantity} items available in stock`);
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQuantity) }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success('Product added to cart');
  };

  const handleUpdateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const product = products.find(p => p.id === productId);
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) return null;
        if (newQuantity > product.stockQuantity) {
          toast.error(`Only ${product.stockQuantity} items available in stock`);
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    toast.success('Product removed from cart');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.retailPrice * item.quantity), 0);
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateCustomer = async () => {
    try {
      // Validate required fields
      if (!newCustomerData.name || !newCustomerData.phone) {
        toast.error('Name and phone are required');
        return;
      }

      // Create new customer in Firestore
      const customerRef = await addDoc(collection(db, 'customers'), {
        ...newCustomerData,
        createdAt: serverTimestamp(),
      });

      // Get the new customer data with ID
      const newCustomer = {
        id: customerRef.id,
        ...newCustomerData,
      };

      // Update customers list
      setCustomers(prev => [...prev, newCustomer]);

      // Select the new customer
      setSelectedCustomer(newCustomer);

      // Reset form
      setNewCustomerData(initialCustomerData);
      setShowNewCustomerForm(false);

      toast.success('Customer created successfully');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      toast.error('Please select or create a customer');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Check stock availability for all items
    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (!product || item.quantity > product.stockQuantity) {
        toast.error(`Insufficient stock for ${item.title}`);
        return;
      }
    }

    try {
      const batch = writeBatch(db);

      // Update product stock quantities
      cart.forEach(item => {
        const productRef = doc(db, 'products', item.id);
        batch.update(productRef, {
          stockQuantity: increment(-item.quantity)
        });
      });

      // Create the order
      const order = {
        customer: {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone,
        },
        items: cart.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.retailPrice,
          total: item.quantity * item.retailPrice,
        })),
        total: calculateTotal(),
        createdAt: serverTimestamp(),
        status: 'completed',
        updatedAt: serverTimestamp(),
      };

      // Add the order to Firestore
      const orderRef = await addDoc(collection(db, 'orders'), order);

      // Commit the batch to update stock quantities
      await batch.commit();

      // Update local products state
      setProducts(prevProducts => 
        prevProducts.map(product => {
          const cartItem = cart.find(item => item.id === product.id);
          if (cartItem) {
            return {
              ...product,
              stockQuantity: product.stockQuantity - cartItem.quantity
            };
          }
          return product;
        })
      );

      setCart([]);
      setSelectedCustomer(null);
      setOpenCart(false);
      toast.success('Order completed successfully!');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  };

  const handleScanProduct = async (barcode) => {
    try {
      // First try to find the product by barcode
      const product = products.find(p => p.barcode === barcode);
      
      if (product) {
        handleAddToCart(product);
      } else {
        // If not found by barcode, try to find by product code
        const productByCode = products.find(p => p.productCode === barcode);
        if (productByCode) {
          handleAddToCart(productByCode);
        } else {
          toast.error('Product not found');
        }
      }
    } catch (error) {
      console.error('Error scanning product:', error);
      toast.error('Error scanning product');
    }
  };

  const columns = [
    { 
      field: 'id', 
      headerName: 'Order ID',
      width: 130,
      renderCell: (params) => `#${params.value.slice(-6)}`,
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: 200,
      valueGetter: (params) => {
        const customer = params.value;
        return customer?.name || 'N/A';
      },
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 130,
      renderCell: (params) => `$${params.value?.toLocaleString()}`,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'completed' ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 180,
      valueGetter: (params) => params.value?.toDate().toLocaleString(),
    },
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Orders
            </Typography>
            <Button
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => setOpenCart(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s',
              }}
            >
              New Order
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            elevation={0}
            sx={{ borderRadius: 2 }}
          >
            <CardContent>
              <DataGrid
                rows={orders}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                autoHeight
                loading={loading}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: theme.palette.background.default,
                    borderBottom: `2px solid ${theme.palette.divider}`,
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              />
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      <Dialog
        open={openCart}
        onClose={() => setOpenCart(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            New Order
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => option.name || ''}
                    value={selectedCustomer}
                    onChange={(_, newValue) => {
                      setSelectedCustomer(newValue);
                      if (newValue) setShowNewCustomerForm(false);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Customer"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<PersonIcon />}
                    onClick={() => {
                      setShowNewCustomerForm(!showNewCustomerForm);
                      setSelectedCustomer(null);
                    }}
                  >
                    New Customer
                  </Button>
                </Box>

                <Collapse in={showNewCustomerForm}>
                  <Paper sx={{ p: 2, mb: 2 }} elevation={0} variant="outlined">
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                      New Customer Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="name"
                          label="Customer Name"
                          fullWidth
                          required
                          value={newCustomerData.name}
                          onChange={handleNewCustomerChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="phone"
                          label="Phone"
                          fullWidth
                          required
                          value={newCustomerData.phone}
                          onChange={handleNewCustomerChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="email"
                          label="Email"
                          type="email"
                          fullWidth
                          value={newCustomerData.email}
                          onChange={handleNewCustomerChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="type"
                          label="Customer Type"
                          select
                          fullWidth
                          required
                          value={newCustomerData.type}
                          onChange={handleNewCustomerChange}
                          SelectProps={{
                            native: true,
                          }}
                        >
                          <option value="retail">Retail</option>
                          <option value="wholesale">Wholesale</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="address"
                          label="Address"
                          fullWidth
                          multiline
                          rows={2}
                          value={newCustomerData.address}
                          onChange={handleNewCustomerChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          onClick={handleCreateCustomer}
                          fullWidth
                        >
                          Create Customer
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Collapse>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => {
                    if (!option.title) return '';
                    return `${option.title} (${option.productCode || 'No Code'}) - $${option.retailPrice || 0}`;
                  }}
                  onChange={(_, newValue) => newValue && handleAddToCart(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Add Products"
                      variant="outlined"
                      fullWidth
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  sx={{ flex: 1 }}
                />
                <Tooltip title="Scan Product">
                  <Button
                    variant="outlined"
                    onClick={() => setShowScanner(true)}
                    startIcon={<QrCodeIcon />}
                  >
                    Scan
                  </Button>
                </Tooltip>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell align="right">${item.retailPrice}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                            >
                              <RemoveIcon />
                            </IconButton>
                            <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                            >
                              <AddIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          ${(item.retailPrice * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {cart.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Total:
                          </Typography>
                        </TableCell>
                        <TableCell align="right" colSpan={2}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            ${calculateTotal().toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setOpenCart(false)}
            sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCheckout}
            startIcon={<Receipt />}
            disabled={cart.length === 0 || (!selectedCustomer && !showNewCustomerForm)}
            sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
          >
            Complete Order
          </Button>
        </DialogActions>
      </Dialog>

      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanProduct}
      />
    </Box>
  );
} 