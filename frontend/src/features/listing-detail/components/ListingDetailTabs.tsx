import { useState } from 'react'
import type { ReactElement } from 'react'
import { TabErrorBoundary } from '../../../shared/components/TabErrorBoundary'
import { RegulationTab } from '../regulation/components/RegulationTab'
import { LocalityTab } from '../locality/components/LocalityTab'
import { PriceHistoryTab } from '../price-history/components/PriceHistoryTab'
import { LoanSimulationTab } from '../../loan-simulation/components/LoanSimulationTab'
import './ListingDetailTabs.css'

type TabKey = 'regulation' | 'locality' | 'loan-simulation' | 'price-history'

interface ListingDetailTabsProps {
  listingId: string
}

interface TabDefinition {
  key: TabKey
  label: string
  Component: (props: { listingId: string }) => ReactElement
}

const TABS: TabDefinition[] = [
  { key: 'regulation', label: '규제/대출', Component: RegulationTab },
  { key: 'locality', label: '입지 정보', Component: LocalityTab },
  { key: 'loan-simulation', label: '대출 시뮬레이션', Component: LoanSimulationTab },
  { key: 'price-history', label: '매매가 변동 이력', Component: PriceHistoryTab },
]

export function ListingDetailTabs({ listingId }: ListingDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('regulation')

  return (
    <div>
      <div role="tablist" className="listing-detail-tabs__list">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            data-active={activeTab === tab.key}
            className="listing-detail-tabs__tab"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {TABS.map((tab) => (
        <div
          key={tab.key}
          role="tabpanel"
          id={`tabpanel-${tab.key}`}
          aria-labelledby={`tab-${tab.key}`}
          hidden={activeTab !== tab.key}
        >
          <TabErrorBoundary>
            <tab.Component listingId={listingId} />
          </TabErrorBoundary>
        </div>
      ))}
    </div>
  )
}
