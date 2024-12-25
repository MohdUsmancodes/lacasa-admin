import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';

export default function BarcodeScanner({ open, onClose, onScan }) {
  const scannerRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    let scanner = null;
    
    if (open) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        try {
          scanner = new Html5QrcodeScanner(
            'barcode-reader',
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              showTorchButtonIfSupported: true,
            },
            false
          );
          
          scannerRef.current = scanner;
          
          scanner.render(
            (decodedText) => {
              if (scanner) {
                scanner.clear();
              }
              onScan(decodedText);
              onClose();
            },
            (error) => {
              console.warn(`Code scan error = ${error}`);
            }
          );
        } catch (error) {
          console.error('Error initializing scanner:', error);
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (scanner) {
          try {
            scanner.clear();
          } catch (error) {
            console.error('Error clearing scanner:', error);
          }
        }
      };
    }
  }, [open, onScan, onClose]);

  const handleClose = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.error('Error clearing scanner:', error);
      }
    }
    onClose();
  };

  return (
    <Dialog
      ref={dialogRef}
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      keepMounted={false}
      disablePortal
      PaperProps={{
        sx: {
          overflow: 'hidden',
          p: 2,
        },
      }}
      aria-labelledby="barcode-scanner-title"
    >
      <DialogTitle id="barcode-scanner-title">
        Scan Barcode
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Position the barcode within the scanning area
          </Typography>
          <div 
            id="barcode-reader" 
            style={{ 
              width: '100%',
              maxWidth: '600px',
              margin: '0 auto',
            }}
            role="application"
            aria-label="Barcode Scanner"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose}
          variant="outlined"
          tabIndex={0}
          autoFocus
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
} 