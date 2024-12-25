import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  People,
  Inventory,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
} from '@mui/icons-material';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MotionCard = motion(Card);

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    recentOrders: [],
    salesData: {
      labels: [],
      datasets: [],
    },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch orders
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate metrics
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const totalOrders = orders.length;

        // Fetch customers
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const totalCustomers = customersSnapshot.size;

        // Fetch low stock products
        const lowStockSnapshot = await getDocs(
          query(collection(db, 'products'), where('stockQuantity', '<', 10))
        );
        const lowStockProducts = lowStockSnapshot.size;

        // Fetch recent orders
        const recentOrdersSnapshot = await getDocs(
          query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5))
        );
        const recentOrders = recentOrdersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Prepare sales data
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

        setDashboardData({
          totalRevenue,
          totalOrders,
          totalCustomers,
          lowStockProducts,
          recentOrders,
          salesData: {
            labels: last7Days,
            datasets: [
              {
                label: 'Daily Sales',
                data: salesByDay,
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.light,
                tension: 0.4,
              },
            ],
          },
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [theme.palette.primary.main, theme.palette.primary.light]);

  const StatCard = ({ title, value, icon: Icon, trend }) => (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      elevation={0}
      sx={{ borderRadius: 2 }}
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

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

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
        Dashboard
      </Typography>

      <Grid container spacing={isMobile ? 2 : 3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`$${dashboardData.totalRevenue.toLocaleString()}`}
            icon={TrendingUp}
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={dashboardData.totalOrders}
            icon={ShoppingCart}
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={dashboardData.totalCustomers}
            icon={People}
            trend={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Products"
            value={dashboardData.lowStockProducts}
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
                  data={dashboardData.salesData}
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
      </Grid>
    </Box>
  );
} 