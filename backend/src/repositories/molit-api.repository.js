const env = require('../config/env');

const ENDPOINT = 'http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

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
