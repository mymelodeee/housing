import { useComplexRemodeling } from '../hooks/useComplexRemodeling'
import { Badge } from '../../../shared/components/Badge'
import { formatPriceKorean } from '../../../shared/utils/formatPrice'
import type { RemodelingSource, RemodelingStatus } from '../../listing-detail/remodeling/types'
import '../../listing-detail/remodeling/components/RemodelingTab.css'

interface ComplexRemodelingTabProps {
  complexId: string
}

const STATUS_LABEL: Record<RemodelingStatus, string> = {
  confirmed: '확정',
  estimated: '추정',
  proposal: '계획(안)',
  unknown: '미확인',
}

function StatusBadge({ status }: { status: RemodelingStatus }) {
  return <Badge variant={status === 'confirmed' ? 'default' : 'needs-confirmation'}>{STATUS_LABEL[status]}</Badge>
}

function FlagBadges({ isStale, isConflicted }: { isStale?: boolean; isConflicted?: boolean }) {
  return (
    <>
      {isStale && <Badge variant="needs-confirmation">확인 필요</Badge>}
      {isConflicted && <Badge variant="needs-confirmation">출처 충돌</Badge>}
    </>
  )
}

function SourceText({ source }: { source: RemodelingSource | null }) {
  if (!source) return <>정보 없음</>
  if (source.url) {
    return (
      <a href={source.url} target="_blank" rel="noreferrer">
        {source.name}
      </a>
    )
  }
  return <>{source.name}</>
}

interface MetaLineProps {
  effectiveDate: string | null
  checkedAt: string | null
  source: RemodelingSource | null
}

function MetaLine({ effectiveDate, checkedAt, source }: MetaLineProps) {
  return (
    <p className="remodeling-tab__meta">
      <span>정보 기준일 {effectiveDate ?? '정보 없음'}</span>
      <span>마지막 확인일 {checkedAt ?? '정보 없음'}</span>
      <span>
        출처 <SourceText source={source} />
      </span>
    </p>
  )
}

function formatAmount(amount: number | null, unit: string): string {
  if (amount === null) return '정보 없음'
  if (unit === '만원') return formatPriceKorean(amount)
  return `${amount.toLocaleString()}${unit}`
}

function formatHouseholdCount(value: number | null): string {
  return value === null ? '정보 없음' : `${value.toLocaleString()}세대`
}

export function ComplexRemodelingTab({ complexId }: ComplexRemodelingTabProps) {
  const { data, isLoading, isError } = useComplexRemodeling(complexId)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">리모델링 정보를 불러오지 못했습니다.</p>
  if (!data.hasProject) return <p>{data.message}</p>

  const { currentStage, households, contributions, loanStatus, stageHistory, priceLink } = data
  const sortedHistory = [...stageHistory].sort((a, b) => (a.effectiveDate ?? '').localeCompare(b.effectiveDate ?? ''))
  const firstContribution = contributions.length > 0 ? contributions[0] : null

  return (
    <div className="remodeling-tab">
      <p className="remodeling-tab__project">{data.projectName ?? data.complexName ?? '리모델링 사업'}</p>

      <section className="remodeling-tab__section">
        <h3 className="remodeling-tab__heading">사업 단계</h3>
        {currentStage ? (
          <>
            <div className="remodeling-tab__stage">
              <span className="remodeling-tab__stage-value">{currentStage.value}</span>
              <StatusBadge status={currentStage.status} />
              <FlagBadges isStale={currentStage.isStale} isConflicted={currentStage.isConflicted} />
            </div>
            <MetaLine effectiveDate={currentStage.effectiveDate} checkedAt={currentStage.checkedAt} source={currentStage.source} />
          </>
        ) : (
          <p>정보 없음</p>
        )}
      </section>

      <section className="remodeling-tab__section">
        <h3 className="remodeling-tab__heading">단계 이력</h3>
        {sortedHistory.length > 0 ? (
          <ol className="remodeling-tab__timeline">
            {sortedHistory.map((item, i) => (
              <li key={`${item.stage}-${i}`} className="remodeling-tab__timeline-item">
                <div className="remodeling-tab__timeline-head">
                  <span className="remodeling-tab__timeline-stage">{item.stage}</span>
                  <span className="remodeling-tab__timeline-date">{item.effectiveDate ?? '정보 없음'}</span>
                  <StatusBadge status={item.status} />
                </div>
                <MetaLine effectiveDate={item.effectiveDate} checkedAt={item.checkedAt} source={item.source} />
              </li>
            ))}
          </ol>
        ) : (
          <p>단계 이력 없음</p>
        )}
      </section>

      <section className="remodeling-tab__section">
        <h3 className="remodeling-tab__heading">세대수</h3>
        {households ? (
          <>
            <div className="remodeling-tab__row">
              <span className="remodeling-tab__value">기존 {formatHouseholdCount(households.before)}</span>
              <span className="remodeling-tab__value">리모델링 후 {formatHouseholdCount(households.after)}</span>
              <span className="remodeling-tab__value">증가 {formatHouseholdCount(households.increase)}</span>
              <StatusBadge status={households.status} />
              <FlagBadges isStale={households.isStale} isConflicted={households.isConflicted} />
            </div>
            <MetaLine effectiveDate={households.effectiveDate} checkedAt={households.checkedAt} source={households.source} />
          </>
        ) : (
          <p>정보 없음</p>
        )}
      </section>

      <section className="remodeling-tab__section">
        <h3 className="remodeling-tab__heading">분담금</h3>
        {contributions.length > 0 ? (
          <table className="remodeling-tab__table">
            <thead>
              <tr>
                <th>평형</th>
                <th>금액</th>
                <th>상태</th>
                <th>정보 기준일 / 마지막 확인일 / 출처</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((item, i) => (
                <tr key={`${item.unitType ?? 'all'}-${i}`}>
                  <td>{item.unitType ?? '전체'}</td>
                  <td>{formatAmount(item.amount, item.unit)}</td>
                  <td>
                    <StatusBadge status={item.status} />
                    <FlagBadges isStale={item.isStale} isConflicted={item.isConflicted} />
                  </td>
                  <td>
                    <MetaLine effectiveDate={item.effectiveDate} checkedAt={item.checkedAt} source={item.source} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>분담금 정보 없음</p>
        )}
      </section>

      <section className="remodeling-tab__section">
        <h3 className="remodeling-tab__heading">대출 관련</h3>
        {loanStatus ? (
          <>
            <div className="remodeling-tab__row">
              <span className="remodeling-tab__value">{loanStatus.value}</span>
              <StatusBadge status={loanStatus.status} />
              <FlagBadges isStale={loanStatus.isStale} isConflicted={loanStatus.isConflicted} />
            </div>
            <MetaLine effectiveDate={loanStatus.effectiveDate} checkedAt={loanStatus.checkedAt} source={loanStatus.source} />
          </>
        ) : (
          <p>정보 없음</p>
        )}
      </section>

      {priceLink && (
        <section className="remodeling-tab__section">
          <h3 className="remodeling-tab__heading">실거래가 연결</h3>
          {firstContribution && (
            <p className="remodeling-tab__value">
              최근 실거래가{' '}
              {priceLink.recentTransactionPrice === null ? '정보 없음' : formatPriceKorean(priceLink.recentTransactionPrice)}{' '}
              + 분담금 {formatAmount(firstContribution.amount, firstContribution.unit)} = 총 부담 추정{' '}
              {priceLink.estimatedTotalCost === null ? '정보 없음' : formatPriceKorean(priceLink.estimatedTotalCost)}
            </p>
          )}
          <p className="remodeling-tab__note">{priceLink.note}</p>
        </section>
      )}
    </div>
  )
}
