import { createContext, useContext, useState } from 'react'

const OnboardingContext = createContext()

export function OnboardingProvider({ children }) {
  const [data, setData] = useState({
    emoji:      '',
    categories: [],  // [{ name, color }]
    priority:   [],  // ordered category names
    friends:    [],  // friend usernames/emails
    privacy: {
      share_goals:   false,
      share_results: false,
      share_other:   false,
      share_all:     false
    }
  })

  const update = (key, value) => setData(prev => ({ ...prev, [key]: value }))

  return (
    <OnboardingContext.Provider value={{ data, update }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => useContext(OnboardingContext)
