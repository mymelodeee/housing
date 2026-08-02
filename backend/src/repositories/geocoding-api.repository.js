const env = require('../config/env');

const ENDPOINT = 'https://maps.apigw.ntruss.com/map-geocode/v2/geocode';

async function geocodeAddress(query) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('query', query);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-NCP-APIGW-API-KEY-ID': env.dataGeocodingClientId,
      'X-NCP-APIGW-API-KEY': env.dataGeocodingClientSecret
    }
  });

  return response.json();
}

module.exports = { geocodeAddress, ENDPOINT };
