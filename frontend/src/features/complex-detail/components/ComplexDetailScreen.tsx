import { useNavigate, useParams } from 'react-router-dom'
import { useComplex } from '../hooks/useComplex'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import { ComplexDetailTabs } from './ComplexDetailTabs'
import '../../listing-detail/components/ListingDetailScreen.css'

export function ComplexDetailScreen() {
  const { complexId } = useParams<{ complexId: string }>()
  const { data: complex } = useComplex(complexId ?? '')
  const navigate = useNavigate()

  if (!complexId) {
    return <p role="alert">잘못된 접근입니다.</p>
  }

  return (
    <div className="listing-detail-screen">
      <button
        type="button"
        className="listing-detail-screen__back-link"
        onClick={() => navigate(-1)}
      >
        ← 목록으로
      </button>
      {complex && (
        <h1 className="listing-detail-screen__header">
          <span className="listing-detail-screen__complex-name">{complex.complexName}</span>
          <span className="listing-detail-screen__meta">
            {complex.priceRange === '매물 없음'
              ? '실거래 기반 시세 확인 불가'
              : `실거래 기반 시세 ${formatPriceKorean(complex.priceRange.avgPrice)}`}
          </span>
        </h1>
      )}
      <ComplexDetailTabs complexId={complexId} />
    </div>
  )
}
