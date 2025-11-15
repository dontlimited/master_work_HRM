import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Typography,
  Avatar,
  LinearProgress,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppSelector } from '../store/hooks';
import { isConnectionError, handleApiError } from '../utils/apiErrorHandler';
import { useState } from 'react';

type Employee = {
  id: string;
  archived: boolean;
  user: { firstName: string; lastName: string; email: string; role: string };
  department?: { name: string } | null;
  position?: { title: string } | null;
};

type Enrollment = {
  id: string;
  progress: number;
  completed: boolean;
  course: { id: string; title: string; description?: string };
};

type Course = {
  id: string;
  title: string;
  description?: string;
};


export default function EmployeeProfilePage() {
  const { id } = useParams();
  const userRole = useAppSelector((s) => s.auth.user?.role);
  const isAdminOrHR = userRole === 'ADMIN' || userRole === 'HR';
  const [learningDialogOpen, setLearningDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get(`/employees`, { params: { id } })).data as { items: Employee[] },
  });
  const emp = data?.items?.[0];

  // Fetch employee enrollments if admin/HR viewing another employee
  const { data: enrollments = [], refetch: refetchEnrollments } = useQuery({
    queryKey: ['employee-enrollments', id],
    queryFn: async () => {
      try {
        return (await api.get('/learning/enrollments/my', { params: { employeeId: id } })).data as Enrollment[];
      } catch (error: any) {
        if (isConnectionError(error)) {
          console.warn('Backend not available, returning empty enrollments');
          return [];
        }
        throw error;
      }
    },
    enabled: !!id && isAdminOrHR && !!emp,
  });

  // Fetch all courses for the dialog
  const { data: allCourses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        return (await api.get('/learning/courses')).data as Course[];
      } catch (error: any) {
        if (isConnectionError(error)) {
          console.warn('Backend not available, returning empty courses');
          return [];
        }
        throw error;
      }
    },
    enabled: learningDialogOpen && !!id && isAdminOrHR,
  });

  // Get enrolled course IDs
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course.id));

  // Filter available courses (not enrolled)
  const availableCourses = allCourses.filter((course) => !enrolledCourseIds.has(course.id));

  // Mutation to enroll employee in a course
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return api.post('/learning/enrollments', { courseId, employeeId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-enrollments', id] });
      refetchEnrollments();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to enroll employee in course');
    },
  });

  // Mutation to unenroll employee from a course
  const unenrollMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      return api.delete(`/learning/enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-enrollments', id] });
      refetchEnrollments();
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to unenroll employee from course');
    },
  });

  const handleEnroll = (courseId: string) => {
    enrollMutation.mutate(courseId);
  };

  const handleUnenroll = (enrollmentId: string) => {
    if (window.confirm('Are you sure you want to remove this course enrollment?')) {
      unenrollMutation.mutate(enrollmentId);
    }
  };

  return (
    <AppBarShell>
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
          Employee Profile
        </Typography>
        {emp ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                <CardHeader title="Personal Information" />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                        fontWeight: 600,
                      }}
                    >
                      {emp.user.firstName[0]}
                      {emp.user.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {emp.user.firstName} {emp.user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {emp.user.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography sx={{ mb: 1 }}>
                    <b>Role:</b> {emp.user.role}
                  </Typography>
                  {emp.archived && (
                    <Box sx={{ mt: 2 }}>
                      <Chip size="small" label="Archived" color="warning" />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                <CardHeader title="Organization" />
                <CardContent>
                  <Typography sx={{ mb: 1 }}>
                    <b>Department:</b> {emp.department?.name || '-'}
                  </Typography>
                  <Typography>
                    <b>Position:</b> {emp.position?.title || '-'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Learning & Development Section - Only for Admin/HR viewing employee */}
            {isAdminOrHR && (
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SchoolIcon color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Learning & Development
                          </Typography>
                        </Box>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => setLearningDialogOpen(true)}
                          size="small"
                        >
                          Manage Courses
                        </Button>
                      </Box>
                    }
                  />
                  <CardContent>
                    {enrollments.length > 0 ? (
                      <Grid container spacing={2}>
                        {enrollments.map((enrollment) => (
                          <Grid item xs={12} sm={6} md={4} key={enrollment.id}>
                            <Card
                              variant="outlined"
                              sx={{
                                borderRadius: 2,
                                height: '100%',
                                transition: 'all 0.2s',
                                '&:hover': { boxShadow: 2 },
                                position: 'relative',
                              }}
                            >
                              <IconButton
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  zIndex: 1,
                                }}
                                size="small"
                                color="error"
                                onClick={() => handleUnenroll(enrollment.id)}
                                disabled={unenrollMutation.isPending}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                              <CardContent>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, pr: 4 }}>
                                  {enrollment.course.title}
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      Progress
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                      {enrollment.progress}%
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={enrollment.progress}
                                    sx={{ height: 6, borderRadius: 1 }}
                                  />
                                  {enrollment.completed && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                                      <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                        Completed
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No active course enrollments
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                <CardHeader title="Quick Links" />
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Typography component={Link} to={`/employees/${id}/documents`} sx={{ textDecoration: 'none' }}>
                      Documents
                    </Typography>
                    <Typography component="span" color="text.secondary">
                      |
                    </Typography>
                    <Typography component={Link} to={`/${id}/time`} sx={{ textDecoration: 'none' }}>
                      Time & Attendance
                    </Typography>
                    {isAdminOrHR && (
                      <>
                        <Typography component="span" color="text.secondary">
                          |
                        </Typography>
                        <Button
                          variant="text"
                          startIcon={<SchoolIcon />}
                          onClick={() => setLearningDialogOpen(true)}
                          sx={{ textTransform: 'none', minWidth: 'auto', p: 0 }}
                        >
                          Learning
                        </Button>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Typography>Loading...</Typography>
        )}

        {/* Learning Management Dialog */}
        <Dialog
          open={learningDialogOpen}
          onClose={() => setLearningDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Manage Courses for {emp?.user.firstName} {emp?.user.lastName}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Available Courses
              </Typography>
              {availableCourses.length > 0 ? (
                <List>
                  {availableCourses.map((course) => (
                    <ListItem
                      key={course.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          color="primary"
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollMutation.isPending}
                        >
                          {enrollMutation.isPending ? <CircularProgress size={20} /> : <AddIcon />}
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={course.title}
                        secondary={course.description || 'No description available'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  All available courses have been assigned to this employee.
                </Typography>
              )}

              {enrollments.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Current Enrollments
                  </Typography>
                  <List>
                    {enrollments.map((enrollment) => (
                      <ListItem
                        key={enrollment.id}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleUnenroll(enrollment.id)}
                            disabled={unenrollMutation.isPending}
                          >
                            {unenrollMutation.isPending ? <CircularProgress size={20} /> : <DeleteIcon />}
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={enrollment.course.title}
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Progress: {enrollment.progress}%
                              </Typography>
                              {enrollment.completed && (
                                <Chip
                                  size="small"
                                  label="Completed"
                                  color="success"
                                  sx={{ ml: 1 }}
                                  icon={<CheckCircleIcon />}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLearningDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppBarShell>
  );
}
