import { useEffect, useState } from 'react'
import HippoButton from './HippoButton'

const WRAPPED_LINES = [
  '. . .',
  'Oh good. You found your way back.',
  'I have been beneath the page, listening to the calendar breathe.',
  'Every checkmark leaves a tiny echo.',
  'I collected them. Organized them. Judged them only a little.',
  'Your Habitask Wrapped is ready.'
]

export default function WrappedIntroCutscene({ open = false, onComplete }) {
  const [lineIndex, setLineIndex] = useState(0)
  const [visibleCharacterCount, setVisibleCharacterCount] = useState(0)

  useEffect(() => {
    if (!open) return undefined

    setLineIndex(0)
    setVisibleCharacterCount(0)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    setVisibleCharacterCount(0)
  }, [lineIndex, open])

  useEffect(() => {
    if (!open) return undefined

    const currentLine = WRAPPED_LINES[lineIndex]
    if (visibleCharacterCount >= currentLine.length) return undefined

    const timeout = window.setTimeout(() => {
      setVisibleCharacterCount((currentCount) => currentCount + 1)
    }, 28)

    return () => window.clearTimeout(timeout)
  }, [lineIndex, open, visibleCharacterCount])

  if (!open) return null

  const isFinalLine = lineIndex === WRAPPED_LINES.length - 1
  const currentLine = WRAPPED_LINES[lineIndex]
  const isTyping = visibleCharacterCount < currentLine.length
  const visibleLine = currentLine.slice(0, visibleCharacterCount)

  function handleNext() {
    if (isTyping) {
      setVisibleCharacterCount(currentLine.length)
      return
    }

    if (!isFinalLine) {
      setLineIndex((currentIndex) => currentIndex + 1)
      return
    }

    onComplete?.()
  }

  function handleDialogueKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    handleNext()
  }

  return (
    <div className="wrapped-cutscene" role="dialog" aria-modal="true" aria-labelledby="wrapped-cutscene-title">
      <div className="wrapped-cutscene-scrim" />
      <div className="wrapped-cutscene-stage">
        <div
          className="wrapped-cutscene-dialogue"
          role="button"
          tabIndex={0}
          onClick={handleNext}
          onKeyDown={handleDialogueKeyDown}
        >
          <p id="wrapped-cutscene-title" className="wrapped-cutscene-kicker">Habitask Hippo</p>
          <p className="wrapped-cutscene-line">
            {visibleLine}
            <span className="wrapped-cutscene-cursor" aria-hidden="true" />
          </p>
          <div className="wrapped-cutscene-actions">
            <span className="wrapped-cutscene-hint">{isTyping ? 'Click to finish line' : 'Click to continue'}</span>
            <button
              type="button"
              className="wrapped-cutscene-text-button"
              onClick={(event) => {
                event.stopPropagation()
                onComplete?.()
              }}
            >
              Skip
            </button>
          </div>
        </div>

        <div className="wrapped-cutscene-hippo">
          <HippoButton label="WRAPPED" id="wrapped-cutscene-hippo" type="button" onClick={handleNext} />
        </div>
      </div>
    </div>
  )
}
