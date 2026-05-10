import { create } from 'zustand'

interface WritingProject {
  id: string
  title: string
  content: string
  language: string
  createdAt: string
  updatedAt: string
}

interface WritingState {
  projects: WritingProject[]
  activeProject: WritingProject | null
  isGenerating: boolean
  setProjects: (projects: WritingProject[]) => void
  setActiveProject: (project: WritingProject | null) => void
  addProject: (project: WritingProject) => void
  updateProject: (id: string, updates: Partial<WritingProject>) => void
  setGenerating: (generating: boolean) => void
}

export const useWritingStore = create<WritingState>((set) => ({
  projects: [],
  activeProject: null,
  isGenerating: false,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (activeProject) => set({ activeProject }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      activeProject:
        state.activeProject?.id === id
          ? { ...state.activeProject, ...updates }
          : state.activeProject,
    })),
  setGenerating: (isGenerating) => set({ isGenerating }),
}))
