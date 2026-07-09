import { Link } from 'react-router-dom'
import { useListingLoanSimulation } from '../hooks/useListingLoanSimulation'
import { ScenarioCard } from './ScenarioCard'
import './LoanSimulationTab.css'

interface LoanSimulationTabProps {
  listingId: string
}

export function LoanSimulationTab({ listingId }: LoanSimulationTabProps) {
  const { data, isLoading, isError } = useListingLoanSimulation(listingId)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">대출 시뮬레이션 정보를 불러오지 못했습니다.</p>

  if (data.profileIncomplete) {
    return (
      <div className="loan-simulation-tab__incomplete">
        <p>내 정보를 입력해주세요</p>
        <Link to="/profile">내 정보 입력하기</Link>
      </div>
    )
  }

  return (
    <div className="loan-simulation-tab">
      <div className="loan-simulation-tab__scenarios">
        {data.scenarios?.map((scenario) => (
          <ScenarioCard
            key={scenario.ownershipStructure}
            scenario={scenario}
            recommended={scenario.ownershipStructure === data.recommendedScenario}
          />
        ))}
      </div>
      <p className="loan-simulation-tab__notice">{data.policyMortgageNotice}</p>
    </div>
  )
}
