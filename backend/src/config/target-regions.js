// 경기남부+서울 전체 코드는 별도 리서치 완료 후 이 배열에 추가 예정.
// 지금은 기존 3개 지역(화성/평택/용인기흥)만 등록되어 있으며, 아래 코드들은
// 이 배열의 길이/내용에 의존하지 않고 몇 개가 들어와도 동작하도록 작성한다.
const TARGET_REGIONS = [
  { regionName: '화성', lawdCd: '41590' },
  { regionName: '평택', lawdCd: '41220' },
  { regionName: '용인기흥', lawdCd: '41463' }
];

module.exports = { TARGET_REGIONS };
