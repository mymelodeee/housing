/**
 * 전국초중등학교위치표준데이터(data.go.kr, 15021148) 중 서비스 대상 지역의
 * 초등학교·중학교·고등학교를 걸러 elementary_schools 테이블에 적재하는 1회성 시드 스크립트.
 *
 * 반기 갱신되는 정적 데이터셋이므로 요청마다 호출하지 않고, 이 스크립트를 필요할 때만
 * 직접 실행한다.
 *
 *   node scripts/seed-elementary-schools.js
 *
 * 주의: DATA_SCHOOL_API_KEY에 해당하는 data.go.kr 계정에
 * "전국초중등학교위치표준데이터" 활용신청 승인이 필요하다(미승인 시
 * SERVICE_KEY_IS_NOT_REGISTERED_ERROR — 2026-08-17 실측).
 */
require('dotenv').config();

const elementarySchoolsRepository = require('../src/repositories/elementary-schools.repository');
const pool = require('../src/db/pool');

const ENDPOINT = 'https://api.data.go.kr/openapi/tn_pubr_public_elesch_mskul_lc_api';
const TARGET_REGION_KEYWORDS = [
  '경기도 화성시',
  '경기도 수원시',
  '경기도 용인시',
  '경기도 성남시',
  '경기도 하남시',
  '서울특별시 강동구',
  '서울특별시 송파구'
];
const TARGET_SCHOOL_LEVELS = ['초등학교', '중학교', '고등학교'];
const PAGE_SIZE = 1000;

function isTargetRegionAddress(address) {
  return Boolean(address) && TARGET_REGION_KEYWORDS.some((keyword) => address.includes(keyword));
}

function resolveSchoolLevel(item) {
  if (TARGET_SCHOOL_LEVELS.includes(item.schoolSe)) {
    return item.schoolSe;
  }
  return TARGET_SCHOOL_LEVELS.find((level) => item.schoolNm && item.schoolNm.includes(level));
}

async function fetchSchoolsPage(pageNo) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('serviceKey', process.env.DATA_SCHOOL_API_KEY);
  url.searchParams.set('type', 'json');
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(PAGE_SIZE));

  const response = await fetch(url);
  const json = await response.json();

  const resultCode = json && json.header && json.header.resultCode;
  const resultMsg = json && json.header && json.header.resultMsg;

  if (String(resultCode) !== '00') {
    throw new Error(`전국초중등학교위치표준데이터 API 오류: resultCode=${resultCode} resultMsg=${resultMsg}`);
  }

  const items = json.body && json.body.items && json.body.items.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

async function fetchAllSchools() {
  const allItems = [];
  let pageNo = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const items = await fetchSchoolsPage(pageNo);
    allItems.push(...items);

    if (items.length < PAGE_SIZE) {
      break;
    }
    pageNo += 1;
  }

  return allItems;
}

function mapToSchool(item, schoolLevel) {
  const address = item.rdnmadr || item.lnmadr || '';

  return {
    schoolName: item.schoolNm,
    schoolLevel,
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),
    address
  };
}

async function main() {
  if (!process.env.DATA_SCHOOL_API_KEY) {
    throw new Error('DATA_SCHOOL_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  console.log('전국초중등학교위치표준데이터 조회 중...');
  const allItems = await fetchAllSchools();
  console.log(`전체 ${allItems.length}건 조회 완료`);

  const targetSchools = allItems
    .filter((item) => isTargetRegionAddress(item.rdnmadr) || isTargetRegionAddress(item.lnmadr))
    .filter((item) => item.latitude && item.longitude)
    .map((item) => {
      const schoolLevel = resolveSchoolLevel(item);
      return schoolLevel ? mapToSchool(item, schoolLevel) : null;
    })
    .filter((school) => school !== null);

  console.log(`대상 지역 초·중·고 ${targetSchools.length}건 필터링 완료`);

  await elementarySchoolsRepository.deleteAll();
  await elementarySchoolsRepository.insertMany(targetSchools);

  console.log(`elementary_schools 테이블에 ${targetSchools.length}건 적재 완료`);
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('[ERROR] 학교 데이터 시드 실패:', err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = {
  isTargetRegionAddress,
  resolveSchoolLevel,
  fetchSchoolsPage,
  mapToSchool,
  TARGET_SCHOOL_LEVELS
};
