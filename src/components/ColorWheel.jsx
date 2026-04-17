import { useRef } from 'react'

const hexToHue = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  if (d === 0) return 0
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return ((h * 60) + 360) % 360
}

const hueToHex = (hue) => {
  const s = 65, l = 55, sn = s / 100, ln = l / 100
  const a = sn * Math.min(ln, 1 - ln)
  const f = n => {
    const k = (n + hue / 30) % 12
    const c = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export default function ColorWheel({ color, onChange }) {
  const ringRef = useRef(null)

  const hue = hexToHue(color)
  // Indicator position on the ring (ring sits at ~42% radius from center)
  const angleRad = (hue - 90) * Math.PI / 180
  const r = 42
  const ix = 50 + r * Math.cos(angleRad)
  const iy = 50 + r * Math.sin(angleRad)

  const handleClick = (e) => {
    const el = ringRef.current
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90
    const h = ((angle % 360) + 360) % 360
    onChange(hueToHex(h))
  }

  return (
    <div className="color-wheel-wrap">
      <div ref={ringRef} className="color-wheel-ring" onClick={handleClick}>
        <div className="color-wheel-center" style={{ background: color }} />
        <div className="color-wheel-indicator" style={{ left: `${ix}%`, top: `${iy}%` }} />
      </div>
      <p className="color-wheel-label">Click the wheel to pick a hue</p>
    </div>
  )
}
