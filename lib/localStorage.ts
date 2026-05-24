import { InspectionData } from '@/types'

const INSPECTIONS_KEY = 'mse_inspections'
const USER_KEY = 'mse_user'

export function saveInspection(inspection: InspectionData): string {
  const inspections = getAllInspections()
  const id = inspection.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const updated = {
    ...inspection,
    id,
    updated_at: new Date().toISOString(),
    created_at: inspection.created_at || new Date().toISOString(),
  }
  const idx = inspections.findIndex(i => i.id === id)
  if (idx >= 0) {
    inspections[idx] = updated
  } else {
    inspections.unshift(updated)
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(inspections))
  }
  return id
}

export function getAllInspections(): InspectionData[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(INSPECTIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getInspectionById(id: string): InspectionData | null {
  const inspections = getAllInspections()
  return inspections.find(i => i.id === id) || null
}

export function deleteInspection(id: string): void {
  const inspections = getAllInspections().filter(i => i.id !== id)
  if (typeof window !== 'undefined') {
    localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(inspections))
  }
}

export function saveUser(user: { nome: string; cargo: string; empresa: string }) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function getUser() {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(USER_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY)
  }
}
