import { Box, Typography } from '@mui/material';
import Sidebar from './Sidebar';

export default function PageLayout({ children, title }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {title && (
          <Typography variant="h1" sx={{ mb: 3, color: 'text.primary' }}>
            {title}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
}
