import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Tracker from './pages/Tracker';
import { useLanguage } from './i18n/useLanguage';

const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard'));

function AnalyticsRoute() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<p role="status" className="p-6 text-sm">{t('Loading analytics…')}</p>}>
      <AnalyticsDashboard />
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Tracker />} />
          <Route path="/analytics" element={<AnalyticsRoute />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
