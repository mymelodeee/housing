const comparisonSetsRepository = require('../repositories/comparison-sets.repository');
const comparisonService = require('./comparison.service');

const USER_PROFILE_ID = 1;
const MIN_MEMBERS = 2;
const MAX_MEMBERS = 5;

function validateMemberCount(ids) {
  if (!ids || ids.length < MIN_MEMBERS) {
    return '비교하려면 2개 이상 선택해야 합니다';
  }
  if (ids.length > MAX_MEMBERS) {
    return '비교셋은 최대 5개까지 선택할 수 있습니다';
  }
  return null;
}

function throwValidationError(message) {
  const err = new Error(message);
  err.status = 400;
  throw err;
}

async function createComparisonSet({ targetType, complexIds, listingIds }) {
  const ids = targetType === 'complex' ? complexIds : listingIds;
  const validationError = validateMemberCount(ids);
  if (validationError) throwValidationError(validationError);

  const set = await comparisonSetsRepository.createSetWithMembers(USER_PROFILE_ID, targetType, ids);
  return comparisonService.getComparisonSetDetail(set.id);
}

async function addComplexMember(setId, complexId) {
  const currentCount = await comparisonSetsRepository.countComplexMembers(setId);
  if (currentCount >= MAX_MEMBERS) {
    throwValidationError('비교셋은 최대 5개까지 선택할 수 있습니다');
  }
  await comparisonSetsRepository.addComplexMember(setId, complexId);
  return comparisonService.getComparisonSetDetail(setId);
}

async function addListingMember(setId, listingId) {
  const currentCount = await comparisonSetsRepository.countListingMembers(setId);
  if (currentCount >= MAX_MEMBERS) {
    throwValidationError('비교셋은 최대 5개까지 선택할 수 있습니다');
  }
  await comparisonSetsRepository.addListingMember(setId, listingId);
  return comparisonService.getComparisonSetDetail(setId);
}

module.exports = { validateMemberCount, createComparisonSet, addComplexMember, addListingMember };
