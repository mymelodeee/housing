const env = require('../config/env');

const ENDPOINT = 'https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius';

async function fetchStoresInRadius({ cx, cy, radius, indsSclsCd, pageNo = 1, numOfRows = 1 }) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('serviceKey', env.dataStoreApiKey);
  url.searchParams.set('type', 'json');
  url.searchParams.set('cx', String(cx));
  url.searchParams.set('cy', String(cy));
  url.searchParams.set('radius', String(radius));
  if (indsSclsCd) {
    url.searchParams.set('indsSclsCd', indsSclsCd);
  }
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(numOfRows));

  const response = await fetch(url);
  return response.json();
}

module.exports = { fetchStoresInRadius, ENDPOINT };
