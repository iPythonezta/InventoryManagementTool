import { Chip } from '@mui/material';

const colorMap = {
  admin: { bgcolor: '#FEF3C7', color: '#92400E' },
  manager: { bgcolor: '#DBEAFE', color: '#1D4ED8' },
  cashier: { bgcolor: '#D1FAE5', color: '#065F46' },
};

export default function RoleBadge({ role }) {
  const normalized = role?.toLowerCase() || 'cashier';
  const colors = colorMap[normalized] || colorMap.cashier;
  return (
    <Chip
      label={role?.charAt(0).toUpperCase() + role?.slice(1).toLowerCase()}
      size="small"
      sx={{ ...colors, fontWeight: 700, fontSize: '0.6875rem' }}
    />
  );
}
