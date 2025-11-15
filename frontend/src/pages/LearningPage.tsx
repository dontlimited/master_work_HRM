import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BookIcon from '@mui/icons-material/Book';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { isConnectionError, handleApiError } from '../utils/apiErrorHandler';

type Course = { id: string; title: string; description?: string };
type Enrollment = { id: string; progress: number; completed: boolean; course: Course };

// Mock data for courses if needed
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

const getCourseIcon = (title: string) => {
  if (title.toLowerCase().includes('typescript') || title.toLowerCase().includes('react')) return '💻';
  if (title.toLowerCase().includes('node') || title.toLowerCase().includes('backend')) return '⚙️';
  if (title.toLowerCase().includes('devops')) return '🚀';
  if (title.toLowerCase().includes('database')) return '🗄️';
  return '📚';
};

const getCourseLevel = (title: string): string => {
  if (title.toLowerCase().includes('introduction') || title.toLowerCase().includes('fundamentals')) return 'Beginner';
  if (title.toLowerCase().includes('advanced')) return 'Advanced';
  return 'Intermediate';
};

const getCourseDuration = (): string => {
  const durations = ['2 weeks', '4 weeks', '6 weeks', '8 weeks'];
  return durations[Math.floor(Math.random() * durations.length)];
};

function CourseCard({
  course,
  isEnrolled,
  enrollment,
  onEnroll,
  onUnenroll,
  onContinue,
}: {
  course: Course;
  isEnrolled: boolean;
  enrollment?: Enrollment;
  onEnroll: () => void;
  onUnenroll: () => void;
  onContinue: () => void;
}) {
  const theme = useTheme();
  const level = getCourseLevel(course.title);
  const duration = getCourseDuration();
  const icon = getCourseIcon(course.title);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontWeight: 600,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {course.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Chip
                label={level}
                size="small"
                color={level === 'Beginner' ? 'success' : level === 'Advanced' ? 'error' : 'warning'}
                variant="outlined"
              />
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                label={duration}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.description || 'No description available'}
        </Typography>

        {isEnrolled && enrollment && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
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
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {isEnrolled ? (
            <>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={onContinue}
                sx={{ flex: 1 }}
                size="medium"
              >
                Continue Learning
              </Button>
              <Button variant="outlined" color="error" onClick={onUnenroll} size="medium">
                Unenroll
              </Button>
            </>
          ) : (
            <Button variant="contained" fullWidth onClick={onEnroll} size="medium" startIcon={<SchoolIcon />}>
              Enroll
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function EnrollmentCard({ enrollment, onContinue, onUnenroll }: { enrollment: Enrollment; onContinue: () => void; onUnenroll: () => void }) {
  const theme = useTheme();
  const icon = getCourseIcon(enrollment.course.title);

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 4,
        },
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              fontSize: '1.5rem',
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1rem' }}>
              {enrollment.course.title}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {enrollment.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={enrollment.progress}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                }}
              />
              {enrollment.completed && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                  <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                    Completed
                  </Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayArrowIcon />}
                onClick={onContinue}
                disabled={enrollment.completed}
              >
                {enrollment.completed ? 'Review Course' : 'Continue Learning'}
              </Button>
              <Button variant="outlined" size="small" color="error" onClick={onUnenroll}>
                Unenroll
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}


export default function LearningPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: courses = [], error: coursesError } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      try {
        return (await api.get('/learning/courses')).data as Course[];
      } catch (error: any) {
        // If backend is not available, return empty array and use mock courses
        if (isConnectionError(error)) {
          console.warn('Backend not available, using mock courses');
          return [];
        }
        throw error;
      }
    },
    retry: false,
  });

  const { data: enrollments = [], error: enrollmentsError } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      try {
        return (await api.get('/learning/enrollments/my')).data as Enrollment[];
      } catch (error: any) {
        // If backend is not available, return empty array
        if (isConnectionError(error)) {
          console.warn('Backend not available, returning empty enrollments');
          return [];
        }
        throw error;
      }
    },
    retry: false,
  });

  // Use real courses from database, fallback to mock courses only if no courses exist
  const allCourses = useMemo(() => {
    if (courses.length > 0) {
      // If we have real courses from database, use only those
      return courses;
    }
    // Fallback to mock courses only if backend is unavailable or no courses exist
    return MOCK_COURSES;
  }, [courses]);

  // Create enrollment map
  const enrollmentMap = useMemo(() => {
    const map = new Map<string, Enrollment>();
    enrollments.forEach((e) => {
      map.set(e.course.id, e);
    });
    return map;
  }, [enrollments]);

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return api.post('/learning/enrollments', { courseId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to enroll in course');
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      return api.delete(`/learning/enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to unenroll from course');
    },
  });

  const handleEnroll = (courseId: string) => {
    enrollMutation.mutate(courseId);
  };

  const handleUnenroll = (enrollmentId: string) => {
    if (window.confirm('Are you sure you want to unenroll from this course?')) {
      unenrollMutation.mutate(enrollmentId);
    }
  };

  const handleContinue = (courseId: string) => {
    // Navigate to course detail page
    // If the route doesn't exist, it will show 404, but the route can be added later
    navigate(`/learning/courses/${courseId}`);
  };

  return (
    <AppBarShell>
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 4 }}>
        {/* Page Header */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Learning & Development
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
            Courses, enrollments and progress tracking
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Course Catalog */}
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BookIcon color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Course Catalog
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Explore our comprehensive course library and start your learning journey today.
              </Typography>
            </Box>

            {allCourses.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No courses available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Check back later for new courses
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {allCourses.map((course) => {
                  const enrollment = enrollmentMap.get(course.id);
                  const isEnrolled = !!enrollment;

                  return (
                    <Grid item xs={12} sm={6} key={course.id}>
                      <CourseCard
                        course={course}
                        isEnrolled={isEnrolled}
                        enrollment={enrollment}
                        onEnroll={() => handleEnroll(course.id)}
                        onUnenroll={() => enrollment && handleUnenroll(enrollment.id)}
                        onContinue={() => handleContinue(course.id)}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Grid>

          {/* My Enrollments Sidebar */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                position: isMobile ? 'relative' : 'sticky',
                top: 20,
                borderRadius: 3,
                boxShadow: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    My Enrollments
                  </Typography>
                </Box>

                {enrollments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                      No active enrollments yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Browse the course catalog and enroll in courses to start learning
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {enrollments.map((enrollment) => (
                      <EnrollmentCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        onContinue={() => handleContinue(enrollment.course.id)}
                        onUnenroll={() => handleUnenroll(enrollment.id)}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </AppBarShell>
  );
}
