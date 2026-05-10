import { Card, CardContent, Typography, Box } from '@mui/material';

export default function StatCard({ title, value, unit, icon, color = 'primary.main' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="h2" sx={{ mt: 0.5, mb: 0.25, color: 'text.primary', fontWeight: 800 }}>
              {value ?? 0}
            </Typography>
            {unit && (
              <Typography variant="caption" color="text.secondary">{unit}</Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ color, opacity: 0.8, '& svg': { fontSize: 32 } }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
