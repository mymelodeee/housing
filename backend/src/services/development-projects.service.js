const developmentProjectsRepository = require('../repositories/development-projects.repository');

// pg는 DATE 컬럼을 로컬 자정 기준 Date 객체로 파싱하므로, JSON 직렬화 시 UTC ISO 문자열로
// 변환되어 UTC+9 환경에서 날짜가 하루 밀려 보인다(remodeling.service.js와 동일 이슈).
function formatLocalDate(value) {
  if (value === null || value === undefined) return null;
  if (!(value instanceof Date)) return value;
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function mapSource(row) {
  return {
    name: row.source_name ?? null,
    url: row.source_url ?? null,
    sourceType: row.source_type,
    sourceDate: formatLocalDate(row.source_date),
    checkedAt: formatLocalDate(row.checked_at),
    reliability: row.reliability,
    isAccessible: row.is_accessible
  };
}

function mapProject(row, sources) {
  return {
    id: row.id,
    projectName: row.project_name,
    category: row.category,
    status: row.status,
    effectiveDate: formatLocalDate(row.effective_date),
    checkedAt: formatLocalDate(row.checked_at),
    note: row.note,
    sources: sources.map(mapSource)
  };
}

async function getDevelopmentProjects(complexId) {
  const projectRows = await developmentProjectsRepository.findProjectsByComplexId(complexId);

  const projects = await Promise.all(
    projectRows.map(async (row) => {
      const sources = await developmentProjectsRepository.findSourcesByProjectId(row.id);
      return mapProject(row, sources);
    })
  );

  return { complexId, projects };
}

module.exports = { getDevelopmentProjects, mapProject, mapSource };
