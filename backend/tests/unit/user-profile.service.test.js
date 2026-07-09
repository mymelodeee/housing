jest.mock('../../src/repositories/user-profile.repository');

const userProfileRepository = require('../../src/repositories/user-profile.repository');
const { getProfile, updateProfile } = require('../../src/services/user-profile.service');

const nullRow = {
  id: 1,
  workplace: null,
  ownership_structure: null,
  annual_income: null,
  annual_bonus: null,
  available_capital: null,
  housing_ownership_tier: null,
  is_first_time_buyer: null,
};

describe('services/user-profile.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('repository의 snake_case row가 camelCase로 매핑되어 반환된다', async () => {
      userProfileRepository.findById1.mockResolvedValue({
        id: 1,
        workplace: '화성',
        ownership_structure: '부부합산',
        annual_income: 7000,
        annual_bonus: 1000,
        available_capital: 25000,
        housing_ownership_tier: '1주택',
        is_first_time_buyer: false,
      });

      const result = await getProfile();

      expect(result).toEqual({
        id: 1,
        workplace: '화성',
        ownershipStructure: '부부합산',
        annualIncome: 7000,
        annualBonus: 1000,
        availableCapital: 25000,
        housingOwnershipTier: '1주택',
        isFirstTimeBuyer: false,
      });
    });
  });

  describe('updateProfile', () => {
    it('patch로 지정되지 않은 필드는 기존 값을 유지한 채 repository.update가 호출된다', async () => {
      userProfileRepository.findById1.mockResolvedValue(nullRow);
      userProfileRepository.update.mockResolvedValue({ ...nullRow, workplace: '화성' });

      await updateProfile({ workplace: '화성' });

      expect(userProfileRepository.update).toHaveBeenCalledWith({
        workplace: '화성',
        ownership_structure: null,
        annual_income: null,
        annual_bonus: null,
        available_capital: null,
        housing_ownership_tier: null,
        is_first_time_buyer: null,
      });
    });

    it('workplace가 화성/평택/null 외의 값이면 status 400 에러를 throw하고 repository.update는 호출되지 않는다', async () => {
      userProfileRepository.findById1.mockResolvedValue(nullRow);

      await expect(updateProfile({ workplace: '서울' })).rejects.toMatchObject({ status: 400 });

      expect(userProfileRepository.update).not.toHaveBeenCalled();
    });

    it('isFirstTimeBuyer가 true인데 housingOwnershipTier가 무주택이 아니면 status 400 에러를 throw하고 repository.update는 호출되지 않는다', async () => {
      userProfileRepository.findById1.mockResolvedValue({ ...nullRow, housing_ownership_tier: '1주택' });

      await expect(updateProfile({ isFirstTimeBuyer: true })).rejects.toMatchObject({ status: 400 });

      expect(userProfileRepository.update).not.toHaveBeenCalled();
    });

    it('housingOwnershipTier가 무주택이고 isFirstTimeBuyer가 true이면 정상적으로 repository.update가 호출되고 결과가 반환된다', async () => {
      userProfileRepository.findById1.mockResolvedValue(nullRow);
      const updatedRow = { ...nullRow, housing_ownership_tier: '무주택', is_first_time_buyer: true };
      userProfileRepository.update.mockResolvedValue(updatedRow);

      const result = await updateProfile({ housingOwnershipTier: '무주택', isFirstTimeBuyer: true });

      expect(userProfileRepository.update).toHaveBeenCalledWith({
        workplace: null,
        ownership_structure: null,
        annual_income: null,
        annual_bonus: null,
        available_capital: null,
        housing_ownership_tier: '무주택',
        is_first_time_buyer: true,
      });
      expect(result).toEqual({
        id: 1,
        workplace: null,
        ownershipStructure: null,
        annualIncome: null,
        annualBonus: null,
        availableCapital: null,
        housingOwnershipTier: '무주택',
        isFirstTimeBuyer: true,
      });
    });
  });
});
