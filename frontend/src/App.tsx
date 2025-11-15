import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import DocumentsPage from './pages/DocumentsPage';
import TimeTrackingPage from './pages/TimeTrackingPage';
import LearningPage from './pages/LearningPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import PositionsPage from './pages/PositionsPage';
import EmployeeDocumentsPage from './pages/EmployeeDocumentsPage';
import VacanciesPage from './pages/VacanciesPage';
import VacancyDetailsPage from './pages/VacancyDetailsPage';
import CandidateVacancyDetailsPage from './pages/CandidateVacancyDetailsPage';
import Performance360Page from './pages/Performance360Page';
import PerformanceAdminPage from './pages/PerformanceAdminPage';
import DepartmentsPage from './pages/DepartmentsPage';
import CourseDetailPage from './pages/CourseDetailPage';
import { useAppSelector } from './store/hooks';

const theme = createTheme();

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = useAppSelector((s) => s.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

function HomeRoute() {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (role === 'CANDIDATE') return <Navigate to="/recruitment/vacancies" replace />;
  return <DashboardPage />;
}

function VacancyDetailsRoute() {
  const role = useAppSelector((s) => s.auth.user?.role);
  const token = useAppSelector((s) => s.auth.token);
  // For unauthenticated users, show candidate view
  if (!token) return <CandidateVacancyDetailsPage />;
  return role === 'CANDIDATE' ? <CandidateVacancyDetailsPage /> : <VacancyDetailsPage />;
}

// Public route wrapper - allows access without authentication
function PublicRoute({ children }: { children: JSX.Element }) {
  return children;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Public routes - accessible without authentication */}
        <Route path="/recruitment/vacancies" element={<PublicRoute><VacanciesPage /></PublicRoute>} />
        <Route path="/recruitment/vacancies/:id" element={<PublicRoute><VacancyDetailsRoute /></PublicRoute>} />
        {/* Private routes - require authentication */}
        <Route path="/" element={<PrivateRoute><HomeRoute /></PrivateRoute>} />
        <Route path="/employees" element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
        <Route path="/employees/:id" element={<PrivateRoute><EmployeeProfilePage /></PrivateRoute>} />
        <Route path="/departments" element={<PrivateRoute><DepartmentsPage /></PrivateRoute>} />
        <Route path="/positions" element={<PrivateRoute><PositionsPage /></PrivateRoute>} />
        <Route path="/employees/:id/documents" element={<PrivateRoute><EmployeeDocumentsPage /></PrivateRoute>} />
        <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
        <Route path="/time" element={<PrivateRoute><TimeTrackingPage /></PrivateRoute>} />
        <Route path=":userId/time" element={<PrivateRoute><TimeTrackingPage /></PrivateRoute>} />
        <Route path="/learning" element={<PrivateRoute><LearningPage /></PrivateRoute>} />
        <Route path="/learning/courses/:id" element={<PrivateRoute><CourseDetailPage /></PrivateRoute>} />
        <Route path="/performance" element={<PrivateRoute><Performance360Page /></PrivateRoute>} />
        <Route path="/performance/admin" element={<PrivateRoute><PerformanceAdminPage /></PrivateRoute>} />
      </Routes>
    </ThemeProvider>
  );
}


