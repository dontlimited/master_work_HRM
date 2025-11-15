import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import { Box, Button, Card, CardContent, CardHeader, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography } from '@mui/material';

type Vacancy = { id: string; title: string; description?: string; skills?: string[]; status: string; createdAt: string };

export default function CandidateVacancyDetailsPage() {
  const { id } = useParams();
  const { data } = useQuery({ queryKey: ['vacancy', id], queryFn: async () => (await api.get(`/recruitment/vacancies/${id}`)).data as { vacancy: Vacancy } });
  const v = data?.vacancy;
  const [applyOpen, setApplyOpen] = React.useState(false);
  const [form, setForm] = React.useState<{ email: string; firstName: string; lastName: string; coverLetter: string; file?: File }>({ email: '', firstName: '', lastName: '', coverLetter: '' });

  const submit = async () => {
    if (!id) return;
    try {
      const fd = new FormData();
      fd.append('email', form.email);
      if (form.firstName) fd.append('firstName', form.firstName);
      if (form.lastName) fd.append('lastName', form.lastName);
      if (form.coverLetter) fd.append('coverLetter', form.coverLetter);
      if (form.file) fd.append('resume', form.file);
      await api.post(`/recruitment/vacancies/${id}/apply`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Application submitted successfully!');
      setApplyOpen(false);
      setForm({ email: '', firstName: '', lastName: '', coverLetter: '' });
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Failed to submit application. Please try again.';
      alert(message);
    }
  };

  return (
    <AppBarShell>
      {v ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title={v.title} subheader={`${v.status} • ${new Date(v.createdAt).toLocaleDateString()}`} />
              <CardContent>
                <Typography sx={{ mb: 1 }}>{v.description || 'No description'}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {(v.skills || []).map((s) => <Chip key={s} size="small" label={s} />)}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="contained" onClick={() => setApplyOpen(true)} disabled={v.status === 'ON_HOLD' || v.status === 'CLOSED'}>Apply</Button>
                  {(v.status === 'ON_HOLD' || v.status === 'CLOSED') && (
                    <Typography variant="body2" color="text.secondary">
                      {v.status === 'ON_HOLD' ? 'This vacancy is currently on hold.' : 'This vacancy is closed and no longer accepts applications.'}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Apply to {v.title}</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  <TextField label="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </Box>
                <TextField label="Cover Letter" multiline minRows={4} value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} />
                <Button variant="outlined" component="label">Upload Resume<input hidden type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] })} /></Button>
                {form.file && <Typography variant="caption">{form.file.name}</Typography>}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setApplyOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={submit} disabled={!form.email && !form.file && !form.coverLetter}>Submit</Button>
            </DialogActions>
          </Dialog>
        </Grid>
      ) : (
        <Typography>Loading...</Typography>
      )}
    </AppBarShell>
  );
}


