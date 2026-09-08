import type { PriceHistoryEntry } from '../types'
import { formatAreaWithPyeong } from '../../../../shared/utils/formatArea'
import './PriceHistoryTable.css'

interface PriceHistoryTableProps {
  entries: PriceHistoryEntry[]
  showExclusiveArea?: boolean
}

export function PriceHistoryTable({ entries, showExclusiveArea = false }: PriceHistoryTableProps) {
  const sorted = [...entries].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))

  return (
    <table className="price-history-table">
      <thead>
        <tr>
          <th>거래일자</th>
          <th>거래가</th>
          {showExclusiveArea && <th>평형</th>}
          <th>데이터 출처</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((entry, i) => (
          <tr key={`${entry.transactionDate}-${i}`}>
            <td>{entry.transactionDate}</td>
            <td>{entry.transactionPrice.toLocaleString()}만원</td>
            {showExclusiveArea && (
              <td>{typeof entry.exclusiveArea === 'number' ? formatAreaWithPyeong(entry.exclusiveArea) : '확인필요'}</td>
            )}
            <td>{entry.dataSource}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
