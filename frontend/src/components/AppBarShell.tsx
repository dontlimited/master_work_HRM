import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, useMediaQuery, useTheme, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '../store/slices/authSlice';

export default function AppBarShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const role = useAppSelector((s) => s.auth.user?.role);
  const token = useAppSelector((s) => s.auth.token);
  const isAuthenticated = !!token;
  const qc = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Navigation items for authenticated users
  const authenticatedNavigationItems = [
    { label: 'Dashboard', path: '/', roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { label: 'Employees', path: '/employees', roles: ['ADMIN', 'HR'] },
    { label: 'Departments', path: '/departments', roles: ['ADMIN', 'HR'] },
    { label: 'Positions', path: '/positions', roles: ['ADMIN', 'HR'] },
    { label: 'Recruitment', path: '/recruitment/vacancies', roles: ['ADMIN', 'HR', 'EMPLOYEE', 'CANDIDATE'] },
    { label: 'Time', path: '/time', roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { label: 'Learning', path: '/learning', roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { label: '360 Feedback', path: '/performance', roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
    { label: '360 Admin', path: '/performance/admin', roles: ['ADMIN'] },
  ].filter(item => role && item.roles.includes(role));

  // Navigation items for unauthenticated users (public access)
  const publicNavigationItems = [
    { label: 'Vacancies', path: '/recruitment/vacancies' },
  ];

  // Use appropriate navigation items based on authentication status
  const navigationItems = isAuthenticated ? authenticatedNavigationItems : publicNavigationItems;

  const handleLogout = () => {
    qc.clear();
    dispatch(logout());
    navigate('/login');
    setMobileOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6">HRM</Typography>
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              onClick={handleDrawerToggle}
              selected={location.pathname === item.path}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        {isAuthenticated && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </>
        )}
        {!isAuthenticated && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogin}>
                <LoginIcon sx={{ mr: 1, fontSize: 20 }} />
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography 
            variant="h6" 
            component={Link}
            to={isAuthenticated ? '/' : '/recruitment/vacancies'}
            sx={{ 
              flexGrow: isMobile ? 0 : 1, 
              mr: isMobile ? 2 : 0,
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer'
            }}
          >
            HRM
          </Typography>
          {!isMobile && (
            <>
              {navigationItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  component={Link}
                  to={item.path}
                  sx={{
                    backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {isAuthenticated ? (
                <Button 
                  color="inherit" 
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                >
                  Logout
                </Button>
              ) : (
                <Button 
                  color="inherit" 
                  onClick={handleLogin}
                  startIcon={<LoginIcon />}
                  sx={{
                    ml: 'auto'
                  }}
                >
                  Login
                </Button>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 3 } }}>{children}</Container>
    </Box>
  );
}


