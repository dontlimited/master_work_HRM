import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';

export default function PageHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between', 
      alignItems: isMobile ? 'flex-start' : 'center',
      gap: isMobile ? 2 : 0,
      mb: { xs: 2, sm: 3 }
    }}>
      <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {actions && (
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          width: isMobile ? '100%' : 'auto',
          '& button': {
            width: isMobile ? '100%' : 'auto'
          }
        }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}


