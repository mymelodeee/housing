const env = require('../config/env');

// 구 버전(1611000/AptListService, AptListService2, AptListService3 등)은 전부
// NO_OPENAPI_SERVICE_ERROR(폐기됨)를 반환하며, 현행 서비스는 1613000/AptListService4임을
// 실측 확인(2026-09-08, datago-api-prober). 법정동 단위(getLegaldongAptList4)는 10자리
// bjdCode가 필요하므로, 수집 단위인 법정동코드 앞 5자리와 맞는 시군구 단위
// (getSigunguAptList4)를 사용한다. 응답은 JSON.
const LIST_ENDPOINT = 'https://apis.data.go.kr/1613000/AptListService4/getSigunguAptList4';

// 단지 목록 API 응답에는 세대수/동수가 없어, 공동주택 기본 정보제공 서비스(V5, 구 V4는
// 폐기됨 — 2026-09-08 실측 확인)를 kaptCode 단위로 조회해 세대수(kaptdaCnt)/동수
// (kaptDongCnt)를 얻는다. 응답은 JSON.
const BASIS_ENDPOINT = 'https://apis.data.go.kr/1613000/AptBasisInfoServiceV5/getAphusBassInfoV5';

async function fetchAptListJson({ sigunguCode, pageNo = 1, numOfRows = 1000 }) {
  const url = new URL(LIST_ENDPOINT);
  url.searchParams.set('serviceKey', env.dataAptListApiKey);
  url.searchParams.set('sigunguCode', sigunguCode);
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(numOfRows));

  const response = await fetch(url);
  return response.text();
}

async function fetchAptBasisInfoJson({ kaptCode }) {
  const url = new URL(BASIS_ENDPOINT);
  url.searchParams.set('serviceKey', env.dataAptListApiKey);
  url.searchParams.set('kaptCode', kaptCode);

  const response = await fetch(url);
  return response.text();
}

module.exports = { fetchAptListJson, fetchAptBasisInfoJson, LIST_ENDPOINT, BASIS_ENDPOINT };
