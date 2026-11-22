import { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Login from './components/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Tracker from './pages/Tracker';
import { useLanguage } from './i18n/useLanguage';

const Register = lazy(() => import('./components/auth/Register'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
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
  const Router = import.meta.env.MODE === 'app' ? HashRouter : BrowserRouter;
  return (
    <>
      <Router>
        <Suspense fallback={null}>
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
        </Suspense>
      </Router>
      {import.meta.env.MODE !== 'app' && <Analytics />}
    </>
  );
}

export default App;
