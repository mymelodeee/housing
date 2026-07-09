jest.mock('../../src/repositories/listings.repository');

const listingsRepository = require('../../src/repositories/listings.repository');
const { getComplexPriceRange } = require('../../src/services/apartment-complex-price.service');

describe('services/apartment-complex-price.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('count가 0이면 문자열 "매물 없음"을 반환한다', async () => {
    listingsRepository.aggregatePriceRangeByComplexId.mockResolvedValue({
      count: 0,
      min_price: null,
      max_price: null,
      avg_price: null,
    });

    const result = await getComplexPriceRange(3);

    expect(result).toBe('매물 없음');
  });

  it('count가 1이면 min=max=avg인 가격 객체를 반환한다', async () => {
    listingsRepository.aggregatePriceRangeByComplexId.mockResolvedValue({
      count: 1,
      min_price: 105000,
      max_price: 105000,
      avg_price: 105000,
    });

    const result = await getComplexPriceRange(2);

    expect(result).toEqual({
      minPrice: 105000,
      maxPrice: 105000,
      avgPrice: 105000,
    });
  });

  it('count가 3이면 min/max/avg가 반영된 가격 객체를 반환한다', async () => {
    listingsRepository.aggregatePriceRangeByComplexId.mockResolvedValue({
      count: 3,
      min_price: 88000,
      max_price: 110000,
      avg_price: 97667,
    });

    const result = await getComplexPriceRange(1);

    expect(result).toEqual({
      minPrice: 88000,
      maxPrice: 110000,
      avgPrice: 97667,
    });
  });
});
