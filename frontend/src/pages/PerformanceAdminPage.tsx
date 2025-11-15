import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import AppBarShell from '../components/AppBarShell';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  useTheme,
  LinearProgress,
  Divider,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useState, useMemo } from 'react';

type Item = {
  employeeId: string;
  weightedScore: number | null;
  avgSentiment: number | null;
  countsByRole: Record<string, number>;
  avgByRole?: Record<string, number>;
};

type Detailed = Array<{
  questionId: string;
  reviewerEmpId: string;
  targetEmpId?: string;
  reviewerRole?: string;
  rating?: number;
  sentiment?: number;
  comment?: string;
}>;

type Employee = {
  id: string;
  user: { firstName: string; lastName: string; email: string };
  department?: { name: string } | null;
  position?: { title: string } | null;
};

type Question = {
  id: string;
  text: string;
  type: 'SCALE' | 'TEXT';
};

type SortField = 'rating' | 'question' | 'reviewer' | 'sentiment';
type SortOrder = 'asc' | 'desc';

const getRatingColor = (rating: number | null | undefined) => {
  if (rating === null || rating === undefined) return '#9e9e9e';
  if (rating <= 2) return '#f44336';
  if (rating === 3) return '#ff9800';
  return '#4caf50';
};

const getSentimentColor = (sentiment: number | null | undefined) => {
  if (sentiment === null || sentiment === undefined) return '#9e9e9e';
  if (sentiment > 0.2) return '#4caf50';
  if (sentiment < -0.2) return '#f44336';
  return '#ff9800';
};

const formatQuestionText = (text: string): string => {
  // Remove technical IDs and format nicely
  return text
    .replace(/\(1-5\)/g, '')
    .replace(/seed-q-\d+/gi, '')
    .trim();
};

function EmployeeCard({ item, employee }: { item: Item; employee?: Employee }) {
  const theme = useTheme();
  const score = item.weightedScore ?? 0;
  const sentiment = item.avgSentiment ?? 0;
  const totalResponses = (item.countsByRole?.SELF || 0) + (item.countsByRole?.PEER || 0) + (item.countsByRole?.MANAGER || 0);

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 2,
        boxShadow: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.main',
              fontSize: '1.3rem',
              fontWeight: 600,
            }}
          >
            {employee
              ? `${employee.user.firstName[0]}${employee.user.lastName[0]}`
              : item.employeeId.slice(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {employee ? `${employee.user.firstName} ${employee.user.lastName}` : 'Unknown Employee'}
            </Typography>
            {employee?.position && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {employee.position.title}
              </Typography>
            )}
            {employee?.department && (
              <Typography variant="caption" color="text.secondary">
                {employee.department.name}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontFamily: 'monospace' }}>
              ID: {item.employeeId.slice(0, 8)}...
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Weighted Score
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: getRatingColor(score),
                }}
              >
                {score > 0 ? score.toFixed(2) : '-'}
              </Typography>
              {score > 0 && (
                <StarIcon sx={{ fontSize: 20, color: getRatingColor(score) }} />
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Sentiment
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: getSentimentColor(sentiment),
              }}
            >
              {sentiment !== 0 ? (sentiment > 0 ? '+' : '') + sentiment.toFixed(2) : '-'}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Average Ratings by Role
          </Typography>
          <Grid container spacing={1}>
            {item.avgByRole?.SELF !== undefined && (
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Self
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                    <StarIcon sx={{ fontSize: 14, color: getRatingColor(item.avgByRole.SELF) }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.avgByRole.SELF.toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ({item.countsByRole?.SELF || 0})
                  </Typography>
                </Box>
              </Grid>
            )}
            {item.avgByRole?.PEER !== undefined && (
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Peer
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                    <StarIcon sx={{ fontSize: 14, color: getRatingColor(item.avgByRole.PEER) }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.avgByRole.PEER.toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ({item.countsByRole?.PEER || 0})
                  </Typography>
                </Box>
              </Grid>
            )}
            {item.avgByRole?.MANAGER !== undefined && (
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Manager
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                    <StarIcon sx={{ fontSize: 14, color: getRatingColor(item.avgByRole.MANAGER) }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.avgByRole.MANAGER.toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ({item.countsByRole?.MANAGER || 0})
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>

        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="text.secondary">
            Total Responses: <strong>{totalResponses}</strong>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function ExpandableComment({ comment }: { comment: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = comment.length > 100;

  if (!shouldTruncate) {
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
        {comment}
      </Typography>
    );
  }

  return (
    <Box>
      <Typography
        variant="body2"
        sx={{
          whiteSpace: 'pre-wrap',
          color: 'text.primary',
          display: expanded ? 'block' : '-webkit-box',
          WebkitLineClamp: expanded ? 'none' : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {comment}
      </Typography>
      <IconButton
        size="small"
        onClick={() => setExpanded(!expanded)}
        sx={{ mt: 0.5, p: 0.5 }}
      >
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </IconButton>
    </Box>
  );
}

export default function PerformanceAdminPage() {
  const theme = useTheme();
  const [sortField, setSortField] = useState<SortField>('rating');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data } = useQuery({
    queryKey: ['perf-agg'],
    queryFn: async () =>
      (await api.get('/performance/360/aggregates')).data as { items: Item[]; detailed?: Detailed },
  });

  // Fetch all employees for name mapping
  const { data: employeesData } = useQuery({
    queryKey: ['all-employees-admin'],
    queryFn: async () =>
      (await api.get('/employees', { params: { pageSize: 1000, sort: 'user.lastName:asc' } })).data as {
        items: Employee[];
      },
  });
  const employees = employeesData?.items || [];
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // Fetch questions for question text mapping
  const { data: questionsData } = useQuery({
    queryKey: ['perf-questions-admin'],
    queryFn: async () =>
      (await api.get('/performance/360/questions')).data as { cycle: { id: string; title: string }; questions: Question[] },
  });
  const questions = questionsData?.questions || [];
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Calculate average ratings by role for each employee
  const itemsWithAverages = useMemo(() => {
    if (!data?.items || !data?.detailed) return data?.items || [];

    return (data.items || []).map((item) => {
      const employeeResponses = data.detailed.filter((d) => d.targetEmpId === item.employeeId);

      const avgByRole: Record<string, number> = {};
      const ratingsByRole: Record<string, number[]> = {};

      employeeResponses.forEach((resp) => {
        if (resp.rating !== undefined && resp.reviewerRole) {
          if (!ratingsByRole[resp.reviewerRole]) {
            ratingsByRole[resp.reviewerRole] = [];
          }
          ratingsByRole[resp.reviewerRole].push(resp.rating);
        }
      });

      Object.entries(ratingsByRole).forEach(([role, ratings]) => {
        if (ratings.length > 0) {
          avgByRole[role] = Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2));
        }
      });

      return { ...item, avgByRole };
    });
  }, [data?.items, data?.detailed]);

  // Calculate aggregated statistics
  const aggregatedStats = useMemo(() => {
    if (!itemsWithAverages.length) return null;

    const allScores = itemsWithAverages
      .map((item) => item.weightedScore)
      .filter((s): s is number => s !== null && s !== undefined);
    const allSentiments = itemsWithAverages
      .map((item) => item.avgSentiment)
      .filter((s): s is number => s !== null && s !== undefined);

    const totalResponses = itemsWithAverages.reduce(
      (sum, item) =>
        sum + (item.countsByRole?.SELF || 0) + (item.countsByRole?.PEER || 0) + (item.countsByRole?.MANAGER || 0),
      0,
    );

    const selfRatings: number[] = [];
    const peerRatings: number[] = [];
    const managerRatings: number[] = [];

    itemsWithAverages.forEach((item) => {
      if (item.avgByRole?.SELF) selfRatings.push(item.avgByRole.SELF);
      if (item.avgByRole?.PEER) peerRatings.push(item.avgByRole.PEER);
      if (item.avgByRole?.MANAGER) managerRatings.push(item.avgByRole.MANAGER);
    });

    const avgSelf = selfRatings.length > 0 ? selfRatings.reduce((a, b) => a + b, 0) / selfRatings.length : 0;
    const avgPeer = peerRatings.length > 0 ? peerRatings.reduce((a, b) => a + b, 0) / peerRatings.length : 0;
    const avgManager =
      managerRatings.length > 0 ? managerRatings.reduce((a, b) => a + b, 0) / managerRatings.length : 0;

    // Find highest and lowest competencies
    const competencyScores: Record<string, number[]> = {};
    data?.detailed?.forEach((resp) => {
      if (resp.rating !== undefined && resp.questionId) {
        const question = questionMap.get(resp.questionId);
        if (question) {
          const competency = formatQuestionText(question.text);
          if (!competencyScores[competency]) competencyScores[competency] = [];
          competencyScores[competency].push(resp.rating);
        }
      }
    });

    const competencyAverages = Object.entries(competencyScores).map(([name, scores]) => ({
      name,
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));

    const sortedCompetencies = competencyAverages.sort((a, b) => b.average - a.average);
    const highestCompetency = sortedCompetencies[0];
    const lowestCompetency = sortedCompetencies[sortedCompetencies.length - 1];

    return {
      avgScore: allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0,
      avgSentiment: allSentiments.length > 0 ? allSentiments.reduce((a, b) => a + b, 0) / allSentiments.length : 0,
      totalResponses,
      totalEmployees: itemsWithAverages.length,
      avgSelf,
      avgPeer,
      avgManager,
      highestCompetency,
      lowestCompetency,
    };
  }, [itemsWithAverages, data?.detailed, questionMap]);

  // Sort detailed responses
  const sortedDetailed = useMemo(() => {
    if (!data?.detailed) return [];

    const sorted = [...data.detailed];
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'rating':
          aVal = a.rating ?? -1;
          bVal = b.rating ?? -1;
          break;
        case 'question':
          aVal = questionMap.get(a.questionId)?.text || '';
          bVal = questionMap.get(b.questionId)?.text || '';
          break;
        case 'reviewer':
          aVal = a.reviewerRole || '';
          bVal = b.reviewerRole || '';
          break;
        case 'sentiment':
          aVal = a.sentiment ?? -999;
          bVal = b.sentiment ?? -999;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data?.detailed, sortField, sortOrder, questionMap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };


  return (
    <AppBarShell>
      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            360° Feedback Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive performance analysis and insights
          </Typography>
        </Box>

        {/* Aggregated Statistics */}
        {aggregatedStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                      Average Score
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: getRatingColor(aggregatedStats.avgScore) }}>
                    {aggregatedStats.avgScore.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Across {aggregatedStats.totalEmployees} employees
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                      Total Responses
                    </Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {aggregatedStats.totalResponses}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Feedback entries collected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                      Avg Sentiment
                    </Typography>
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: getSentimentColor(aggregatedStats.avgSentiment) }}
                  >
                    {aggregatedStats.avgSentiment > 0 ? '+' : ''}
                    {aggregatedStats.avgSentiment.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Overall feedback tone
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    Role Averages
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Self:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: getRatingColor(aggregatedStats.avgSelf) }}>
                        {aggregatedStats.avgSelf.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Peer:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: getRatingColor(aggregatedStats.avgPeer) }}>
                        {aggregatedStats.avgPeer.toFixed(1)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Manager:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: getRatingColor(aggregatedStats.avgManager) }}>
                        {aggregatedStats.avgManager.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Heatmap for Role Comparison */}
        {aggregatedStats && (
          <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Role Comparison Heatmap
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Self Assessment
                    </Typography>
                    <Box
                      sx={{
                        height: 60,
                        bgcolor: getRatingColor(aggregatedStats.avgSelf),
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                        {aggregatedStats.avgSelf.toFixed(1)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(aggregatedStats.avgSelf / 5) * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Peer Review
                    </Typography>
                    <Box
                      sx={{
                        height: 60,
                        bgcolor: getRatingColor(aggregatedStats.avgPeer),
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                        {aggregatedStats.avgPeer.toFixed(1)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(aggregatedStats.avgPeer / 5) * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Manager Review
                    </Typography>
                    <Box
                      sx={{
                        height: 60,
                        bgcolor: getRatingColor(aggregatedStats.avgManager),
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                        {aggregatedStats.avgManager.toFixed(1)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(aggregatedStats.avgManager / 5) * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Employee Cards */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Employee Performance Summary
          </Typography>
          <Grid container spacing={3}>
            {itemsWithAverages.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No feedback data available</Typography>
                </Paper>
              </Grid>
            ) : (
              itemsWithAverages.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.employeeId}>
                  <EmployeeCard item={item} employee={employeeMap.get(item.employeeId)} />
                </Grid>
              ))
            )}
          </Grid>
        </Box>

        {/* Detailed Responses Table */}
        {data?.detailed && data.detailed.length > 0 && (
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Detailed Feedback Responses
              </Typography>
              <Paper sx={{ overflow: 'auto' }}>
                <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Target Employee</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        <TableSortLabel
                          active={sortField === 'question'}
                          direction={sortField === 'question' ? sortOrder : 'asc'}
                          onClick={() => handleSort('question')}
                        >
                          Competency
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        <TableSortLabel
                          active={sortField === 'reviewer'}
                          direction={sortField === 'reviewer' ? sortOrder : 'asc'}
                          onClick={() => handleSort('reviewer')}
                        >
                          Reviewer
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        <TableSortLabel
                          active={sortField === 'rating'}
                          direction={sortField === 'rating' ? sortOrder : 'asc'}
                          onClick={() => handleSort('rating')}
                        >
                          Rating
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        <TableSortLabel
                          active={sortField === 'sentiment'}
                          direction={sortField === 'sentiment' ? sortOrder : 'asc'}
                          onClick={() => handleSort('sentiment')}
                        >
                          Sentiment
                        </TableSortLabel>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Comment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                    {sortedDetailed.map((d, i) => {
                      const targetEmployee = employeeMap.get(d.targetEmpId || '');
                      const question = questionMap.get(d.questionId);
                      const questionText = question ? formatQuestionText(question.text) : d.questionId;

                      return (
                        <TableRow
                          key={i}
                          hover
                          sx={{
                            '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                          }}
                        >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: 'primary.main',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {targetEmployee
                                    ? `${targetEmployee.user.firstName[0]}${targetEmployee.user.lastName[0]}`
                                    : 'U'}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {targetEmployee
                                      ? `${targetEmployee.user.firstName} ${targetEmployee.user.lastName}`
                                      : d.targetEmpId || '-'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{questionText}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              {d.reviewerEmpId === 'anon' ? (
                                <Chip
                                  icon={<PersonIcon />}
                                  label="Anonymous Reviewer"
                                  size="small"
                                  color="default"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip
                                  label={d.reviewerRole || 'N/A'}
                                  size="small"
                                  color={
                                    d.reviewerRole === 'MANAGER'
                                      ? 'primary'
                                      : d.reviewerRole === 'PEER'
                                        ? 'secondary'
                                        : 'default'
                                  }
                                />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {d.rating !== undefined ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                  <StarIcon sx={{ fontSize: 18, color: getRatingColor(d.rating) }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {d.rating}/5
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {d.sentiment !== undefined && d.sentiment !== null ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: getSentimentColor(d.sentiment),
                                    fontWeight: 600,
                                  }}
                                >
                                  {d.sentiment > 0 ? '+' : ''}
                                  {d.sentiment.toFixed(2)}
                                </Typography>
                              ) : (
                                <Typography color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {d.comment ? (
                                <ExpandableComment comment={d.comment} />
                              ) : (
                                <Typography color="text.secondary">-</Typography>
                              )}
                            </TableCell>
                  </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              </Paper>
        </CardContent>
      </Card>
        )}
      </Box>
    </AppBarShell>
  );
}
