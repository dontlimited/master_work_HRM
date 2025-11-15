import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  IconButton,
  useMediaQuery,
  useTheme,
  Divider,
  FormControl,
  InputLabel,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { handleApiError } from '../utils/apiErrorHandler';

type Cycle = { id: string; title: string };
type Question = { id: string; text: string; type: 'SCALE' | 'TEXT' };
type Employee = { id: string; user: { firstName: string; lastName: string; email: string } };

type ReviewState = 'draft' | 'saved' | 'submitted';

// Infer category from question text
const inferCategory = (text: string): string => {
  const lower = text.toLowerCase();
  if (lower.includes('collaborat') || lower.includes('team') || lower.includes('work together')) return 'Collaboration';
  if (lower.includes('deliver') || lower.includes('commitment') || lower.includes('deadline') || lower.includes('result')) return 'Delivery';
  if (lower.includes('communicat') || lower.includes('express') || lower.includes('share')) return 'Communication';
  if (lower.includes('lead') || lower.includes('manage') || lower.includes('guide') || lower.includes('mentor')) return 'Leadership';
  return 'General';
};

// Star Rating Component
function StarRating({
  value,
  onChange,
  disabled = false,
}: {
  value: number | undefined;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const getColor = (rating: number) => {
    if (rating <= 2) return '#f44336'; // red
    if (rating === 3) return '#ff9800'; // yellow
    return '#4caf50'; // green
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <IconButton
          key={star}
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          sx={{ p: 0.5 }}
          size="small"
        >
          {value && star <= value ? (
            <StarIcon sx={{ color: getColor(value), fontSize: 28 }} />
          ) : (
            <StarBorderIcon sx={{ color: 'action.disabled', fontSize: 28 }} />
          )}
        </IconButton>
      ))}
      {value && (
        <Typography variant="body2" sx={{ ml: 1, color: getColor(value), fontWeight: 600 }}>
          {value}/5
        </Typography>
      )}
    </Box>
  );
}

// Competency Card Component
function CompetencyCard({
  question,
  rating,
  comment,
  onRatingChange,
  onCommentChange,
  disabled = false,
}: {
  question: Question;
  rating: number | undefined;
  comment: string | undefined;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  disabled?: boolean;
}) {
  // Extract title and description from question text
  const parts = question.text.split(/[.:]/);
  const title = parts[0] || question.text;
  const description = parts.slice(1).join('.').trim() || 'Please rate this competency.';

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        transition: 'all 0.2s',
        '&:hover': !disabled ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
        border: rating ? `2px solid ${rating <= 2 ? '#f44336' : rating === 3 ? '#ff9800' : '#4caf50'}` : '2px solid transparent',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 1, fontSize: '1.1rem', fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: '0.9rem' }}>
          {description}
        </Typography>

        {question.type === 'SCALE' ? (
          <>
            <Box sx={{ mb: 2 }}>
              <StarRating value={rating} onChange={onRatingChange} disabled={disabled} />
            </Box>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              placeholder="Comments (optional)"
              value={comment || ''}
              onChange={(e) => {
                const val = e.target.value.slice(0, 500);
                onCommentChange(val);
              }}
              disabled={disabled}
              inputProps={{ maxLength: 500 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.9rem',
                },
              }}
            />
            {comment && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {comment.length}/500 characters
              </Typography>
            )}
          </>
        ) : (
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            placeholder="Your feedback..."
            value={comment || ''}
            onChange={(e) => {
              const val = e.target.value.slice(0, 500);
              onCommentChange(val);
            }}
            disabled={disabled}
            inputProps={{ maxLength: 500 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function Performance360Page() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['perf-questions'],
    queryFn: async () => (await api.get('/performance/360/questions')).data as { cycle: Cycle; questions: Question[] },
  });

  const authUserId = useAppSelector((s) => s.auth.user?.id) as string | undefined;

  // Fetch current user's employee record to get employeeId and managerId
  const { data: myEmp } = useQuery({
    queryKey: ['me-emp', authUserId],
    enabled: !!authUserId,
    queryFn: async () =>
      (await api.get('/employees', { params: { userId: authUserId, pageSize: 1 } })).data.items?.[0] as
        | { id: string; managerId?: string }
        | undefined,
  });
  const empId = myEmp?.id;

  const [targetMode, setTargetMode] = useState<'SELF' | 'MANAGER' | 'EMPLOYEE'>('SELF');
  const [targetEmployeeId, setTargetEmployeeId] = useState<string | undefined>(empId);

  // Update targetEmployeeId when empId changes or mode changes
  useEffect(() => {
    if (targetMode === 'SELF' && empId) {
      setTargetEmployeeId(empId);
    } else if (targetMode === 'MANAGER') {
      setTargetEmployeeId(myEmp?.managerId);
    }
    // For 'EMPLOYEE' mode, keep the current selection
  }, [targetMode, empId, myEmp?.managerId]);

  const [role, setRole] = useState<'SELF' | 'PEER' | 'MANAGER'>('SELF');
  const [answers, setAnswers] = useState<Record<string, { rating?: number; comment?: string }>>({});
  const [reviewState, setReviewState] = useState<ReviewState>('draft');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedTarget = targetMode === 'SELF' ? empId : targetMode === 'MANAGER' ? myEmp?.managerId : targetEmployeeId;

  // Fetch all employees for dropdown
  const { data: allEmployeesData } = useQuery({
    queryKey: ['all-employees'],
    queryFn: async () =>
      (await api.get('/employees', { params: { pageSize: 1000, sort: 'user.lastName:asc' } })).data as {
        items: Employee[];
      },
  });
  const allEmployees = allEmployeesData?.items || [];

  // Fetch target employee details
  const { data: targetEmployee } = useQuery({
    queryKey: ['target-employee', resolvedTarget],
    enabled: !!resolvedTarget,
    queryFn: async () =>
      (await api.get('/employees', { params: { id: resolvedTarget } })).data.items?.[0] as Employee | undefined,
  });

  // Load draft from localStorage
  useEffect(() => {
    if (!data?.cycle?.id || !resolvedTarget) return;
    const draftKey = `360-draft-${data.cycle.id}-${resolvedTarget}-${role}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        setReviewState(parsed.state || 'draft');
        if (parsed.lastSaved) setLastSaved(new Date(parsed.lastSaved));
      } catch (e) {
        console.error('Failed to load draft', e);
      }
    }
  }, [data?.cycle?.id, resolvedTarget, role]);

  const saveDraft = useCallback(() => {
    if (!data?.cycle?.id || !resolvedTarget) return;
    const draftKey = `360-draft-${data.cycle.id}-${resolvedTarget}-${role}`;
    const draftData = {
      answers,
      state: reviewState === 'submitted' ? 'submitted' : 'saved',
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    setReviewState('saved');
    setLastSaved(new Date());
  }, [data?.cycle?.id, resolvedTarget, role, answers, reviewState]);

  // Autosave with debounce (3 seconds)
  useEffect(() => {
    if (reviewState === 'submitted') return;
    const timeout = setTimeout(() => {
      saveDraft();
    }, 3000);
    return () => clearTimeout(timeout);
  }, [answers, reviewState, saveDraft]);

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] || {}), rating },
    }));
    setReviewState('draft');
  };

  const handleCommentChange = (questionId: string, comment: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] || {}), comment },
    }));
    setReviewState('draft');
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!data?.cycle?.id) {
        throw new Error('No active feedback cycle found');
      }
      if (!resolvedTarget) {
        throw new Error('Please select a target employee');
      }

      // Filter out empty answers and ensure we have at least one answer
      const validAnswers = Object.entries(answers)
        .filter(([_, v]) => v.rating !== undefined || (v.comment && v.comment.trim().length > 0))
        .map(([questionId, v]) => {
          const answer: { questionId: string; rating?: number; comment?: string } = {
            questionId,
          };
          if (v.rating !== undefined) {
            answer.rating = v.rating;
          }
          if (v.comment && v.comment.trim().length > 0) {
            answer.comment = v.comment.trim();
          }
          return answer;
        });

      if (validAnswers.length === 0) {
        throw new Error('Please provide at least one rating or comment before submitting');
      }

      const payload = {
        cycleId: data.cycle.id,
        targetEmployeeId: resolvedTarget,
        reviewerRole: role,
        answers: validAnswers,
      };

      return api.post('/performance/360/responses', payload);
    },
    onSuccess: () => {
      setReviewState('submitted');
      // Clear draft
      if (data?.cycle?.id && resolvedTarget) {
        const draftKey = `360-draft-${data.cycle.id}-${resolvedTarget}-${role}`;
        localStorage.removeItem(draftKey);
      }
      queryClient.invalidateQueries({ queryKey: ['perf-questions'] });
      alert('Review submitted successfully!');
    },
    onError: (error: any) => {
      handleApiError(error, 'Failed to submit review');
    },
  });

  const handleSaveDraft = () => {
    saveDraft();
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    submitMutation.mutate();
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  // Group questions by category
  const groupedQuestions = useMemo(() => {
    if (!data?.questions) return {};
    const groups: Record<string, Question[]> = {};
    data.questions.forEach((q) => {
      const category = inferCategory(q.text);
      if (!groups[category]) groups[category] = [];
      groups[category].push(q);
    });
    return groups;
  }, [data?.questions]);

  // Calculate progress
  const scaleQuestions = useMemo(
    () => data?.questions?.filter((q) => q.type === 'SCALE') || [],
    [data?.questions],
  );
  const completedCount = scaleQuestions.filter((q) => answers[q.id]?.rating).length;
  const totalCount = scaleQuestions.length;

  // Calculate summary stats
  const ratings = useMemo(
    () => scaleQuestions.map((q) => answers[q.id]?.rating).filter((r): r is number => r !== undefined),
    [scaleQuestions, answers],
  );
  const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const commentsCount = useMemo(
    () => Object.values(answers).filter((a) => a.comment && a.comment.trim().length > 0).length,
    [answers],
  );

  // Find highest and lowest rated competencies
  const ratedQuestions = useMemo(() => {
    return scaleQuestions
      .map((q) => ({ question: q, rating: answers[q.id]?.rating }))
      .filter((item): item is { question: Question; rating: number } => item.rating !== undefined)
      .sort((a, b) => b.rating - a.rating);
  }, [scaleQuestions, answers]);

  const highestRated = ratedQuestions.slice(0, 3);
  const lowestRated = ratedQuestions.slice(-3).reverse();

  const isDisabled = reviewState === 'submitted';

  return (
    <AppBarShell>
      <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 10 }}>
        {/* Header with Status */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                  360° Feedback Review
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {data?.cycle ? data.cycle.title : 'No active cycle'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {reviewState === 'draft' && (
                  <Chip label="Draft (unsaved)" color="error" size="small" />
                )}
                {reviewState === 'saved' && lastSaved && (
                  <Chip
                    label={`Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    color="success"
                    size="small"
                  />
                )}
                {reviewState === 'submitted' && <Chip label="Submitted (locked)" color="default" size="small" />}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Target & Reviewer Info */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'primary.main',
                      fontSize: '1.2rem',
                      fontWeight: 600,
                    }}
                  >
                    {targetEmployee
                      ? `${targetEmployee.user.firstName[0]}${targetEmployee.user.lastName[0]}`
                      : 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Target Employee
                    </Typography>
                    <Typography variant="h6">
                      {targetEmployee
                        ? `${targetEmployee.user.firstName} ${targetEmployee.user.lastName}`
                        : 'Loading...'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Review type: {targetMode === 'SELF' ? 'Self-review' : targetMode === 'MANAGER' ? 'Manager Review' : 'Employee Review'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Cycle: {data?.cycle?.title || 'N/A'}
                    </Typography>
                  </Box>
          </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Reviewer Role</InputLabel>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    label="Reviewer Role"
                    disabled={isDisabled}
                  >
              <MenuItem value="SELF">Self</MenuItem>
              <MenuItem value="PEER">Peer</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
            </Select>
                </FormControl>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Select
                    size="small"
                    value={targetMode}
                    onChange={(e) => setTargetMode(e.target.value as any)}
                    disabled={isDisabled}
                    sx={{ minWidth: 200 }}
                  >
                    <MenuItem value="SELF">Myself (self-review)</MenuItem>
                    <MenuItem value="MANAGER" disabled={!myEmp?.managerId}>
                      My Manager
                    </MenuItem>
                    <MenuItem value="EMPLOYEE">Specific Employee</MenuItem>
                  </Select>
                  {targetMode === 'EMPLOYEE' && (
                    <FormControl size="small" sx={{ minWidth: 250 }}>
                      <InputLabel>Select Employee</InputLabel>
                      <Select
                        value={targetEmployeeId || ''}
                        onChange={(e) => setTargetEmployeeId(e.target.value)}
                        label="Select Employee"
                        disabled={isDisabled}
                      >
                        {allEmployees.map((emp) => (
                          <MenuItem key={emp.id} value={emp.id}>
                            {emp.user.firstName} {emp.user.lastName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {totalCount > 0 && (
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                  Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed: {completedCount} / {totalCount} competencies
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(completedCount / totalCount) * 100}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </CardContent>
          </Card>
        )}

        {/* Main Content Area */}
        <Grid container spacing={3}>
          {/* Competencies */}
          <Grid item xs={12} md={isMobile ? 12 : 8}>
            {Object.entries(groupedQuestions).map(([category, questions]) => (
              <Box key={category} sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  {category}
                </Typography>
                <Grid container spacing={2}>
                  {questions.map((q) => (
                    <Grid item xs={12} key={q.id}>
                      <CompetencyCard
                        question={q}
                        rating={answers[q.id]?.rating}
                        comment={answers[q.id]?.comment}
                        onRatingChange={(rating) => handleRatingChange(q.id, rating)}
                        onCommentChange={(comment) => handleCommentChange(q.id, comment)}
                        disabled={isDisabled}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Grid>

          {/* Summary Panel (Desktop) */}
          {!isMobile && (
            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  boxShadow: 3,
                  position: 'sticky',
                  top: 20,
                  maxHeight: 'calc(100vh - 100px)',
                  overflow: 'auto',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Summary
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Average Rating
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {averageRating > 0 ? averageRating.toFixed(1) : '-'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {highestRated.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Highest-Rated Strengths
                    </Typography>
                    {highestRated.map((item) => (
                      <Box key={item.question.id} sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {item.question.text.split(/[.:]/)[0]}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                          <Typography variant="body2" fontWeight={600}>
                            {item.rating}/5
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {lowestRated.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Improvement Areas
                    </Typography>
                    {lowestRated.map((item) => (
                      <Box key={item.question.id} sx={{ mb: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {item.question.text.split(/[.:]/)[0]}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 16, color: '#f44336' }} />
                          <Typography variant="body2" fontWeight={600}>
                            {item.rating}/5
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Comments Entered
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {commentsCount}
                  </Typography>
          </Box>
              </Paper>
            </Grid>
          )}

          {/* Summary Panel (Mobile - Collapsed) */}
          {isMobile && (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Avg Rating
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {averageRating > 0 ? averageRating.toFixed(1) : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Comments
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {commentsCount}
                      </Typography>
                    </Grid>
                  </Grid>
        </CardContent>
      </Card>
            </Grid>
          )}
        </Grid>

        {/* Sticky Bottom Bar */}
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            boxShadow: 4,
            zIndex: 1000,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Box sx={{ maxWidth: 1100, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Button variant="outlined" onClick={handleSaveDraft} disabled={isDisabled || isSubmitting}>
              Save Draft
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {reviewState === 'saved' && lastSaved && (
                <Typography variant="caption" color="text.secondary">
                  Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              )}
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!data?.cycle || !resolvedTarget || isDisabled || isSubmitting || completedCount === 0}
                size="large"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </AppBarShell>
  );
}
