import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function HippoButton({ label, id }) {
  const btnRef = useRef(null)

  useEffect(() => {
    const btn = btnRef.current
    if (!btn) return

    const mouthSpeed = 0.3
    const easeType   = 'power2.out'

    // Mouth open timeline
    const tl = gsap.timeline({ paused: true })
    tl.to(btn.querySelector('.mouth-back'), { duration: mouthSpeed,       ease: easeType, y: -70                                         }, 0)
    tl.to(btn.querySelector('.tongue'),     { duration: mouthSpeed * 1.5, ease: easeType, y: -70                                         }, 0)
    tl.to(btn.querySelector('.teeth'),      { duration: mouthSpeed,       ease: easeType, y: -70, scaleY: 1.2                            }, 0)
    tl.to(btn.querySelector('.body'),       { duration: mouthSpeed,       ease: easeType, scaleY: 1.06, transformOrigin: 'center bottom'  }, 0)
    tl.to(btn.querySelector('.freckles'),   { duration: mouthSpeed,       ease: easeType, y: -10                                         }, 0)
    tl.to(btn.querySelector('.ears'),       { duration: mouthSpeed,       ease: easeType, y: 6                                           }, 0)
    tl.to(btn.querySelector('.eye-right'),  { duration: mouthSpeed,       ease: easeType, x: -2                                          }, 0)
    tl.to(btn.querySelector('.eye-left'),   { duration: mouthSpeed,       ease: easeType, x: 2                                           }, 0)
    tl.to(btn.querySelector('.eyes'),       { duration: mouthSpeed,       ease: easeType, y: 2                                           }, 0)
    tl.to(btn.querySelector('.nostrils'),   { duration: mouthSpeed,       ease: easeType, y: -6                                          }, 0)

    const handleEnter = () => tl.play()
    const handleLeave = () => tl.reverse()
    btn.addEventListener('mouseenter', handleEnter)
    btn.addEventListener('mouseleave', handleLeave)

    // Ear wiggle every 2.5s
    gsap.set(btn.querySelector('.ear-right'), { transformOrigin: 'center center' })
    const earWiggle = gsap.timeline({ paused: true, repeat: 2 })
    earWiggle.to(btn.querySelector('.ear-right'), { duration: 0.1, rotation: 45 })
    earWiggle.to(btn.querySelector('.ear-right'), { duration: 0.1, rotation: 0  })
    const wiggleInterval = setInterval(() => earWiggle.play(0), 2500)

    // Eye tracking
    const eyeRightPupil = btn.querySelector('.eye-right-pupil')
    const eyeLeftPupil  = btn.querySelector('.eye-left-pupil')
    const eyeLeftInner  = btn.querySelector('.eye-left-inner')

    const handleMouseMove = (e) => {
      const rect     = eyeLeftInner.getBoundingClientRect()
      const pupilRect = eyeLeftPupil.getBoundingClientRect()
      const xRange   = (rect.width  - pupilRect.width)  / 2
      const yRange   = (rect.height - pupilRect.height) / 2
      const px = ((e.clientX / document.body.clientWidth)  * 2 - 1) * xRange
      const py = ((e.clientY / document.body.clientHeight) * 2 - 1) * yRange
      eyeLeftPupil.style.transform  = `translate(${px}px, ${py}px)`
      eyeRightPupil.style.transform = `translate(${px}px, ${py}px)`
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      btn.removeEventListener('mouseenter', handleEnter)
      btn.removeEventListener('mouseleave', handleLeave)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(wiggleInterval)
      tl.kill()
      earWiggle.kill()
    }
  }, [])

  const eyeRClip = `${id}-eyeRClip`
  const eyeLClip = `${id}-eyeLClip`
  const mouthClip = `${id}-mouthClip`

  return (
    <button type="submit" className="btn-hippo" ref={btnRef} aria-label={label}>
      <svg viewBox="0 0 242 109" xmlns="http://www.w3.org/2000/svg">
        <g className="ears">
          <g className="ear-left">
            <ellipse className="ear-left-outer"  transform="matrix(0.9391 -0.3436 0.3436 0.9391 -3.6062 17.8444)"  cx="48.5"  cy="19.1" rx="11.4" ry="13.8"/>
            <ellipse className="ear-left-inner"  transform="matrix(0.9391 -0.3436 0.3436 0.9391 -3.8876 17.4659)"  cx="47.3"  cy="19.7" rx="7.3"  ry="11.2"/>
          </g>
          <g className="ear-right">
            <ellipse className="ear-right-outer" transform="matrix(0.3436 -0.9391 0.9391 0.3436 106.5379 189.869)" cx="189.1" cy="18.7" rx="14.4" ry="11.9"/>
            <ellipse className="ear-right-inner" transform="matrix(0.3436 -0.9391 0.9391 0.3436 106.8522 191.5127)" cx="190.4" cy="19.3" rx="11.7" ry="7.7"/>
          </g>
        </g>
        <g className="eyes">
          <defs>
            <clipPath id={eyeRClip}>
              <path d="M175,25c0-11-7.8-20-17.5-20S140,14,140,25c0,0.7,0,1.3,0.1,2h34.8C175,26.3,175,25.7,175,25z"/>
            </clipPath>
          </defs>
          <g className="eye-right">
            <path className="eye-right-outer" d="M174.9,27H186c0-0.3,0-0.7,0-1c0-14.4-11.6-26-26-26c-14.4,0-26,11.6-26,26c0,0.3,0,0.7,0,1h6.1H174.9z"/>
            <path className="eye-right-inner" d="M175,25c0-11-7.8-20-17.5-20S140,14,140,25c0,0.7,0,1.3,0.1,2h34.8C175,26.3,175,25.7,175,25z"/>
            <g clipPath={`url(#${eyeRClip})`}>
              <circle className="eye-right-pupil" cx="158" cy="18" r="5"/>
            </g>
          </g>
          <defs>
            <clipPath id={eyeLClip}>
              <path d="M97,25c0-11-7.8-20-17.5-20S62,14,62,25c0,0.7,0,1.3,0.1,2h34.8C97,26.3,97,25.7,97,25z"/>
            </clipPath>
          </defs>
          <g className="eye-left">
            <path className="eye-left-outer" d="M96.9,27h6.1c0-0.3,0-0.7,0-1c0-14.4-11.6-26-26-26C62.6,0,51,11.6,51,26c0,0.3,0,0.7,0,1h11.1H96.9z"/>
            <path className="eye-left-inner" d="M97,25c0-11-7.8-20-17.5-20S62,14,62,25c0,0.7,0,1.3,0.1,2h34.8C97,26.3,97,25.7,97,25z"/>
            <g clipPath={`url(#${eyeLClip})`}>
              <circle className="eye-left-pupil" cx="80" cy="17.7" r="5"/>
            </g>
          </g>
        </g>
        <g className="nostrils">
          <g className="nostril-right">
            <ellipse className="nostril-right-outer" cx="130.5" cy="27.5" rx="6.5" ry="5.5"/>
            <circle  className="nostril-right-inner" cx="130"   cy="28"   r="4"/>
          </g>
          <g className="nostril-left">
            <ellipse className="nostril-left-outer"  cx="106.5" cy="27.5" rx="6.5" ry="5.5"/>
            <circle  className="nostril-left-inner"  cx="107"   cy="28"   r="4"/>
          </g>
        </g>
        <path className="body" d="M218,98H24C10.8,98,0,87.2,0,74V51c0-13.2,10.8-24,24-24h194c13.2,0,24,10.8,24,24v23C242,87.2,231.2,98,218,98z"/>
        <g className="freckles">
          <circle className="freckle" cx="13.7" cy="41.4" r="1.6"/>
          <circle className="freckle" cx="20.1" cy="44.7" r="1.6"/>
          <circle className="freckle" cx="19.6" cy="37.8" r="1.6"/>
        </g>
        <defs>
          <clipPath id={mouthClip}>
            <path d="M218,98H24C10.8,98,0,87.2,0,74V51c0-13.2,10.8-24,24-24h194c13.2,0,24,10.8,24,24v23C242,87.2,231.2,98,218,98z"/>
          </clipPath>
        </defs>
        <g className="mouth" clipPath={`url(#${mouthClip})`}>
          <g className="mouth-pieces">
            <path className="mouth-back" d="M23.6,168.2l-3-56.1c0-7.8,6.4-14.1,14.1-14.1h172.4c7.8,0,14.1,6.4,14.1,14.1l-3,56.1"/>
            <path className="tongue"     d="M174.9,168.2c-7.3-5-24.5-9.9-54.8-9.9s-48,5.1-54.8,9.9"/>
          </g>
        </g>
        <g className="teeth">
          <path className="tooth-left"  d="M115,97.9v7.5c0,2-1.7,3.6-3.6,3.6H89.7c-2,0-3.6-1.7-3.6-3.6v-7.5H115z"/>
          <path className="tooth-right" d="M154,97.9v7.5c0,2-1.7,3.6-3.6,3.6h-21.7c-2,0-3.6-1.7-3.6-3.6v-7.5H154z"/>
        </g>
        <text className="hippo-label" x="121" y="67" textAnchor="middle" dominantBaseline="middle">{label}</text>
      </svg>
    </button>
  )
}
