jest.mock('../../src/repositories/elementary-schools.repository');

const elementarySchoolsRepository = require('../../src/repositories/elementary-schools.repository');
const {
  haversineDistanceMeters,
  buildBoundingBoxDegrees,
  selectNearest,
  findNearestSchoolByLevel,
  ASSIGNED_SCHOOL_SEARCH_RADIUS_METERS,
} = require('../../src/services/elementary-school.service');

describe('services/elementary-school.service', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('haversineDistanceMeters', () => {
    it('동일 좌표는 거리 0을 반환한다', () => {
      expect(haversineDistanceMeters(37.2, 127.1, 37.2, 127.1)).toBe(0);
    });

    it('위도 0.001도 차이(약 111m)를 대략적으로 계산한다', () => {
      const distance = haversineDistanceMeters(37.2, 127.1, 37.201, 127.1);
      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(120);
    });
  });

  describe('buildBoundingBoxDegrees', () => {
    it('중심좌표를 기준으로 반경만큼의 위경도 범위를 계산한다', () => {
      const box = buildBoundingBoxDegrees(37.2, 127.1, 700);

      expect(box.minLat).toBeLessThan(37.2);
      expect(box.maxLat).toBeGreaterThan(37.2);
      expect(box.minLng).toBeLessThan(127.1);
      expect(box.maxLng).toBeGreaterThan(127.1);
    });
  });

  describe('selectNearest', () => {
    const latitude = 37.2;
    const longitude = 127.1;

    it('후보가 없으면 null을 반환한다', () => {
      expect(selectNearest([], latitude, longitude)).toBeNull();
    });

    it('가장 가까운 학교를 반경 제한 없이 반환한다', () => {
      const candidates = [
        { school_name: '먼초등학교', latitude: 37.204, longitude: 127.1 }, // ~444m
        { school_name: '가까운초등학교', latitude: 37.201, longitude: 127.1 }, // ~111m
      ];

      const result = selectNearest(candidates, latitude, longitude);

      expect(result.schoolName).toBe('가까운초등학교');
      expect(result.distanceMeters).toBeLessThan(200);
    });
  });

  describe('findNearestSchoolByLevel', () => {
    it('repository에서 받은 후보로 가장 가까운 학교를 계산해 반환한다', async () => {
      elementarySchoolsRepository.findWithinBoundingBox.mockResolvedValue([
        { school_name: '동탄중앙초등학교', latitude: 37.201, longitude: 127.1 },
      ]);

      const result = await findNearestSchoolByLevel(37.2, 127.1, '초등학교');

      expect(elementarySchoolsRepository.findWithinBoundingBox).toHaveBeenCalledWith(
        expect.objectContaining({
          minLat: expect.any(Number),
          maxLat: expect.any(Number),
          minLng: expect.any(Number),
          maxLng: expect.any(Number),
          schoolLevel: '초등학교',
        })
      );
      expect(result.schoolName).toBe('동탄중앙초등학교');
    });

    it('후보가 없으면 null을 반환한다', async () => {
      elementarySchoolsRepository.findWithinBoundingBox.mockResolvedValue([]);

      const result = await findNearestSchoolByLevel(37.2, 127.1, '중학교');

      expect(result).toBeNull();
    });
  });

  it('ASSIGNED_SCHOOL_SEARCH_RADIUS_METERS는 3000이다', () => {
    expect(ASSIGNED_SCHOOL_SEARCH_RADIUS_METERS).toBe(3000);
  });
});
