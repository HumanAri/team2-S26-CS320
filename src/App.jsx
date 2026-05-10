import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { OnboardingProvider } from './context/OnboardingContext'
import LoginPage    from './pages/LoginPage'
import SignupPage   from './pages/SignupPage'
import HomePage     from './pages/HomePage'
import WrappedPage  from './pages/WrappedPage'
import Step1Emoji      from './pages/onboarding/Step1Emoji'
import Step2Categories from './pages/onboarding/Step2Categories'
import Step3Priority   from './pages/onboarding/Step3Priority'
import Step4Friends    from './pages/onboarding/Step4Friends'
import Step5Privacy    from './pages/onboarding/Step5Privacy'

export default function App() {
  return (
    <ThemeProvider>
      <OnboardingProvider>
        <HashRouter>
          <Routes>
            <Route path="/"            element={<LoginPage />} />
            <Route path="/signup"      element={<SignupPage />} />
            <Route path="/home"        element={<HomePage />} />
            <Route path="/wrapped"     element={<WrappedPage />} />
            <Route path="/onboarding/1" element={<Step1Emoji />} />
            <Route path="/onboarding/2" element={<Step2Categories />} />
            <Route path="/onboarding/3" element={<Step3Priority />} />
            <Route path="/onboarding/4" element={<Step4Friends />} />
            <Route path="/onboarding/5" element={<Step5Privacy />} />
            <Route path="*"            element={<Navigate to="/" />} />
          </Routes>
        </HashRouter>
      </OnboardingProvider>
    </ThemeProvider>
  )
}
