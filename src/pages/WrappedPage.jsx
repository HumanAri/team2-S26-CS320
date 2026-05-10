import { useNavigate } from 'react-router-dom'
import HippoButton from '../components/HippoButton'

export default function WrappedPage() {
  const navigate = useNavigate()

  return (
    <main className="wrapped-page">
      <section className="wrapped-page-panel">
        <div className="wrapped-page-hippo">
          <HippoButton label="WRAPPED" id="wrapped-page-hippo" type="button" />
        </div>
        <p className="wrapped-page-kicker">Habitask Wrapped</p>
        <h1 className="wrapped-page-title">Your Wrapped is ready for its data.</h1>
        <p className="wrapped-page-copy">
          This is the frontend placeholder until the real Wrapped summary and backend endpoints land.
        </p>
        <button type="button" className="wrapped-page-home-button" onClick={() => navigate('/home')}>
          Back Home
        </button>
      </section>
    </main>
  )
}
