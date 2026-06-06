import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Tracker from './pages/Tracker'
import AnalyticsDashboard from './pages/AnalyticsDashboard'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<AnalyticsDashboard />} />
        <Route path="/tracker" element={<Tracker />} />
      </Route>
    </Routes>
  )
}

export default App

