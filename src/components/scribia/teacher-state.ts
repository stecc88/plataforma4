/**
 * Simple shared state for teacher views.
 * Used to pass the selected student between teacher-dashboard and student-detail.
 */

let _selectedStudentId: string | null = null
let _selectedStudentName: string | null = null
let _selectedStudentEmail: string | null = null
let _selectedStudentEnrolledAt: string | null = null

const listeners: Set<() => void> = new Set()

function notify() {
  listeners.forEach((l) => l())
}

export function setSelectedStudent(
  id: string | null,
  name: string | null = null,
  email: string | null = null,
  enrolledAt: string | null = null
) {
  _selectedStudentId = id
  _selectedStudentName = name
  _selectedStudentEmail = email
  _selectedStudentEnrolledAt = enrolledAt
  notify()
}

export function getSelectedStudent() {
  return {
    id: _selectedStudentId,
    name: _selectedStudentName,
    email: _selectedStudentEmail,
    enrolledAt: _selectedStudentEnrolledAt,
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * React hook-like helper: returns the selected student and re-renders on change.
 * Uses useSyncExternalStore for React 18+.
 */
export { subscribe as teacherStateSubscribe, getSelectedStudent as getTeacherStateSnapshot }
