import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import AuthGuard from './components/auth/AuthGuard'
import Layout from './components/layout/Layout'
import QuickCopy from './pages/QuickCopy'
import CoverLetter from './pages/CoverLetter'
import AnswerBank from './pages/AnswerBank'
import ApplicationTracker from './pages/ApplicationTracker'
import Settings from './pages/Settings'
import { AccountSettings } from './components/settings/AccountSettings'
import { BillingSettings } from './components/settings/BillingSettings'
import { UpgradeProvider } from './components/billing/UpgradeProvider'
import LandingPage from './pages/landing/LandingPage'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { warmupApi } from './utils/warmupApi'

export default function App() {
  useEffect(() => {
    warmupApi()
  }, [])

  return (
    <TooltipProvider>
      <BrowserRouter>
        <UpgradeProvider>
          <Routes>
            <Route path="/landing-page" element={<LandingPage />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<AuthGuard />}>
              <Route path="/" element={<Navigate to="/quick-copy" replace />} />
              <Route element={<Layout />}>
                <Route path="/quick-copy" element={<QuickCopy />} />
                <Route path="/cover-letter" element={<CoverLetter />} />
                <Route path="/answer-bank" element={<AnswerBank />} />
                <Route path="/tracker" element={<ApplicationTracker />} />
                <Route path="/settings" element={<Settings />}>
                  <Route index element={<Navigate to="account" replace />} />
                  <Route path="account" element={<AccountSettings />} />
                  <Route path="billing" element={<BillingSettings />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </UpgradeProvider>
      </BrowserRouter>
    </TooltipProvider>
  )
}
