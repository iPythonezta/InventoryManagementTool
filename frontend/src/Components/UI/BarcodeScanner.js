import { Box, Button, Typography } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useZxing } from 'react-zxing';

export default function BarcodeScanner({ onScan, active, onClose, deviceId }) {
  const { ref } = useZxing({
    paused: !active,
    deviceId: deviceId || undefined,
    onDecodeResult: (result) => {
      if (active) onScan(result.text);
    },
    timeBetweenDecodingAttempts: 1,
  });

  if (!active) return null;

  return (
    <Box
      sx={{
        mt: 2, p: 2,
        border: '2px solid',
        borderColor: 'primary.main',
        borderRadius: 2,
        bgcolor: '#EFF6FF',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <QrCodeScannerIcon color="primary" fontSize="small" />
        <Typography variant="body2" color="primary" fontWeight={600}>
          Point camera at barcode
        </Typography>
      </Box>
      <video ref={ref} style={{ width: '100%', maxWidth: 280, borderRadius: 8 }} />
      <Button size="small" variant="outlined" color="error" onClick={onClose}>
        Stop Scanning
      </Button>
    </Box>
  );
}
