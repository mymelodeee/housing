const listingsRepository = require('../repositories/listings.repository');

async function getComplexPriceRange(complexId) {
  const row = await listingsRepository.aggregatePriceRangeByComplexId(complexId);

  if (row.count === 0) {
    return '매물 없음';
  }

  return {
    minPrice: row.min_price,
    maxPrice: row.max_price,
    avgPrice: row.avg_price
  };
}

module.exports = { getComplexPriceRange };
