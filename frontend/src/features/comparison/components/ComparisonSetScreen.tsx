import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useComparisonSet } from '../hooks/useComparisonSet'
import { useAddComplexToComparisonSet } from '../hooks/useAddComplexToComparisonSet'
import { useAddListingToComparisonSet } from '../hooks/useAddListingToComparisonSet'
import { useAllComplexes } from '../hooks/useAllComplexes'
import { groupComplexesByLocation } from '../utils/groupComplexesByLocation'
import { ComparisonComplexTable, ComparisonListingTable } from './ComparisonTable'
import { Modal } from '../../../shared/components/Modal'
import { ApiError } from '../../../shared/api/client'
import { useFavoriteListings } from '../../favorites/hooks/useFavoriteListings'
import './ComparisonSetScreen.css'

export function ComparisonSetScreen() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useComparisonSet(id ?? '')
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [selectedCityDistrict, setSelectedCityDistrict] = useState('')
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('')
  const [selectedComplexId, setSelectedComplexId] = useState('')
  const [selectedListingId, setSelectedListingId] = useState('')
  const addComplex = useAddComplexToComparisonSet(id ?? '')
  const addListing = useAddListingToComparisonSet(id ?? '')
  const allComplexes = useAllComplexes()
  const favoriteListings = useFavoriteListings()

  if (!id) return <p role="alert">잘못된 접근입니다.</p>
  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">비교셋을 불러오지 못했습니다.</p>

  function handleAddError(err: unknown) {
    if (err instanceof ApiError) {
      setErrorModal(err.message)
    }
  }

  function handleCityDistrictChange(value: string) {
    setSelectedCityDistrict(value)
    setSelectedNeighborhood('')
    setSelectedComplexId('')
  }

  function handleNeighborhoodChange(value: string) {
    setSelectedNeighborhood(value)
    setSelectedComplexId('')
  }

  function handleAddComplex() {
    if (!selectedComplexId) return
    addComplex.mutate(Number(selectedComplexId), {
      onSuccess: () => {
        setSelectedCityDistrict('')
        setSelectedNeighborhood('')
        setSelectedComplexId('')
      },
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
  const addableListings = (favoriteListings.data ?? []).filter(
    (favorite) => !existingListingIds.has(favorite.listingId),
  )

  const addableComplexes = (allComplexes.data ?? []).filter((complex) => !existingComplexIds.has(complex.id))
  const complexLocationTree = groupComplexesByLocation(addableComplexes)
  const cityDistrictOptions = [...complexLocationTree.keys()]
  const neighborhoodOptions = selectedCityDistrict
    ? [...(complexLocationTree.get(selectedCityDistrict)?.keys() ?? [])]
    : []
  const complexOptions =
    selectedCityDistrict && selectedNeighborhood
      ? (complexLocationTree.get(selectedCityDistrict)?.get(selectedNeighborhood) ?? [])
      : []

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
                value={selectedCityDistrict}
                onChange={(e) => handleCityDistrictChange(e.target.value)}
                aria-label="시/군/구 선택"
              >
                <option value="">시/군/구 선택</option>
                {cityDistrictOptions.map((cityDistrict) => (
                  <option key={cityDistrict} value={cityDistrict}>
                    {cityDistrict}
                  </option>
                ))}
              </select>
              <select
                value={selectedNeighborhood}
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                aria-label="동 선택"
                disabled={!selectedCityDistrict}
              >
                <option value="">동 선택</option>
                {neighborhoodOptions.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
              <select
                value={selectedComplexId}
                onChange={(e) => setSelectedComplexId(e.target.value)}
                aria-label="단지 선택"
                disabled={!selectedNeighborhood}
              >
                <option value="">단지 선택</option>
                {complexOptions.map((complex) => (
                  <option key={complex.id} value={complex.id}>
                    {complex.complexName}
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
