import { useComplexDevelopmentProjects } from '../hooks/useComplexDevelopmentProjects'
import { Badge } from '../../../shared/components/Badge'
import type { DevelopmentProjectStatus } from '../types'
import './ComplexDevelopmentProjectsTab.css'

interface ComplexDevelopmentProjectsTabProps {
  complexId: string
}

const ACTIVE_STATUSES: DevelopmentProjectStatus[] = ['계획', '확정', '착공', '공사중']

function StatusBadge({ status }: { status: DevelopmentProjectStatus }) {
  return <Badge variant={ACTIVE_STATUSES.includes(status) ? 'default' : 'needs-confirmation'}>{status}</Badge>
}

export function ComplexDevelopmentProjectsTab({ complexId }: ComplexDevelopmentProjectsTabProps) {
  const { data, isLoading, isError } = useComplexDevelopmentProjects(complexId)

  if (isLoading) return <p>불러오는 중...</p>
  if (isError || !data) return <p role="alert">개발호재 정보를 불러오지 못했습니다.</p>
  if (data.projects.length === 0) return <p>등록된 개발호재 없음</p>

  return (
    <div className="development-projects-tab">
      {data.projects.map((project) => (
        <div key={project.id} className="development-projects-tab__card">
          <div className="development-projects-tab__head">
            <span className="development-projects-tab__category">{project.category}</span>
            <span className="development-projects-tab__name">{project.projectName}</span>
            <StatusBadge status={project.status} />
          </div>
          <p className="development-projects-tab__meta">
            {project.effectiveDate && <span>기준일 {project.effectiveDate}</span>}
            <span>마지막 확인일 {project.checkedAt}</span>
          </p>
          {project.note && <p className="development-projects-tab__note">{project.note}</p>}
          {project.sources.length > 0 && (
            <ul className="development-projects-tab__sources">
              {project.sources.map((source, i) => (
                <li key={i}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.name ?? source.sourceType}
                    </a>
                  ) : (
                    (source.name ?? source.sourceType)
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
