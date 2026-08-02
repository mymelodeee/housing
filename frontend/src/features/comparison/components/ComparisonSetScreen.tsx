import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useComparisonSet } from '../hooks/useComparisonSet'
import { useAddComplexToComparisonSet } from '../hooks/useAddComplexToComparisonSet'
import { useAddListingToComparisonSet } from '../hooks/useAddListingToComparisonSet'
import { ComparisonComplexTable, ComparisonListingTable } from './ComparisonTable'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/api/client'
import { useFavoriteComplexes } from '../../favorites/hooks/useFavoriteComplexes'
import { useFavoriteListings } from '../../favorites/hooks/useFavoriteListings'
import './ComparisonSetScreen.css'

export function ComparisonSetScreen() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useComparisonSet(id ?? '')
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [selectedComplexId, setSelectedComplexId] = useState('')
  const [selectedListingId, setSelectedListingId] = useState('')
  const addComplex = useAddComplexToComparisonSet(id ?? '')
  const addListing = useAddListingToComparisonSet(id ?? '')
  const favoriteComplexes = useFavoriteComplexes()
  const favoriteListings = useFavoriteListings()

  if (!id) return <p role="alert">잘못된 접근입니다.</p>
  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">비교셋을 불러오지 못했습니다.</p>

  function handleAddError(err: unknown) {
    if (err instanceof ApiError) {
      setErrorModal(err.message)
    }
  }

  function handleAddComplex() {
    if (!selectedComplexId) return
    addComplex.mutate(Number(selectedComplexId), {
      onSuccess: () => setSelectedComplexId(''),
      onError: handleAddError,
    })
  }

  function handleAddListing() {
    if (!selectedListingId) return
    addListing.mutate(Number(selectedListingId), {
      onSuccess: () => setSelectedListingId(''),
      onError: handleAddError,
    })
  }

  const existingComplexIds = new Set((data.complexes ?? []).map((c) => c.complexId))
  const existingListingIds = new Set((data.listings ?? []).map((l) => l.listingId))
  const addableComplexes = (favoriteComplexes.data ?? []).filter(
    (favorite) => !existingComplexIds.has(favorite.complexId),
  )
  const addableListings = (favoriteListings.data ?? []).filter(
    (favorite) => !existingListingIds.has(favorite.listingId),
  )

  return (
    <div className="comparison-set-screen">
      <Link to="/comparison-sets" className="comparison-set-screen__back-link">
        ← 비교셋 목록으로
      </Link>
      {data.targetType === 'complex' && data.complexes && (
        <>
          <ComparisonComplexTable items={data.complexes} />
          {addableComplexes.length > 0 && (
            <div className="comparison-set-screen__add-row">
              <select
                value={selectedComplexId}
                onChange={(e) => setSelectedComplexId(e.target.value)}
                aria-label="추가할 단지 선택"
              >
                <option value="">단지 선택</option>
                {addableComplexes.map((favorite) => (
                  <option key={favorite.complexId} value={favorite.complexId}>
                    {favorite.complex.complexName}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddComplex} disabled={!selectedComplexId}>
                추가
              </button>
            </div>
          )}
        </>
      )}
      {data.targetType === 'listing' && data.listings && (
        <>
          <ComparisonListingTable items={data.listings} />
          {addableListings.length > 0 && (
            <div className="comparison-set-screen__add-row">
              <select
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                aria-label="추가할 매물 선택"
              >
                <option value="">매물 선택</option>
                {addableListings.map((favorite) => (
                  <option key={favorite.listingId} value={favorite.listingId}>
                    {favorite.listing.complex.complexName}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddListing} disabled={!selectedListingId}>
                추가
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        open={errorModal !== null}
        title={errorModal ?? ''}
        onClose={() => setErrorModal(null)}
      >
        {errorModal}
      </Modal>
    </div>
  )
}
