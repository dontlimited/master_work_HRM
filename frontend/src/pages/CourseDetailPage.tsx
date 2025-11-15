import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import { isConnectionError, handleApiError } from '../utils/apiErrorHandler';

type Course = { id: string; title: string; description?: string };
type Enrollment = { id: string; progress: number; completed: boolean; course: Course };

// Mock courses (same as in LearningPage)
const MOCK_COURSES: Course[] = [
  {
    id: 'mock-1',
    title: 'Introduction to TypeScript',
    description: 'Learn the fundamentals of TypeScript, including types, interfaces, and advanced patterns. Perfect for developers looking to enhance their JavaScript skills.',
  },
  {
    id: 'mock-2',
    title: 'React Advanced Patterns',
    description: 'Master advanced React patterns including hooks, context, and performance optimization. Build scalable and maintainable React applications.',
  },
  {
    id: 'mock-3',
    title: 'Node.js Backend Development',
    description: 'Comprehensive guide to building robust backend services with Node.js, Express, and modern best practices. Includes authentication and database integration.',
  },
  {
    id: 'mock-4',
    title: 'DevOps Fundamentals',
    description: 'Introduction to DevOps practices, CI/CD pipelines, containerization with Docker, and cloud deployment strategies.',
  },
  {
    id: 'mock-5',
    title: 'Database Design & Optimization',
    description: 'Learn database design principles, SQL optimization, indexing strategies, and working with both relational and NoSQL databases.',
  },
];


export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        return (await api.get('/learning/courses')).data as Course[];
      } catch (error: any) {
        if (isConnectionError(error)) {
          console.warn('Backend not available, using mock courses');
          return [];
        }
        throw error;
      }
    },
  });
  
  // Use real courses from database, fallback to mock courses only if no courses exist
  const allCourses = courses.length > 0 ? courses : MOCK_COURSES;
  const course = allCourses.find((c) => c.id === id);

  const { data: enrollment } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      try {
        return (await api.get('/learning/enrollments/my')).data as Enrollment[];
      } catch (error: any) {
        if (isConnectionError(error)) {
          console.warn('Backend not available, returning empty enrollments');
          return [];
        }
        throw error;
      }
    },
    select: (data) => data.find((e) => e.course.id === id),
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Course ID required');
      return api.post('/learning/enrollments', { courseId: id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to enroll in course');
    },
  });

  if (!course) {
    return (
      <AppBarShell>
        <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary">
            Course not found
          </Typography>
          <Button sx={{ mt: 2 }} onClick={() => navigate('/learning')}>
            Back to Courses
          </Button>
        </Box>
      </AppBarShell>
    );
  }

  return (
    <AppBarShell>
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
        <IconButton onClick={() => navigate('/learning')} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>

        <Card sx={{ borderRadius: 3, boxShadow: 3, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                }}
              >
                <SchoolIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {course.title}
                </Typography>
                {course.description && (
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {course.description}
                  </Typography>
                )}
              </Box>
            </Box>

            {enrollment ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Your Progress
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {enrollment.progress}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={enrollment.progress}
                  sx={{ height: 10, borderRadius: 1, mb: 2 }}
                />
                {enrollment.completed && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                      Course Completed
                    </Typography>
                  </Box>
                )}
                <Button variant="contained" startIcon={<PlayArrowIcon />} size="large">
                  {enrollment.completed ? 'Review Course' : 'Continue Learning'}
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<SchoolIcon />}
                onClick={() => enrollMutation.mutate()}
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Course'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Course Content
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Course content will be displayed here. This is a placeholder for the course detail page.
          </Typography>
        </Paper>
      </Box>
    </AppBarShell>
  );
}

