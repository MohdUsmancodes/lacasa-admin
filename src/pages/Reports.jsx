import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  IconButton,
  Tooltip,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  People,
  Inventory,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  AttachMoney,
} from '@mui/icons-material';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

const MotionCard = motion(Card);

export default function Reports() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders for total revenue and order count
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate total revenue and order count
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const totalOrders = orders.length;

        // Fetch customers count
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const totalCustomers = customersSnapshot.size;

        // Fetch low stock products
        const productsSnapshot = await getDocs(
          query(collection(db, 'products'), where('stockQuantity', '<', 10))
        );
        const lowStockProducts = productsSnapshot.size;

        setStats({
          totalRevenue,
          totalOrders,
          totalCustomers,
          lowStockProducts,
        });

        // Fetch recent orders
        const recentOrdersSnapshot = await getDocs(
          query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5))
        );
        const recentOrdersData = recentOrdersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentOrders(recentOrdersData);

        // Prepare sales data for chart
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toLocaleDateString();
        }).reverse();

        const salesByDay = last7Days.map(date => {
          const dayOrders = orders.filter(order => {
            const orderDate = order.createdAt?.toDate().toLocaleDateString();
            return orderDate === date;
          });
          return dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        });

        setSalesData({
          labels: last7Days,
          datasets: [
            {
              label: 'Sales',
              data: salesByDay,
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.light,
              tension: 0.4,
            },
          ],
        });

        // Fetch top products
        const productsWithSales = {};
        orders.forEach(order => {
          order.items?.forEach(item => {
            if (!productsWithSales[item.id]) {
              productsWithSales[item.id] = {
                ...item,
                totalSales: 0,
                totalQuantity: 0,
              };
            }
            productsWithSales[item.id].totalSales += item.retailPrice * item.quantity;
            productsWithSales[item.id].totalQuantity += item.quantity;
          });
        });

        const topProductsData = Object.values(productsWithSales)
          .sort((a, b) => b.totalSales - a.totalSales)
          .slice(0, 5);
        setTopProducts(topProductsData);

        // Fetch top customers
        const customersWithOrders = {};
        orders.forEach(order => {
          const customerId = order.customer?.id;
          if (customerId) {
            if (!customersWithOrders[customerId]) {
              customersWithOrders[customerId] = {
                ...order.customer,
                totalSpent: 0,
                orderCount: 0,
              };
            }
            customersWithOrders[customerId].totalSpent += order.total || 0;
            customersWithOrders[customerId].orderCount += 1;
          }
        });

        const topCustomersData = Object.values(customersWithOrders)
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, 5);
        setTopCustomers(topCustomersData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching reports data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [theme.palette.primary.main, theme.palette.primary.light]);

  const StatCard = ({ title, value, icon: Icon, trend }) => (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      elevation={0}
      sx={{ height: '100%', borderRadius: 2 }}
    >
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Stack 
          direction={isMobile ? "column" : "row"} 
          spacing={2} 
          alignItems={isMobile ? "center" : "flex-start"}
        >
          <Avatar
            sx={{
              backgroundColor: 'primary.light',
              color: 'primary.main',
              width: isMobile ? 40 : 48,
              height: isMobile ? 40 : 48,
            }}
          >
            <Icon />
          </Avatar>
          <Box sx={{ 
            textAlign: isMobile ? 'center' : 'left',
            flex: 1 
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600 }}>
              {typeof value === 'number' && value % 1 === 0
                ? value.toLocaleString()
                : typeof value === 'number'
                ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          {trend && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mt: isMobile ? 1 : 0 
            }}>
              <Typography
                variant="body2"
                color={trend > 0 ? 'success.main' : 'error.main'}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {trend > 0 ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </MotionCard>
  );

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
        Reports & Analytics
      </Typography>

      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={AttachMoney}
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingCart}
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={People}
            trend={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Products"
            value={stats.lowStockProducts}
            icon={Inventory}
            trend={-3}
          />
        </Grid>

        <Grid item xs={12}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            elevation={0}
            sx={{ borderRadius: 2 }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 1 : 0
              }}>
                <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 600 }}>
                  Sales Overview
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <Box sx={{ height: isMobile ? 200 : 300 }}>
                <Line
                  data={salesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          display: true,
                          color: theme.palette.divider,
                        },
                        ticks: {
                          font: {
                            size: isMobile ? 10 : 12
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          font: {
                            size: isMobile ? 10 : 12
                          },
                          maxRotation: isMobile ? 45 : 0
                        }
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            elevation={0}
            sx={{ borderRadius: 2 }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
                mb: 2, 
                fontWeight: 600,
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Recent Orders
              </Typography>
              <TableContainer sx={{ 
                maxWidth: '100%',
                overflow: 'auto'
              }}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Order ID</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Customer</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>#{order.id.slice(-6)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.customer?.name || 'N/A'}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>${order.total?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            elevation={0}
            sx={{ borderRadius: 2 }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
                mb: 2, 
                fontWeight: 600,
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Top Products
              </Typography>
              <TableContainer sx={{ 
                maxWidth: '100%',
                overflow: 'auto'
              }}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Product</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Sales</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{product.title}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>${product.totalSales.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{product.totalQuantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            elevation={0}
            sx={{ borderRadius: 2 }}
          >
            <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ 
                mb: 2, 
                fontWeight: 600,
                textAlign: isMobile ? 'center' : 'left'
              }}>
                Top Customers
              </Typography>
              <TableContainer sx={{ 
                maxWidth: '100%',
                overflow: 'auto'
              }}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>Customer</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Orders</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Total Spent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            whiteSpace: 'nowrap'
                          }}>
                            <Avatar
                              sx={{
                                width: isMobile ? 20 : 24,
                                height: isMobile ? 20 : 24,
                                mr: 1,
                                backgroundColor: 'primary.light',
                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                              }}
                            >
                              {customer.name?.charAt(0)}
                            </Avatar>
                            {customer.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{customer.orderCount}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>${customer.totalSpent.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
} 