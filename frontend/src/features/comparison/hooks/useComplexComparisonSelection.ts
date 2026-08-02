import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFavoritesSelectionStore } from '../../favorites/store/favoritesSelectionStore'
import { useCreateComparisonSet } from './useCreateComparisonSet'

const MAX_SELECTION = 5
const MIN_COMPARE_COUNT = 2

interface WarningModalState {
  title: string
  body: string
}

export function useComplexComparisonSelection() {
  const { selectedComplexIds, toggleComplexSelection, clearComplexSelection } = useFavoritesSelectionStore()
  const createComparisonSet = useCreateComparisonSet()
  const navigate = useNavigate()
  const [warningModal, setWarningModal] = useState<WarningModalState | null>(null)

  function handleToggle(complexId: number) {
    if (!selectedComplexIds.has(complexId) && selectedComplexIds.size >= MAX_SELECTION) {
      setWarningModal({ title: '선택 제한', body: '비교셋은 최대 5개까지 선택할 수 있습니다' })
      return
    }
    toggleComplexSelection(complexId)
  }

  function handleCompare() {
    if (selectedComplexIds.size < MIN_COMPARE_COUNT) {
      setWarningModal({ title: '선택 부족', body: '비교하려면 2개 이상 선택해야 합니다' })
      return
    }
    createComparisonSet.mutate(
      { targetType: 'complex', complexIds: [...selectedComplexIds] },
      {
        onSuccess: (result) => {
          navigate(`/comparison-sets/${result.id}`)
          clearComplexSelection()
        },
      },
    )
  }

  return {
    selectedComplexIds,
    handleToggle,
    handleCompare,
    warningModal,
    closeWarningModal: () => setWarningModal(null),
  }
}
