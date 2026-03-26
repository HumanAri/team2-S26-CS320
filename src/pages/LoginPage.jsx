import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import ThemeToggle from '../components/ThemeToggle'
import HippoButton from '../components/HippoButton'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    // TODO: Replace with your authentication API call
    //
    // try {
    //   const res = await fetch('/api/auth/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email, password })
    //   })
    //   if (!res.ok) throw new Error('Invalid credentials. Please try again.')
    //   navigate('/dashboard')
    // } catch (err) {
    //   setError(err.message)
    // }
    console.log('Login submitted:', { email, password })
  }

  return (
    <>
      <Brand />
      <ThemeToggle />
      <div className="card">
        <div className="tab-row">
          <button className="tab active">Login</button>
          <button className="tab" onClick={() => navigate('/signup')}>Signup</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="input-wrapper">
            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m2 7 10 7 10-7"/>
            </svg>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="input-wrapper">
            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="error-msg visible" role="alert">{error}</p>}
          <HippoButton label="LOG IN" id="login" />
        </form>
        <p className="alt-link">Not a member? <span onClick={() => navigate('/signup')}>Sign up now</span></p>
      </div>
    </>
  )
}
