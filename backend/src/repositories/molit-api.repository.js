const env = require('../config/env');

// Dev 버전(RTMSDataSvcAptTradeDev)은 발급 키의 활용신청 범위에 없어
// SERVICE_KEY_IS_NOT_REGISTERED_ERROR를 반환한다(2026-08-17 실측). 비-Dev 버전 사용.
const ENDPOINT = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade';

// 아파트 전월세 실거래 자료. 매매와 동일한 요청 형식이며, 현재 발급 키에는
// 활용신청이 없어 SERVICE_KEY_IS_NOT_REGISTERED_ERROR 상태(2026-08-17 실측) —
// data.go.kr "국토교통부_아파트 전월세 실거래가 자료" 활용신청 승인 후 동작한다.
const RENT_ENDPOINT = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent';

function buildTradeUrl(endpoint, { lawdCd, dealYmd, pageNo, numOfRows }) {
  const url = new URL(endpoint);
  url.searchParams.set('serviceKey', env.dataAptKrApiKey);
  url.searchParams.set('LAWD_CD', lawdCd);
  url.searchParams.set('DEAL_YMD', dealYmd);
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(numOfRows));
  return url;
}

async function fetchAptTradeXml({ lawdCd, dealYmd, pageNo = 1, numOfRows = 1000 }) {
  const response = await fetch(buildTradeUrl(ENDPOINT, { lawdCd, dealYmd, pageNo, numOfRows }));
  return response.text();
}

async function fetchAptRentXml({ lawdCd, dealYmd, pageNo = 1, numOfRows = 1000 }) {
  const response = await fetch(buildTradeUrl(RENT_ENDPOINT, { lawdCd, dealYmd, pageNo, numOfRows }));
  return response.text();
}

module.exports = { fetchAptTradeXml, fetchAptRentXml };
