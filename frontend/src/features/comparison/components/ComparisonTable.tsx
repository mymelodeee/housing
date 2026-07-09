import { buildComplexComparisonRows, buildListingComparisonRows } from '../utils/buildComparisonRows'
import type { ComparisonComplexItem, ComparisonListingItem } from '../types'
import './ComparisonTable.css'

interface ComparisonComplexTableProps {
  items: ComparisonComplexItem[]
}

export function ComparisonComplexTable({ items }: ComparisonComplexTableProps) {
  const rows = buildComplexComparisonRows(items)
  return (
    <div className="comparison-table-wrapper">
      <table className="comparison-table">
        <thead>
          <tr>
            <th />
            {items.map((item) => (
              <th key={item.complexId}>{item.complexName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              {row.values.map((value, i) => (
                <td key={i}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ComparisonListingTableProps {
  items: ComparisonListingItem[]
}

export function ComparisonListingTable({ items }: ComparisonListingTableProps) {
  const rows = buildListingComparisonRows(items)
  return (
    <div className="comparison-table-wrapper">
      <table className="comparison-table">
        <thead>
          <tr>
            <th />
            {items.map((item) => (
              <th key={item.listingId}>{item.complexName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              {row.values.map((value, i) => (
                <td key={i}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
