import { Typography, Grid, Card, CardHeader, CardContent, Skeleton, Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import RateReviewIcon from '@mui/icons-material/RateReview';
import EventBusyIcon from '@mui/icons-material/EventBusy';

export default function DashboardPage() {
  const { data: summary, isLoading, error } = useQuery({ queryKey: ['summary'], queryFn: async () => (await api.get('/analytics/summary')).data as { employees: number; openVacancies: number; pendingReviewsToday: number; leaveToday: number } });
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.user?.role);
  return (
    <AppBarShell>
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
        {/* Enhanced Header Section */}
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Box sx={{ 
            mb: 1.5,
            '& .MuiTypography-root': {
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.75rem' },
              color: 'primary.main',
              letterSpacing: '-0.02em',
              textAlign: 'center'
            }
          }}>
            <PageHeader title="Welcome to HRM Dashboard" />
          </Box>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '1.1rem',
              maxWidth: 600,
              mx: 'auto',
              mt: 1
            }}
          >
          
          </Typography>
        </Box>

        {/* KPI Cards Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                }
              }} 
              onClick={() => navigate('/employees')}
            >
              <CardContent sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }} 
                  />
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    fontSize: '0.95rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    opacity: 0.9
                  }}
                >
                  Employees
                </Typography>
                {isLoading ? (
                  <Skeleton height={56} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                ) : (
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      lineHeight: 1.2
                    }}
                  >
                    {summary?.employees ?? 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                }
              }} 
              onClick={() => navigate('/recruitment/vacancies')}
            >
              <CardContent sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <WorkIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }} 
                  />
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    fontSize: '0.95rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    opacity: 0.9
                  }}
                >
                  Open Vacancies
                </Typography>
                {isLoading ? (
                  <Skeleton height={56} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                ) : (
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      lineHeight: 1.2
                    }}
                  >
                    {summary?.openVacancies ?? 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                }
              }} 
              onClick={() => navigate(role === 'ADMIN' ? '/performance/admin' : '/performance')}
            >
              <CardContent sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <RateReviewIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }} 
                  />
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    fontSize: '0.95rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    opacity: 0.9
                  }}
                >
                  Pending Reviews (Today)
                </Typography>
                {isLoading ? (
                  <Skeleton height={56} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                ) : (
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      lineHeight: 1.2
                    }}
                  >
                    {summary?.pendingReviewsToday ?? 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                height: '100%',
                borderRadius: 3,
                boxShadow: 3,
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                }
              }} 
              onClick={() => navigate('/time')}
            >
              <CardContent sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <EventBusyIcon sx={{ fontSize: 40, opacity: 0.9 }} />
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }} 
                  />
                </Box>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    fontSize: '0.95rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    opacity: 0.9
                  }}
                >
                  On Leave (Today)
                </Typography>
                {isLoading ? (
                  <Skeleton height={56} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
                ) : (
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '2.5rem', md: '3rem' },
                      lineHeight: 1.2
                    }}
                  >
                    {summary?.leaveToday ?? 0}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Error Message */}
        {error && (
          <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Failed to load summary. Please check backend analytics endpoint.
            </Typography>
          </Box>
        )}
      </Box>
    </AppBarShell>
  );
}



