import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import Brand from '../components/Brand'
import ThemeToggle from '../components/ThemeToggle'
import HippoButton from '../components/HippoButton'

export default function SignupPage() {
  const navigate = useNavigate()
  const [name, setName]                     = useState('')
  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                   = useState('')

  const umassSignup = useGoogleLogin({
    flow: 'implicit',
    hint: 'umass.edu',
    onSuccess: async (tokenResponse) => {
      setError('')
      try {
        const res = await fetch('http://localhost:8000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.detail || 'Sign up failed')
          return
        }
        localStorage.setItem('token', data.token)
        navigate('/onboarding/1')
      } catch {
        setError('Could not connect to server')
      }
    },
    onError: () => setError('UMass sign-up failed'),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    // TODO: Replace with your registration API call
    //
    // try {
    //   const res = await fetch('/api/auth/register', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ name, email, password })
    //   })
    //   if (!res.ok) throw new Error('Registration failed. Please try again.')
    // } catch (err) {
    //   setError(err.message)
    //   return
    // }
    console.log('Signup submitted:', { name, email, password })
    navigate('/onboarding/1')
  }

  return (
    <>
      <Brand />
      <ThemeToggle />
      <div className="card">
        <div className="tab-row">
          <button className="tab" onClick={() => navigate('/')}>Login</button>
          <button className="tab active">Signup</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="input-wrapper">
            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
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
              autoComplete="new-password"
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
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="error-msg visible" role="alert">{error}</p>}
          <HippoButton label="SIGN UP" id="signup" />
        </form>
        <div className="divider"><span>or</span></div>
        <button className="umass-btn" onClick={() => umassSignup()}>
          Sign Up with UMass Email
        </button>
        <p className="alt-link">Already a member? <span onClick={() => navigate('/')}>Login</span></p>
      </div>
    </>
  )
}
