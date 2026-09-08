import { useState } from 'react'
import type { ReactElement } from 'react'
import { TabErrorBoundary } from '../../../shared/components/TabErrorBoundary'
import { ComplexOverviewTab } from './ComplexOverviewTab'
import { ComplexPriceHistoryTab } from './ComplexPriceHistoryTab'
import { ComplexJeonseHistoryTab } from './ComplexJeonseHistoryTab'
import { ComplexSchoolsTab } from './ComplexSchoolsTab'
import { ComplexRemodelingTab } from './ComplexRemodelingTab'
import { ComplexDevelopmentProjectsTab } from './ComplexDevelopmentProjectsTab'
import { ComplexLoanTab } from './ComplexLoanTab'
import '../../listing-detail/components/ListingDetailTabs.css'

type TabKey =
  | 'overview'
  | 'price-history'
  | 'jeonse-history'
  | 'schools'
  | 'remodeling'
  | 'development-projects'
  | 'loan'

interface ComplexDetailTabsProps {
  complexId: string
}

interface TabDefinition {
  key: TabKey
  label: string
  Component: (props: { complexId: string }) => ReactElement
}

const TABS: TabDefinition[] = [
  { key: 'overview', label: '개요', Component: ComplexOverviewTab },
  { key: 'price-history', label: '매매가', Component: ComplexPriceHistoryTab },
  { key: 'jeonse-history', label: '전세가·전세가율', Component: ComplexJeonseHistoryTab },
  { key: 'schools', label: '학군', Component: ComplexSchoolsTab },
  { key: 'remodeling', label: '리모델링', Component: ComplexRemodelingTab },
  { key: 'development-projects', label: '개발호재', Component: ComplexDevelopmentProjectsTab },
  { key: 'loan', label: '대출/자금', Component: ComplexLoanTab },
]

export function ComplexDetailTabs({ complexId }: ComplexDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  return (
    <div>
      <div role="tablist" className="listing-detail-tabs__list">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`complex-tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`complex-tabpanel-${tab.key}`}
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
          id={`complex-tabpanel-${tab.key}`}
          aria-labelledby={`complex-tab-${tab.key}`}
          hidden={activeTab !== tab.key}
        >
          <TabErrorBoundary>
            <tab.Component complexId={complexId} />
          </TabErrorBoundary>
        </div>
      ))}
    </div>
  )
}
