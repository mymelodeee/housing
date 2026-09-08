// 대출 시뮬레이션 DSR 역산·상환액 계산에 쓰는 기준금리 재조사 정책 설정.
// 한국은행이 매월 발표하는 "금융기관 가중평균금리"(예금은행 신규취급액 기준
// 주택담보대출)를 사람이 직접 확인해 DB에 반영하는 방식이라, checked_at이
// 오래된 경우에만 재조사 대상임을 판별할 수 있도록 기준일을 설정값으로 둔다.
// env.js의 required 목록에는 넣지 않는다(미설정 시 기본값 30일로 동작).
const STALE_AFTER_DAYS = Number(process.env.MARKET_INTEREST_RATE_STALE_AFTER_DAYS) || 30;

module.exports = { STALE_AFTER_DAYS };
