jest.mock('../../src/repositories/geocoding-api.repository');

const geocodingApiRepository = require('../../src/repositories/geocoding-api.repository');
const { geocodeAddress, extractCoordinates } = require('../../src/services/geocoding.service');

describe('services/geocoding.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('extractCoordinates', () => {
    it('status가 OK이고 addresses가 있으면 위경도를 숫자로 반환한다', () => {
      const json = { status: 'OK', addresses: [{ x: '127.027621', y: '37.497942' }] };
      expect(extractCoordinates(json)).toEqual({ latitude: 37.497942, longitude: 127.027621 });
    });

    it('status가 OK가 아니면 null을 반환한다', () => {
      const json = { status: 'INVALID_REQUEST', addresses: [] };
      expect(extractCoordinates(json)).toBeNull();
    });

    it('addresses가 빈 배열이면 null을 반환한다', () => {
      const json = { status: 'OK', addresses: [] };
      expect(extractCoordinates(json)).toBeNull();
    });
  });

  describe('geocodeAddress', () => {
    it('레포지토리 응답을 좌표로 변환해 반환한다', async () => {
      geocodingApiRepository.geocodeAddress.mockResolvedValue({
        status: 'OK',
        addresses: [{ x: '127.1', y: '37.2' }]
      });

      const result = await geocodeAddress('경기도 화성시 동탄대로시범길 276');

      expect(result).toEqual({ latitude: 37.2, longitude: 127.1 });
      expect(geocodingApiRepository.geocodeAddress).toHaveBeenCalledWith('경기도 화성시 동탄대로시범길 276');
    });

    it('결과가 없으면 null을 반환한다', async () => {
      geocodingApiRepository.geocodeAddress.mockResolvedValue({ status: 'OK', addresses: [] });

      const result = await geocodeAddress('존재하지 않는 주소');

      expect(result).toBeNull();
    });
  });
});
