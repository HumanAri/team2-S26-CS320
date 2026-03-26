import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { toggleTheme } = useTheme()
  return (
    <div className="theme-toggle" onClick={toggleTheme} title="Toggle light / dark mode">
      <span className="toggle-icon">☀️</span>
      <div className="toggle-track"><div className="toggle-knob" /></div>
      <span className="toggle-icon">🌙</span>
    </div>
  )
}
