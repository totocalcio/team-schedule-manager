// Calendar access management using localStorage
export interface CalendarAccess {
  id: string
  name: string
  lastAccessed: string
}

const STORAGE_KEY = 'team-schedule-manager-accessed-calendars'

export const getAccessedCalendars = (): CalendarAccess[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const calendars = JSON.parse(stored) as CalendarAccess[]
    
    // Sort by last accessed (most recent first)
    return calendars.sort((a, b) => 
      new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
    )
  } catch (error) {
    console.error('Error reading accessed calendars from localStorage:', error)
    return []
  }
}

export const addAccessedCalendar = (calendar: { id: string; name: string }) => {
  if (typeof window === 'undefined') return
  
  try {
    const existing = getAccessedCalendars()
    const now = new Date().toISOString()
    
    // Remove existing entry if it exists
    const filtered = existing.filter(c => c.id !== calendar.id)
    
    // Add new entry at the beginning
    const updated = [
      { id: calendar.id, name: calendar.name, lastAccessed: now },
      ...filtered
    ]
    
    // Keep only the most recent 20 calendars
    const limited = updated.slice(0, 20)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
  } catch (error) {
    console.error('Error saving accessed calendar to localStorage:', error)
  }
}

export const removeAccessedCalendar = (calendarId: string) => {
  if (typeof window === 'undefined') return
  
  try {
    const existing = getAccessedCalendars()
    const filtered = existing.filter(c => c.id !== calendarId)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error removing accessed calendar from localStorage:', error)
  }
}

export const clearAccessedCalendars = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing accessed calendars from localStorage:', error)
  }
}

export const hasAccessToCalendar = (calendarId: string): boolean => {
  const accessed = getAccessedCalendars()
  return accessed.some(c => c.id === calendarId)
}