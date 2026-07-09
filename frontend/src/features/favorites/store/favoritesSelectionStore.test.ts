import { describe, it, expect, beforeEach } from 'vitest'
import { useFavoritesSelectionStore } from './favoritesSelectionStore'

describe('favoritesSelectionStore', () => {
  beforeEach(() => {
    useFavoritesSelectionStore.getState().clearComplexSelection()
    useFavoritesSelectionStore.getState().clearListingSelection()
  })

  it('초기 상태는 두 선택 집합 모두 비어있다', () => {
    const state = useFavoritesSelectionStore.getState()
    expect(state.selectedComplexIds.size).toBe(0)
    expect(state.selectedListingIds.size).toBe(0)
  })

  it('toggleComplexSelection은 선택되지 않은 id를 추가한다', () => {
    useFavoritesSelectionStore.getState().toggleComplexSelection(1)
    expect(useFavoritesSelectionStore.getState().selectedComplexIds.has(1)).toBe(true)
  })

  it('toggleComplexSelection을 두 번 호출하면 다시 선택 해제된다', () => {
    useFavoritesSelectionStore.getState().toggleComplexSelection(1)
    useFavoritesSelectionStore.getState().toggleComplexSelection(1)
    expect(useFavoritesSelectionStore.getState().selectedComplexIds.has(1)).toBe(false)
  })

  it('toggleListingSelection은 선택되지 않은 id를 추가한다', () => {
    useFavoritesSelectionStore.getState().toggleListingSelection(2)
    expect(useFavoritesSelectionStore.getState().selectedListingIds.has(2)).toBe(true)
  })

  it('toggleListingSelection을 두 번 호출하면 다시 선택 해제된다', () => {
    useFavoritesSelectionStore.getState().toggleListingSelection(2)
    useFavoritesSelectionStore.getState().toggleListingSelection(2)
    expect(useFavoritesSelectionStore.getState().selectedListingIds.has(2)).toBe(false)
  })

  it('단지 선택과 매물 선택은 서로 독립적이다', () => {
    useFavoritesSelectionStore.getState().toggleComplexSelection(1)
    useFavoritesSelectionStore.getState().toggleListingSelection(1)

    expect(useFavoritesSelectionStore.getState().selectedComplexIds.has(1)).toBe(true)
    expect(useFavoritesSelectionStore.getState().selectedListingIds.has(1)).toBe(true)

    useFavoritesSelectionStore.getState().clearComplexSelection()

    expect(useFavoritesSelectionStore.getState().selectedComplexIds.has(1)).toBe(false)
    expect(useFavoritesSelectionStore.getState().selectedListingIds.has(1)).toBe(true)
  })

  it('clearComplexSelection은 단지 선택만 비운다', () => {
    useFavoritesSelectionStore.getState().toggleComplexSelection(1)
    useFavoritesSelectionStore.getState().toggleComplexSelection(2)
    useFavoritesSelectionStore.getState().clearComplexSelection()
    expect(useFavoritesSelectionStore.getState().selectedComplexIds.size).toBe(0)
  })

  it('clearListingSelection은 매물 선택만 비운다', () => {
    useFavoritesSelectionStore.getState().toggleListingSelection(1)
    useFavoritesSelectionStore.getState().toggleListingSelection(2)
    useFavoritesSelectionStore.getState().clearListingSelection()
    expect(useFavoritesSelectionStore.getState().selectedListingIds.size).toBe(0)
  })
})
