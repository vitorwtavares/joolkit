import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import Layout from './components/layout/Layout'
import QuickCopy from './pages/QuickCopy'
import CoverLetter from './pages/CoverLetter'
import AnswerBank from './pages/AnswerBank'
import ApplicationTracker from './pages/ApplicationTracker'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/quick-copy" replace />} />
        <Route element={<Layout />}>
          <Route path="/quick-copy" element={<QuickCopy />} />
          <Route path="/cover-letter" element={<CoverLetter />} />
          <Route path="/answer-bank" element={<AnswerBank />} />
          <Route path="/tracker" element={<ApplicationTracker />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
