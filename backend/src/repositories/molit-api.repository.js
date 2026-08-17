const env = require('../config/env');

// Dev 버전(RTMSDataSvcAptTradeDev)은 발급 키의 활용신청 범위에 없어
// SERVICE_KEY_IS_NOT_REGISTERED_ERROR를 반환한다(2026-08-17 실측). 비-Dev 버전 사용.
const ENDPOINT = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade';

async function fetchAptTradeXml({ lawdCd, dealYmd, pageNo = 1, numOfRows = 1000 }) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('serviceKey', env.dataAptKrApiKey);
  url.searchParams.set('LAWD_CD', lawdCd);
  url.searchParams.set('DEAL_YMD', dealYmd);
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(numOfRows));

  const response = await fetch(url);
  return response.text();
}

module.exports = { fetchAptTradeXml };
