const geocodingApiRepository = require('../repositories/geocoding-api.repository');

function extractCoordinates(json) {
  const address = json && json.status === 'OK' && Array.isArray(json.addresses) && json.addresses[0];
  if (!address) return null;

  return {
    latitude: Number(address.y),
    longitude: Number(address.x)
  };
}

async function geocodeAddress(query) {
  const json = await geocodingApiRepository.geocodeAddress(query);
  return extractCoordinates(json);
}

module.exports = { geocodeAddress, extractCoordinates };
