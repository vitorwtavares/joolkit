import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import AuthGuard from './components/auth/AuthGuard'
import Layout from './components/layout/Layout'
import QuickCopy from './pages/QuickCopy'
import CoverLetter from './pages/CoverLetter'
import AnswerBank from './pages/AnswerBank'
import ApplicationTracker from './pages/ApplicationTracker'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import NotFound from './pages/NotFound'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route element={<AuthGuard />}>
            <Route path="/" element={<Navigate to="/quick-copy" replace />} />
            <Route element={<Layout />}>
              <Route path="/quick-copy" element={<QuickCopy />} />
              <Route path="/cover-letter" element={<CoverLetter />} />
              <Route path="/answer-bank" element={<AnswerBank />} />
              <Route path="/tracker" element={<ApplicationTracker />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </TooltipProvider>
  )
}
