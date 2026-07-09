import { create } from 'zustand'

interface FavoritesSelectionState {
  selectedComplexIds: Set<number>
  selectedListingIds: Set<number>
  toggleComplexSelection: (id: number) => void
  toggleListingSelection: (id: number) => void
  clearComplexSelection: () => void
  clearListingSelection: () => void
}

export const useFavoritesSelectionStore = create<FavoritesSelectionState>((set) => ({
  selectedComplexIds: new Set(),
  selectedListingIds: new Set(),
  toggleComplexSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedComplexIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedComplexIds: next }
    }),
  toggleListingSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedListingIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedListingIds: next }
    }),
  clearComplexSelection: () => set({ selectedComplexIds: new Set() }),
  clearListingSelection: () => set({ selectedListingIds: new Set() }),
}))
