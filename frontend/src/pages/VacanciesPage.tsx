import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import { Box, Button, Card, CardContent, CardHeader, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField, Typography, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WorkIcon from '@mui/icons-material/Work';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppSelector } from '../store/hooks';

type Vacancy = { id: string; title: string; description?: string; skills?: string[]; status: string; createdAt: string };

export default function VacanciesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const role = useAppSelector((s) => s.auth.user?.role);
  const token = useAppSelector((s) => s.auth.token);
  const isAuthenticated = !!token;
  
  const { data, error, isLoading } = useQuery({ 
    queryKey: ['vacancies'], 
    queryFn: async () => {
      const response = await api.get('/recruitment/vacancies');
      return response.data as Vacancy[];
    }
  });
  const [open, setOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState<{ open: boolean; vacancyId?: string }>(() => ({ open: false }));
  const [editing, setEditing] = useState<Vacancy | null>(null);
  const [form, setForm] = useState<{ title: string; description?: string; skillsText?: string; status: string }>({ title: '', status: 'OPEN' });
  const [applyForm, setApplyForm] = useState<{ email: string; firstName: string; lastName: string; coverLetter: string; file?: File }>({ email: '', firstName: '', lastName: '', coverLetter: '' });

  const save = async () => {
    const payload = { title: form.title, description: form.description, status: form.status, skills: form.skillsText ? form.skillsText.split(',').map((s) => s.trim()).filter(Boolean) : [] };
    if (editing) await api.put(`/recruitment/vacancies/${editing.id}`, payload);
    else await api.post('/recruitment/vacancies', payload);
    setOpen(false); setEditing(null); setForm({ title: '' }); await qc.invalidateQueries({ queryKey: ['vacancies'] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'success';
      case 'ON_HOLD': return 'warning';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Open';
      case 'ON_HOLD': return 'On Hold';
      case 'CLOSED': return 'Closed';
      default: return status;
    }
  };

  return (
    <AppBarShell>
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, px: 2 }}>
        {/* Enhanced Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                color: 'primary.main',
                letterSpacing: '-0.02em',
                mb: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <WorkIcon sx={{ fontSize: 32 }} />
              Vacancies
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.95rem'
              }}
            >
              Browse and manage open positions
            </Typography>
          </Box>
          {(role === 'ADMIN' || role === 'HR') && (
            <Button 
              variant="contained" 
              onClick={() => { setEditing(null); setForm({ title: '', status: 'OPEN' }); setOpen(true); }}
              startIcon={<AddIcon />}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 2,
                fontSize: '0.95rem',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Add Vacancy
            </Button>
          )}
        </Box>

        {/* Vacancies Grid */}
        <Grid container spacing={3}>
          {(data || []).map((v) => (
            <Grid key={v.id} item xs={12} sm={6} lg={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: 3,
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }} 
                onClick={() => navigate(`/recruitment/vacancies/${v.id}`)}
              >
                <CardHeader 
                  title={
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '1.2rem',
                        color: 'text.primary',
                        lineHeight: 1.3,
                        pr: 4
                      }}
                    >
                      {v.title}
                    </Typography>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={getStatusLabel(v.status)}
                        size="small"
                        color={getStatusColor(v.status) as any}
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                          {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  action={(role === 'ADMIN' || role === 'HR') && (
                    <IconButton 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm('Delete this vacancy?')) return;
                        try {
                          await api.delete(`/recruitment/vacancies/${v.id}`);
                          await qc.invalidateQueries({ queryKey: ['vacancies'] });
                        } catch (err: any) {
                          const status = err?.response?.status;
                          const msg = err?.response?.data?.error || err?.message || 'Failed to delete';
                          if (status === 409) {
                            const doForce = confirm(`${msg}\n\nForce delete with all related candidates and interviews?`);
                            if (doForce) {
                              await api.delete(`/recruitment/vacancies/${v.id}`, { params: { force: true } });
                              await qc.invalidateQueries({ queryKey: ['vacancies'] });
                              return;
                            }
                          }
                          alert(msg);
                        }
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'error.main',
                        '&:hover': {
                          bgcolor: 'error.light',
                          color: 'error.dark'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                  sx={{
                    pb: 1,
                    position: 'relative',
                    px: 3,
                    pt: 3
                  }}
                />
                <CardContent sx={{ flex: 1, p: 3, pt: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: 2,
                      color: 'text.secondary',
                      lineHeight: 1.6,
                      fontSize: '0.875rem',
                      minHeight: '3em',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {v.description || 'No description provided'}
                  </Typography>
                  
                  {(v.skills && v.skills.length > 0) && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {(v.skills || []).slice(0, 6).map((s) => (
                          <Chip 
                            key={s} 
                            size="small" 
                            label={s}
                            variant="outlined"
                            sx={{
                              fontSize: '0.75rem',
                              height: 26,
                              borderRadius: 2,
                              borderColor: 'divider',
                              color: 'text.secondary',
                              fontWeight: 500
                            }}
                          />
                        ))}
                      </Box>
                    </>
                  )}

                  {/* Show Apply button for candidates and unauthenticated users */}
                  {(role === 'CANDIDATE' || !isAuthenticated) && (
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Button 
                        variant="outlined" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (!isAuthenticated) {
                            // Redirect to login if not authenticated
                            if (confirm('You need to log in to apply for this position. Would you like to go to the login page?')) {
                              navigate('/login');
                            }
                            return;
                          }
                          setApplyOpen({ open: true, vacancyId: v.id }); 
                        }} 
                        disabled={v.status === 'ON_HOLD' || v.status === 'CLOSED'}
                        fullWidth
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          fontWeight: 600,
                          py: 1,
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: 2
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Apply Now
                      </Button>
                      {(v.status === 'ON_HOLD' || v.status === 'CLOSED') && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: 'block',
                            textAlign: 'center',
                            mt: 1,
                            fontSize: '0.75rem'
                          }}
                        >
                          {v.status === 'ON_HOLD' ? 'Vacancy is on hold.' : 'Vacancy is closed.'}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          {editing ? 'Edit Vacancy' : 'New Vacancy'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField 
              label="Title" 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField 
              label="Description" 
              multiline 
              minRows={3} 
              value={form.description || ''} 
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField 
              label="Skills (comma-separated)" 
              value={form.skillsText || ''} 
              onChange={(e) => setForm({ ...form, skillsText: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <FormControl 
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
              <InputLabel>Status</InputLabel>
              <Select 
                label="Status" 
                value={form.status} 
                onChange={(e) => setForm({ ...form, status: String(e.target.value) })}
              >
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="ON_HOLD">On Hold</MenuItem>
                <MenuItem value="CLOSED">Closed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setOpen(false)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={save} 
            disabled={!form.title}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={applyOpen.open} 
        onClose={() => setApplyOpen({ open: false })} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Apply</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField 
              label="Email" 
              type="email" 
              value={applyForm.email} 
              onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })} 
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="First name" 
                value={applyForm.firstName} 
                onChange={(e) => setApplyForm({ ...applyForm, firstName: e.target.value })}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <TextField 
                label="Last name" 
                value={applyForm.lastName} 
                onChange={(e) => setApplyForm({ ...applyForm, lastName: e.target.value })}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
            <TextField 
              label="Cover Letter" 
              multiline 
              minRows={4} 
              value={applyForm.coverLetter} 
              onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <Button 
              variant="outlined" 
              component="label"
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                py: 1.5
              }}
            >
              Upload Resume
              <input hidden type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setApplyForm({ ...applyForm, file: e.target.files?.[0] })} />
            </Button>
            {applyForm.file && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'success.main',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                {applyForm.file.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setApplyOpen({ open: false })}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={async () => {
              if (!applyOpen.vacancyId) return;
              const formData = new FormData();
              formData.append('email', applyForm.email);
              if (applyForm.firstName) formData.append('firstName', applyForm.firstName);
              if (applyForm.lastName) formData.append('lastName', applyForm.lastName);
              formData.append('coverLetter', applyForm.coverLetter || '');
              if (applyForm.file) formData.append('resume', applyForm.file);
              await api.post(`/recruitment/vacancies/${applyOpen.vacancyId}/apply`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
              setApplyOpen({ open: false }); setApplyForm({ email: '', firstName: '', lastName: '', coverLetter: '' });
            }} 
            disabled={!applyForm.email || (!applyForm.coverLetter && !applyForm.file)}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              fontWeight: 600
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </AppBarShell>
  );
}


