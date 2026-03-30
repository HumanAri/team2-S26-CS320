import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import Brand from '../components/Brand'
import ThemeToggle from '../components/ThemeToggle'
import HippoButton from '../components/HippoButton'

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const googleLogin = useGoogleLogin({
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
          setError(data.detail || 'Login failed')
          return
        }
        localStorage.setItem('token', data.token)
        navigate('/dashboard')
      } catch {
        setError('Could not connect to server')
      }
    },
    onError: () => setError('Google login failed'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    googleLogin()
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
          {error && <p className="error-msg visible" role="alert">{error}</p>}
          <HippoButton label="LOG IN" id="login" />
        </form>
        <p className="alt-link">Not a member? <span onClick={() => navigate('/signup')}>Sign up now</span></p>
      </div>
    </>
  )
}
