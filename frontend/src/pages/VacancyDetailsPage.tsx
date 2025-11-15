import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import { Box, Button, Card, CardContent, CardHeader, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, InputLabel, LinearProgress, MenuItem, Select, Tooltip, Typography, TextField } from '@mui/material';
import { useAppSelector } from '../store/hooks';

type Vacancy = { id: string; title: string; description?: string; skills?: string[]; status: string; createdAt: string };
type Candidate = { id: string; firstName: string; lastName: string; email: string; status: string; score?: number; inconsistent?: boolean; diffs?: { added: string[]; missing: string[] }; explanation?: { overlap: string[]; contributions: Array<{ token: string; vacancyWeight: number; candidateWeight: number; product: number }>; vacancyTokens: number; candidateTokens: number }; resumePath?: string; coverLetter?: string };

export default function VacancyDetailsPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ 
    queryKey: ['vacancy', id], 
    queryFn: async () => {
      const response = await api.get(`/recruitment/vacancies/${id}`);
      const result = response.data as { vacancy: Vacancy; candidates?: Candidate[]; stats?: { totalCandidates: number } };
      // Debug logging
      console.log('Vacancy details response:', {
        hasVacancy: !!result.vacancy,
        hasCandidates: !!result.candidates,
        candidatesCount: result.candidates?.length || 0,
        stats: result.stats
      });
      return result;
    }
  });
  const v = data?.vacancy;
  const [status, setStatus] = React.useState<string | undefined>(v?.status);
  useEffect(() => { if (v?.status) setStatus(v.status); }, [v?.status]);
  const [selected, setSelected] = React.useState<Candidate | null>(null);
  const role = useAppSelector((s) => s.auth.user?.role);
  const isHRorAdmin = role === 'HR' || role === 'ADMIN';
  const [meetDate, setMeetDate] = React.useState<string>('');
  const [meetTime, setMeetTime] = React.useState<string>('10:00');
  const [durationMin, setDurationMin] = React.useState<number>(30);
  const [calendarUrl, setCalendarUrl] = React.useState<string>('');
  return (
    <AppBarShell>
      {v ? (
        <>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title={v.title} subheader={`${v.status} • ${new Date(v.createdAt).toLocaleDateString()}${data?.stats ? ` • ${data.stats.totalCandidates} candidates` : ''}`} />
              <CardContent>
                <Typography sx={{ mb: 1 }}>{v.description}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {(v.skills || []).map((s) => <Chip key={s} size="small" label={s} />)}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <FormControl size="small">
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" value={status ?? v.status} onChange={(e) => setStatus(String(e.target.value))}>
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="ON_HOLD">On Hold</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={async () => { await api.put(`/recruitment/vacancies/${v.id}`, { status }); await qc.invalidateQueries({ queryKey: ['vacancy', id] }); }}>Save</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {isHRorAdmin && (
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title={`Candidates (ranked)${data?.stats ? ` • ${data.stats.totalCandidates} total` : ''}`}
                  action={
                    <Button 
                      size="small" 
                      onClick={() => qc.invalidateQueries({ queryKey: ['vacancy', id] })}
                    >
                      Refresh
                    </Button>
                  }
                />
                <CardContent>
                  {isLoading ? (
                    <Typography color="text.secondary">Loading candidates...</Typography>
                  ) : error ? (
                    <Typography color="error">Error loading candidates</Typography>
                  ) : data?.candidates && data.candidates.length > 0 ? (
                    <Grid container spacing={2}>
                      {data.candidates.map((c) => (
                        <Grid key={c.id} item xs={12} md={6} lg={4}>
                          <Card sx={{ cursor: 'pointer', bgcolor: c.inconsistent ? 'rgba(244,67,54,0.08)' : undefined }} onClick={() => setSelected(c)}>
                            <CardHeader title={`${c.firstName} ${c.lastName}`} subheader={
                              c.inconsistent ? (
                                <Tooltip title={`Possible resume inconsistency. Added: ${(c.diffs?.added || []).slice(0,5).join(', ') || '-'}; Missing: ${(c.diffs?.missing || []).slice(0,5).join(', ') || '-'}`}>
                                  <span>{`${c.email} • ${c.status}`}</span>
                                </Tooltip>
                              ) : (
                                `${c.email} • ${c.status}`
                              )
                            } />
                            <CardContent>
                              <Typography variant="body2">Relevance</Typography>
                              <LinearProgress variant="determinate" value={Math.round((c.score || 0) * 100)} />
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary">No candidates have applied yet.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
        <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Relevance Details</DialogTitle>
          <DialogContent>
            {selected && (
              <Box>
                <Typography sx={{ mb: 1 }}><b>Candidate:</b> {selected.firstName} {selected.lastName}</Typography>
                <Typography sx={{ mb: 1 }}><b>Score:</b> {Math.round((selected.score || 0) * 100)}%</Typography>
                {selected.inconsistent && (
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ mb: 0.5 }}><b>Resume differences detected for this email</b></Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Compared to this candidate’s other applications with the same email, the following skills changed:
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Added</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(selected.diffs?.added || []).length > 0 ? (
                            (selected.diffs?.added || []).map((t) => (<Chip key={`add-${t}`} size="small" color="success" variant="outlined" label={t} />))
                          ) : (
                            <Typography variant="caption" color="text.secondary">No additions</Typography>
                          )}
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Missing</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(selected.diffs?.missing || []).length > 0 ? (
                            (selected.diffs?.missing || []).map((t) => (<Chip key={`miss-${t}`} size="small" color="warning" variant="outlined" label={t} />))
                          ) : (
                            <Typography variant="caption" color="text.secondary">No omissions</Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                <Typography sx={{ mb: 1 }}><b>Matched skills</b></Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {(selected.explanation?.overlap || []).map((s) => (<Chip key={s} size="small" label={s} />))}
                  {(!selected.explanation || (selected.explanation.overlap || []).length === 0) && (
                    <Typography variant="body2">No direct skill matches found</Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  The score reflects how well the candidate's resume and cover letter match the skills specified in the vacancy.
                </Typography>
                
                {selected.coverLetter && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Cover Letter</Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6
                      }}
                    >
                      {selected.coverLetter}
                    </Typography>
                  </Box>
                )}
                
                {selected.resumePath && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Resume</Typography>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={async () => {
                        try {
                          const response = await api.get(`/recruitment/candidates/${selected.id}/resume`, {
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', selected.resumePath || 'resume');
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          alert('Failed to download resume');
                        }
                      }}
                    >
                      Download Resume
                    </Button>
                  </Box>
                )}
                
                {isHRorAdmin && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Invite to Interview</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
                      <TextField size="small" type="date" value={meetDate} onChange={(e) => setMeetDate(e.target.value)} />
                      <TextField size="small" type="time" value={meetTime} onChange={(e) => setMeetTime(e.target.value)} />
                      <FormControl size="small">
                        <InputLabel>Duration</InputLabel>
                        <Select label="Duration" value={String(durationMin)} onChange={(e) => setDurationMin(Number(e.target.value))} sx={{ minWidth: 120 }}>
                          {[15,30,45,60].map((n) => (<MenuItem key={n} value={n}>{n} min</MenuItem>))}
                        </Select>
                      </FormControl>
                      <Button variant="contained" onClick={async () => {
                        if (!meetDate || !meetTime || !id || !selected) return;
                        const start = new Date(`${meetDate}T${meetTime}:00`);
                        await api.post('/recruitment/interviews', { candidateId: selected.id, scheduledAt: start.toISOString() });
                        const end = new Date(start.getTime() + durationMin * 60000);
                        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                        const dates = `${fmt(start)}/${fmt(end)}`;
                        const text = encodeURIComponent(`Interview: ${v?.title || ''}`);
                        const details = encodeURIComponent(`Candidate: ${selected.firstName} ${selected.lastName} (${selected.email})\nCreate Meet: https://meet.google.com/new`);
                        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${encodeURIComponent('Google Meet')}`;
                        setCalendarUrl(url);
                        window.open(url, '_blank');
                      }}>Create Calendar Invite</Button>
                    </Box>
                    {calendarUrl && (
                      <Typography variant="caption" color="text.secondary">Calendar link generated. If Meet is not auto-added, click “Add Google Meet” in the event.</Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelected(null)}>Close</Button>
          </DialogActions>
        </Dialog>
        </>
      ) : (
        <Typography>Loading...</Typography>
      )}
    </AppBarShell>
  );
}


