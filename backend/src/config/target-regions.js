// 대상 지역 목록. 아래 코드들은 이 배열의 길이/내용에 의존하지 않고 몇 개가
// 들어와도 동작하도록 작성한다.
// dongs가 지정된 지역은 해당 법정동의 거래만 수집한다(행정구역 단위보다 좁은
// 신도시 권역을 표현하기 위한 필터 — 예: 위례신도시).
// 위례신도시의 성남시 수정구 부분(창곡동·복정동)은 '성남수정' 항목이 구 전체를
// 커버하므로 별도 항목을 두지 않는다.
const TARGET_REGIONS = [
  // 화성시는 2026-02-01 일반구 4개(만세/효행/병점/동탄) 설치로 41590이 분할됨
  // (41590 조회 시 0건 — 2026-08-17 실측). 화성시는 병점구/동탄구만 대상으로 한다.
  { regionName: '화성시 병점구', lawdCd: '41595' },
  { regionName: '화성시 동탄구', lawdCd: '41597' },
  { regionName: '수원시 영통구', lawdCd: '41117' },
  { regionName: '서울 강동구', lawdCd: '11740' },
  { regionName: '성남시 수정구', lawdCd: '41131' },
  { regionName: '성남시 중원구', lawdCd: '41133' },
  { regionName: '성남시 분당구', lawdCd: '41135' },
  { regionName: '용인시 수지구', lawdCd: '41465' },
  { regionName: '서울 송파구', lawdCd: '11710', dongs: ['장지동', '거여동'] },
  { regionName: '하남시', lawdCd: '41450', dongs: ['학암동', '감이동'] }
];

module.exports = { TARGET_REGIONS };
