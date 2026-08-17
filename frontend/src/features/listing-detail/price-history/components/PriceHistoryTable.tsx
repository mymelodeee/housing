import type { PriceHistoryEntry } from '../types'
import './PriceHistoryTable.css'

interface PriceHistoryTableProps {
  entries: PriceHistoryEntry[]
}

export function PriceHistoryTable({ entries }: PriceHistoryTableProps) {
  const sorted = [...entries].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))

  return (
    <table className="price-history-table">
      <thead>
        <tr>
          <th>거래일자</th>
          <th>거래가</th>
          <th>데이터 출처</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((entry, i) => (
          <tr key={`${entry.transactionDate}-${i}`}>
            <td>{entry.transactionDate}</td>
            <td>{entry.transactionPrice.toLocaleString()}만원</td>
            <td>{entry.dataSource}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
