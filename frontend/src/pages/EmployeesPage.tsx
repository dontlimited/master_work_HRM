import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import PageHeader from '../components/PageHeader';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl, useMediaQuery, useTheme, Card, CardContent, Grid, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type Employee = { id: string; user: { email: string; firstName: string; lastName: string }; department?: { name: string } | null; position?: { title: string } | null };

const columns: GridColDef[] = [
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 150 },
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
  { field: 'department', headerName: 'Department', flex: 1, minWidth: 120 },
  { field: 'position', headerName: 'Position', flex: 1, minWidth: 150 }
];

type Department = { id: string; name: string };
type PositionRef = { id: string; title: string };

export default function EmployeesPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [search, setSearch] = useState('');
  const { data } = useQuery({ queryKey: ['employees', search], queryFn: async () => (await api.get('/employees', { params: { search } })).data as { items: Employee[]; total: number } });
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data as Department[] });
  const { data: positions } = useQuery({ queryKey: ['positions'], queryFn: async () => (await api.get('/positions')).data as PositionRef[] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE', departmentId: '', positionId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const rows = (data?.items || []).map((e) => ({ id: e.id, email: e.user.email, name: `${e.user.firstName} ${e.user.lastName}`.trim(), department: e.department?.name || '-', position: e.position?.title || '-' }));
  const employees = data?.items || [];

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({ ...errors, [name]: error });
    }
  };

  const handleFieldBlur = (name: string) => {
    setTouched({ ...touched, [name]: true });
    const error = validateField(name, form[name as keyof typeof form] as string);
    setErrors({ ...errors, [name]: error });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    newErrors.email = validateEmail(form.email);
    newErrors.password = validatePassword(form.password);
    newErrors.firstName = form.firstName.trim() ? '' : 'First name is required';
    newErrors.lastName = form.lastName.trim() ? '' : 'Last name is required';
    
    setErrors(newErrors);
    setTouched({ email: true, password: true, firstName: true, lastName: true });
    
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleClose = () => {
    setOpen(false);
    setForm({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE', departmentId: '', positionId: '' });
    setErrors({});
    setTouched({});
  };
  return (
    <AppBarShell>
      <PageHeader title="Employees" actions={<Button variant="contained" onClick={() => setOpen(true)}>Add Employee</Button>} />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2, 
        mb: 2 
      }}>
        <TextField 
          size="small" 
          label="Search" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
          fullWidth
        />
        <Button 
          variant="outlined" 
          onClick={() => setSearch('')}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Clear
        </Button>
      </Box>
      {/* Mobile Card View */}
      {isMobile ? (
        <Box>
          {employees.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No employees found
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {employees.map((employee) => (
                <Grid item xs={12} key={employee.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-2px)',
                      }
                    }}
                    onClick={() => navigate(`/employees/${employee.id}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: 'primary.main',
                            fontSize: '1.5rem',
                            fontWeight: 600
                          }}
                        >
                          {(employee.user.firstName?.[0] || '') + (employee.user.lastName?.[0] || '') || 'U'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {employee.user.firstName} {employee.user.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {employee.user.email}
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                              <Box component="span" sx={{ fontWeight: 600, mr: 1 }}>Department:</Box>
                              {employee.department?.name || '-'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                              <Box component="span" sx={{ fontWeight: 600, mr: 1 }}>Position:</Box>
                              {employee.position?.title || '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      ) : (
        /* Desktop Table View */
        <Box sx={{ 
          height: 500, 
          width: '100%', 
          overflow: 'auto',
          '& .MuiDataGrid-root': {
            fontSize: '0.875rem'
          }
        }}>
          <DataGrid
            columns={columns}
            rows={rows}
            onRowClick={(p) => navigate(`/employees/${p.id}`)}
            sx={{
              '& .MuiDataGrid-columnHeader': {
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.5',
                padding: '8px',
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-cell': {
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.5',
                padding: '8px',
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
              },
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              }
            }}
            autoHeight={false}
            disableColumnMenu={false}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
          />
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>New Employee</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              label="Email" 
              type="email"
              value={form.email} 
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={() => handleFieldBlur('email')}
              error={!!errors.email}
              helperText={errors.email}
              required
              fullWidth
            />
            <TextField 
              label="Password" 
              type="password" 
              value={form.password} 
              onChange={(e) => handleFieldChange('password', e.target.value)}
              onBlur={() => handleFieldBlur('password')}
              error={!!errors.password}
              helperText={errors.password}
              required
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="First name" 
                value={form.firstName} 
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                onBlur={() => handleFieldBlur('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
                fullWidth
              />
              <TextField 
                label="Last name" 
                value={form.lastName} 
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                onBlur={() => handleFieldBlur('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
                fullWidth
              />
            </Box>
            <FormControl size="small">
              <InputLabel>Role</InputLabel>
              <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <MenuItem value="EMPLOYEE">Employee</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Department</InputLabel>
              <Select label="Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: String(e.target.value) })}>
                {(departments || []).map((d) => (<MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Position</InputLabel>
              <Select label="Position" value={form.positionId} onChange={(e) => setForm({ ...form, positionId: String(e.target.value) })}>
                {(positions || []).map((p) => (<MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={async () => {
              if (!validateForm()) {
                return;
              }
              try {
                // 1) create user
                const userRes = await api.post('/users/register', { 
                  email: form.email, 
                  password: form.password, 
                  firstName: form.firstName, 
                  lastName: form.lastName, 
                  role: form.role 
                });
                const userId = userRes.data.id;
                // 2) create employee
                await api.post('/employees', { 
                  userId, 
                  departmentId: form.departmentId || undefined, 
                  positionId: form.positionId || undefined 
                });
                handleClose();
                await (await import('@tanstack/react-query')).queryClient?.invalidateQueries?.({ queryKey: ['employees', search] });
              } catch (error: any) {
                if (error.response?.status === 409) {
                  setErrors({ ...errors, email: 'This email is already registered' });
                } else {
                  setErrors({ ...errors, email: error.response?.data?.error || 'Failed to create employee' });
                }
              }
            }} 
            disabled={!form.email || !form.password || !form.firstName || !form.lastName || !!Object.values(errors).find(e => e !== '')}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </AppBarShell>
  );
}


