import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/"        element={<LoginPage />} />
          <Route path="/signup"  element={<SignupPage />} />
          <Route path="*"        element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}
