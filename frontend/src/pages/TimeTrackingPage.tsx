import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import { Box, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem, Select, Typography, Paper, Chip } from '@mui/material';
import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { useParams, useNavigate } from 'react-router-dom';

type Attendance = { id: string; date: string; status: string };
type Event = { id: string; date: string; type: string; title: string; details?: string };
type TimeEntry = { id: string; date: string; startTime: string; endTime: string };

export default function TimeTrackingPage() {
  const qc = useQueryClient();
  const { userId: userIdParam } = useParams();
  const navigate = useNavigate();
  const authUserId = useAppSelector((s) => s.auth.user?.id);
  const role = useAppSelector((s) => s.auth.user?.role);
  const employeeId = userIdParam || undefined; // when present in URL it's actually employeeId
  const userId = userIdParam ? undefined : authUserId;
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const { data: attendance } = useQuery({ queryKey: ['attendance', employeeId || userId, month, year], queryFn: async () => (await api.get('/time/attendance', { params: { month, year, ...(employeeId ? { employeeId } : { userId }) } })).data as Attendance[] });
  const { data: history } = useQuery({ queryKey: ['history', employeeId || userId], queryFn: async () => (await api.get('/time/history', { params: { ...(employeeId ? { employeeId } : { userId }) } })).data as Event[] });
  const { data: entries } = useQuery({ queryKey: ['entries', employeeId || userId], queryFn: async () => (await api.get('/time/entries', { params: { ...(employeeId ? { employeeId } : { userId }) } })).data as TimeEntry[] });
  const { data: leaves } = useQuery({ queryKey: ['leaves', employeeId || userId], queryFn: async () => (await api.get('/time/leave', { params: { ...(employeeId ? { employeeId } : { userId }) } })).data as Array<{ id: string; startDate: string; endDate: string; status: string }> });
  const [status, setStatus] = useState('PRESENT');
  const canEdit = role === 'ADMIN' || role === 'HR' || !userIdParam; // own calendar or admin/hr
  const [editDay, setEditDay] = useState<number | null>(null);
  const [trackDate, setTrackDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');

  // If opened as /time, redirect to canonical /:employeeId/time for consistent caching/URL
  // Fetch own employee by userId and push route once
  React.useEffect(() => {
    (async () => {
      if (!userIdParam && authUserId) {
        try {
          const emp = await api.get('/employees', { params: { userId: authUserId } });
          const my = (emp.data.items || [])[0];
          if (my?.id) navigate(`/${my.id}/time`, { replace: true });
        } catch {}
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdParam, authUserId]);

  const mark = async () => {
    await api.post('/time/attendance', { date: new Date().toISOString(), status });
    await qc.invalidateQueries({ queryKey: ['attendance', userId, month, year] });
  };

  return (
    <AppBarShell>
      <Box sx={{ maxWidth: 1400, mx: 'auto', py: 3 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 4, 
            fontWeight: 700,
            textAlign: 'center',
            color: 'primary.main',
            letterSpacing: '-0.02em'
          }}
        >
          Time Tracking
        </Typography>
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: 2
                  }
                }
              }}
            >
              <InputLabel>Status</InputLabel>
              <Select 
                label="Status" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                sx={{ 
                  borderRadius: 2,
                  '& .MuiSelect-select': {
                    py: 1.2
                  }
                }}
              >
                <MenuItem value="PRESENT">Present</MenuItem>
                <MenuItem value="ABSENT">Absent</MenuItem>
                <MenuItem value="SICK">Sick</MenuItem>
                <MenuItem value="VACATION">Vacation</MenuItem>
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              onClick={mark} 
              disabled={!canEdit}
              sx={{
                px: 3,
                py: 1.2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              Mark Today
            </Button>
            {(role === 'ADMIN' || role === 'HR') && (
              <Button 
                variant="outlined"
                color="error" 
                onClick={async () => { if (confirm('Clear all attendance for this user?')) { await api.delete('/time/attendance', { params: { ...(employeeId ? { employeeId } : { userId }) } }); await qc.invalidateQueries({ queryKey: ['attendance', employeeId || userId, month, year] }); } }}
                sx={{
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Clear All
              </Button>
            )}
          </Box>
        </Paper>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card 
            sx={{ 
              borderRadius: 3, 
              boxShadow: 3,
              overflow: 'hidden'
            }}
          >
            <CardHeader 
              title="Schedule (This Month)" 
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiCardHeader-title': {
                  fontWeight: 600,
                  fontSize: '1.25rem'
                }
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <MonthCalendar attendance={attendance || []} pendingDays={computePendingDays(leaves || [], month, year)} onDayClick={(d) => setEditDay(d)} month={month} year={year} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card 
            sx={{ 
              borderRadius: 3, 
              boxShadow: 3,
              mb: 3
            }}
          >
            <CardHeader 
              title="Work History" 
              sx={{
                '& .MuiCardHeader-title': {
                  fontWeight: 600,
                  fontSize: '1.1rem'
                }
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {(history || []).map((e) => (
                  <Box 
                    component="li" 
                    key={e.id}
                    sx={{ 
                      mb: 2,
                      pb: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': {
                        mb: 0,
                        pb: 0,
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                      {new Date(e.date).toLocaleDateString()} — {e.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {e.title}{e.details ? ` — ${e.details}` : ''}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
          <Card 
            sx={{ 
              borderRadius: 3, 
              boxShadow: 3,
              mb: 3
            }}
          >
            <CardHeader 
              title="Track Time" 
              sx={{
                '& .MuiCardHeader-title': {
                  fontWeight: 600,
                  fontSize: '1.1rem'
                }
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 1.5, 
                  alignItems: 'center', 
                  mb: 3, 
                  flexWrap: 'wrap',
                  '& input[type="date"], & input[type="time"]': {
                    padding: '10px 12px',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:focus': {
                      outline: 'none',
                      borderColor: 'primary.main',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                    },
                    '&:hover': {
                      borderColor: 'primary.light'
                    }
                  }
                }}
              >
                <input type="date" value={trackDate} onChange={(e) => setTrackDate(e.target.value)} />
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                <Button 
                  size="medium" 
                  variant="contained" 
                  disabled={!trackDate} 
                  onClick={async () => { const dt = new Date(trackDate); const start = new Date(`${trackDate}T${startTime}:00`); const end = new Date(`${trackDate}T${endTime}:00`); await api.post('/time/entries', { date: dt.toISOString(), startTime: start.toISOString(), endTime: end.toISOString(), ...(employeeId ? { employeeId } : { userId }) }); await Promise.all([
                    qc.invalidateQueries({ queryKey: ['entries', employeeId || userId] }),
                    qc.invalidateQueries({ queryKey: ['attendance', employeeId || userId, month, year] })
                  ]); }}
                  sx={{
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  Save
                </Button>
              </Box>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {(entries || []).slice(0, 10).map((t) => (
                  <Box 
                    component="li" 
                    key={t.id}
                    sx={{ 
                      mb: 1.5,
                      pb: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': {
                        mb: 0,
                        pb: 0,
                        borderBottom: 'none'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {new Date(t.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(t.startTime).toLocaleTimeString()} - {new Date(t.endTime).toLocaleTimeString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
          <Card 
            sx={{ 
              borderRadius: 3, 
              boxShadow: 3,
              mb: 3
            }}
          >
            <CardHeader 
              title="Attendance Summary (This Month)" 
              sx={{
                '& .MuiCardHeader-title': {
                  fontWeight: 600,
                  fontSize: '1.1rem'
                }
              }}
            />
            <CardContent sx={{ p: 3 }}>
              <AttendanceSummary attendance={attendance || []} />
            </CardContent>
          </Card>
          <LeaveRequests employeeId={employeeId} userId={userId} role={role || ''} />
        </Grid>
      </Grid>

      <Dialog 
        open={editDay !== null} 
        onClose={() => setEditDay(null)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Set Status</DialogTitle>
        <DialogContent>
          <FormControl 
            fullWidth 
            size="small" 
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          >
            <InputLabel>Status</InputLabel>
            <Select 
              label="Status" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="PRESENT">Present</MenuItem>
              <MenuItem value="ABSENT">Absent</MenuItem>
              <MenuItem value="SICK">Sick</MenuItem>
              <MenuItem value="VACATION">Vacation</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setEditDay(null)}
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
            disabled={!canEdit} 
            onClick={async () => {
              if (editDay) {
                const dt = new Date(year, month - 1, editDay);
                await api.post('/time/attendance', { date: dt.toISOString(), status, ...(employeeId ? { employeeId } : { userId }) });
                await qc.invalidateQueries({ queryKey: ['attendance', employeeId || userId, month, year] });
              }
              setEditDay(null);
            }}
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
      </Box>
    </AppBarShell>
  );
}

function MonthCalendar({ attendance, pendingDays, onDayClick, month, year }: { attendance: Attendance[]; pendingDays: Set<number>; onDayClick: (day: number) => void; month: number; year: number }) {
  const first = new Date(year, month - 1, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const statusByDay = attendance.reduce<Record<number, string>>((acc, a) => {
    const d = new Date(a.date);
    if (d.getMonth() + 1 === month && d.getFullYear() === year) {
      acc[d.getDate()] = a.status;
    }
    return acc;
  }, {});
  const cells = [] as Array<{ day?: number; status?: string; pending?: boolean }>;
  for (let i = 0; i < startDay; i++) cells.push({});
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, status: statusByDay[d], pending: pendingDays.has(d) });
  while (cells.length % 7 !== 0) cells.push({});
  const colorFor = (status?: string) => {
    switch (status) {
      case 'PRESENT':
        return 'success.light';
      case 'SICK':
        return 'warning.light';
      case 'VACATION':
        return 'info.light';
      case 'ABSENT':
        return 'error.light';
      default:
        return 'background.paper';
    }
  };
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5 }}>
      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((h) => (
        <Box 
          key={h} 
          sx={{ 
            fontWeight: 600, 
            textAlign: 'center',
            py: 1,
            color: 'text.secondary',
            fontSize: '0.875rem'
          }}
        >
          {h}
        </Box>
      ))}
      {cells.map((c, idx) => (
        <Box 
          key={idx} 
          onClick={() => c.day && onDayClick(c.day)} 
          sx={{ 
            cursor: c.day ? 'pointer' : 'default', 
            height: 72,
            minHeight: 72,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 1,
            bgcolor: c.pending ? 'secondary.light' : colorFor(c.status),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: c.day ? 1 : 'none',
            '&:hover': c.day ? {
              transform: 'translateY(-2px)',
              boxShadow: 3,
              borderColor: 'primary.main',
              bgcolor: c.pending ? 'secondary.main' : colorFor(c.status)
            } : {},
            position: 'relative'
          }}
        >
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: c.day ? 600 : 400,
              color: c.day ? 'text.primary' : 'text.disabled',
              fontSize: '0.875rem'
            }}
          >
            {c.day || ''}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function AttendanceSummary({ attendance }: { attendance: Attendance[] }) {
  const counts = attendance.reduce<Record<string, number>>((acc, a) => {
    const d = new Date(a.date);
    const now = new Date();
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      acc[a.status] = (acc[a.status] || 0) + 1;
    }
    return acc;
  }, {});
  const summaryItems = [
    { label: 'Present', value: counts['PRESENT'] || 0, color: 'success' as const },
    { label: 'Absent', value: counts['ABSENT'] || 0, color: 'error' as const },
    { label: 'Sick', value: counts['SICK'] || 0, color: 'warning' as const },
    { label: 'Vacation', value: counts['VACATION'] || 0, color: 'info' as const },
  ];
  return (
    <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {summaryItems.map((item) => (
        <Box 
          component="li" 
          key={item.label}
          sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&:last-child': {
              mb: 0,
              pb: 0,
              borderBottom: 'none'
            }
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {item.label}:
          </Typography>
          <Chip 
            label={item.value} 
            color={item.color}
            sx={{ 
              fontWeight: 600,
              minWidth: 60,
              justifyContent: 'center'
            }}
          />
        </Box>
      ))}
    </Box>
  );
}

function computePendingDays(leaves: Array<{ startDate: string; endDate: string; status: string }>, month: number, year: number): Set<number> {
  const s = new Set<number>();
  for (const l of leaves) {
    if (l.status !== 'PENDING') continue;
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    const cur = new Date(start);
    while (cur <= end) {
      if (cur.getMonth() + 1 === month && cur.getFullYear() === year) s.add(cur.getDate());
      cur.setDate(cur.getDate() + 1);
    }
  }
  return s;
}

function LeaveRequests({ employeeId, userId, role }: { employeeId?: string; userId?: string; role: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['leaves', employeeId || userId], queryFn: async () => (await api.get('/time/leave', { params: { ...(employeeId ? { employeeId } : { userId }) } })).data as Array<{ id: string; startDate: string; endDate: string; status: string; reason?: string }> });
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  return (
    <Card 
      sx={{ 
        borderRadius: 3, 
        boxShadow: 3
      }}
    >
      <CardHeader 
        title="Leave Requests" 
        sx={{
          '& .MuiCardHeader-title': {
            fontWeight: 600,
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent sx={{ p: 3 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1.5, 
            alignItems: 'center', 
            mb: 3, 
            flexWrap: 'wrap',
            '& input[type="date"], & input[type="text"]': {
              padding: '10px 12px',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
              '&:focus': {
                outline: 'none',
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
              },
              '&:hover': {
                borderColor: 'primary.light'
              }
            },
            '& input[type="text"]': {
              flex: 1,
              minWidth: 150
            }
          }}
        >
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          <input type="text" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button 
            size="medium" 
            variant="contained" 
            disabled={!start || !end} 
            onClick={async () => { await api.post('/time/leave', { startDate: new Date(start).toISOString(), endDate: new Date(end).toISOString(), reason }); await Promise.all([
              qc.invalidateQueries({ queryKey: ['leaves', employeeId || userId] }),
              qc.invalidateQueries({ queryKey: ['attendance', employeeId || userId, new Date(start).getMonth() + 1, new Date(start).getFullYear()] })
            ]); }}
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            Request
          </Button>
        </Box>
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {(data || []).map((l) => (
            <Box 
              component="li" 
              key={l.id}
              sx={{ 
                mb: 2,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                  mb: 0,
                  pb: 0,
                  borderBottom: 'none'
                }
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
                {new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  {l.status === 'PENDING' ? 'Sick Leave (Pending)' : l.status === 'APPROVED' ? 'Sick Leave' : l.status} {l.reason ? `(${l.reason})` : ''}
                </Typography>
                { (role === 'ADMIN' || role === 'HR') && l.status === 'PENDING' && (
                  <Button 
                    size="small" 
                    variant="contained"
                    color="success"
                    onClick={async () => { await api.post(`/time/leave/${l.id}/approve`); await Promise.all([
                      qc.invalidateQueries({ queryKey: ['leaves', employeeId || userId] }),
                      qc.invalidateQueries({ queryKey: ['attendance', employeeId || userId, new Date(l.startDate).getMonth() + 1, new Date(l.startDate).getFullYear()] })
                    ]); }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 1.5
                    }}
                  >
                    Approve
                  </Button>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}


