import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import { Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, TextField, Typography, Chip, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SchoolIcon from '@mui/icons-material/School';
import { useState } from 'react';

type Position = { id: string; title: string; description?: string; grade?: string; salaryMin?: number; salaryMax?: number; competencies?: string[] };

export default function PositionsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['positions'], queryFn: async () => (await api.get('/positions')).data as Position[] });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Position> & { competenciesText?: string }>({});

  const save = async () => {
    const payload = {
      title: form.title,
      description: form.description,
      grade: form.grade,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      competencies: form.competenciesText ? form.competenciesText.split(',').map((s) => s.trim()).filter(Boolean) : []
    };
    if (editingId) {
      await api.put(`/positions/${editingId}`, payload);
    } else {
      await api.post('/positions', payload);
    }
    setOpen(false);
    setEditingId(null);
    setForm({});
    await qc.invalidateQueries({ queryKey: ['positions'] });
  };

  const remove = async (id: string) => {
    await api.delete(`/positions/${id}`);
    await qc.invalidateQueries({ queryKey: ['positions'] });
  };

  return (
    <AppBarShell>
      <Box sx={{ maxWidth: 1400, mx: 'auto', py: 4, px: 2 }}>
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
                mb: 0.5
              }}
            >
              Positions / Grades
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.95rem'
              }}
            >
              Manage job positions, grades, and competencies
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={() => setOpen(true)}
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
            Add Position
          </Button>
      </Box>

        {/* Positions Grid */}
        <Grid container spacing={3}>
        {(data || []).map((p) => (
            <Grid item xs={12} sm={6} lg={4} key={p.id}>
              <Card 
                onClick={() => { setEditingId(p.id); setOpen(true); setForm({ ...p, competenciesText: (p.competencies || []).join(', ') }); }} 
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
              >
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 4 }}>
                      <WorkIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '1.25rem',
                          color: 'text.primary'
                        }}
                      >
                        {p.title}
                      </Typography>
                    </Box>
                  }
                  action={
                    <IconButton 
                      onClick={(e) => { e.stopPropagation(); remove(p.id); }}
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
                  }
                  sx={{
                    pb: 1,
                    position: 'relative'
                  }}
                />
                <CardContent sx={{ flex: 1, p: 3, pt: 1 }}>
                  {p.grade && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <SchoolIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                          Grade
                        </Typography>
                      </Box>
                      <Chip 
                        label={p.grade} 
                        size="small" 
                        color="primary"
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.875rem'
                        }}
                      />
                    </Box>
                  )}
                  
                  {(p.salaryMin || p.salaryMax) && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <AttachMoneyIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: 'text.secondary',
                            fontSize: '0.75rem'
                          }}
                        >
                          Salary Range
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'success.main',
                          fontSize: '1rem'
                        }}
                      >
                        {p.salaryMin ? `$${p.salaryMin.toLocaleString()}` : '-'} 
                        {p.salaryMin && p.salaryMax ? ' - ' : ''}
                        {p.salaryMax ? `$${p.salaryMax.toLocaleString()}` : ''}
                      </Typography>
                    </Box>
                  )}

                  {p.competencies && p.competencies.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          display: 'block',
                          mb: 1
                        }}
                      >
                        Competencies
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {p.competencies.map((comp, idx) => (
                          <Chip
                            key={idx}
                            label={comp}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.75rem',
                              height: 24
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {p.description && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          lineHeight: 1.6,
                          fontSize: '0.875rem'
                        }}
                      >
                        {p.description}
                      </Typography>
                    </>
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
          {editingId ? 'Edit Position' : 'New Position'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField 
              label="Title" 
              value={form.title || ''} 
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField 
              label="Grade" 
              value={form.grade || ''} 
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="Salary Min" 
                type="number" 
                value={form.salaryMin ?? ''} 
                onChange={(e) => setForm({ ...form, salaryMin: Number(e.target.value) })}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <TextField 
                label="Salary Max" 
                type="number" 
                value={form.salaryMax ?? ''} 
                onChange={(e) => setForm({ ...form, salaryMax: Number(e.target.value) })}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
            <TextField 
              label="Competencies (comma-separated)" 
              value={form.competenciesText || ''} 
              onChange={(e) => setForm({ ...form, competenciesText: e.target.value })}
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
            {editingId ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBarShell>
  );
}


