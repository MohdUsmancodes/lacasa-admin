import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { Inventory } from '@mui/icons-material';

const MotionBox = motion(Box);
const MotionTypography = motion(Typography);
const MotionIcon = motion(Inventory);

export default function SplashScreen({ onComplete }) {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      // Initial state
      await controls.start({
        scale: [0.5, 1],
        opacity: [0, 1],
        transition: { duration: 0.5, ease: 'easeOut' },
      });

      // Bounce effect
      await controls.start({
        y: [0, -20, 0],
        transition: {
          duration: 0.8,
          times: [0, 0.5, 1],
          ease: 'easeInOut',
        },
      });

      // Rotate and scale down
      await controls.start({
        rotate: [0, 360],
        scale: [1, 0.8],
        transition: { duration: 0.5, ease: 'easeInOut' },
      });

      // Final fade out
      await controls.start({
        opacity: 0,
        scale: 0.5,
        transition: { duration: 0.3, ease: 'easeOut' },
      });

      // Notify parent component
      onComplete();
    };

    sequence();
  }, [controls, onComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        zIndex: 9999,
      }}
    >
      <MotionBox
        animate={controls}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <MotionIcon
          sx={{
            fontSize: '4rem',
            color: 'primary.main',
          }}
        />
        <MotionTypography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: 'primary.main',
            textAlign: 'center',
          }}
        >
          LaCasa Admin
        </MotionTypography>
        <MotionTypography
          variant="subtitle1"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          Inventory Management System
        </MotionTypography>
      </MotionBox>
    </Box>
  );
} 