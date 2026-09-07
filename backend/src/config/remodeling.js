// 리모델링 추진 정보 재조사 정책 설정.
// 단일 공식 API가 없어 수동 리서치에 의존하므로, checked_at이 오래된 항목만 골라
// 재조사할 수 있도록 "오래됨" 기준일을 설정값으로 둔다.
// env.js의 required 목록에는 넣지 않는다(미설정 시 기본값 30일로 동작).
const STALE_AFTER_DAYS = Number(process.env.REMODELING_STALE_AFTER_DAYS) || 30;

const STAGE_ORDER = [
  '추진위원회',
  '조합설립인가',
  '안전진단',
  '건축심의',
  '사업계획승인',
  '이주',
  '착공',
  '준공',
  '중단'
];

// 값 상태의 우선순위. 확정값(confirmed)을 낮은 상태의 값으로 덮어쓰지 않기 위한 기준.
const VALUE_STATUS_PRIORITY = { confirmed: 3, proposal: 2, estimated: 1, unknown: 0 };

const RELIABILITY_PRIORITY = { high: 3, medium: 2, low: 1 };

const FIELD_NAMES = {
  CURRENT_STAGE: 'current_stage',
  HOUSEHOLD_COUNT_BEFORE: 'household_count_before',
  HOUSEHOLD_COUNT_AFTER: 'household_count_after',
  CONTRIBUTION_AMOUNT: 'contribution_amount',
  LOAN_STATUS: 'loan_status',
  MOVE_OUT_SCHEDULE: 'move_out_schedule'
};

module.exports = {
  STALE_AFTER_DAYS,
  STAGE_ORDER,
  VALUE_STATUS_PRIORITY,
  RELIABILITY_PRIORITY,
  FIELD_NAMES
};
