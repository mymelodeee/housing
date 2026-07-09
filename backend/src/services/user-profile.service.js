const userProfileRepository = require('../repositories/user-profile.repository');

function mapProfileRow(row) {
  return {
    id: row.id,
    workplace: row.workplace,
    ownershipStructure: row.ownership_structure,
    annualIncome: row.annual_income,
    annualBonus: row.annual_bonus,
    availableCapital: row.available_capital,
    housingOwnershipTier: row.housing_ownership_tier,
    isFirstTimeBuyer: row.is_first_time_buyer
  };
}

function validatePatch(merged) {
  if (merged.workplace !== null && merged.workplace !== undefined && merged.workplace !== '화성' && merged.workplace !== '평택') {
    return 'workplace는 화성/평택/null만 허용됩니다';
  }
  if (merged.is_first_time_buyer === true && merged.housing_ownership_tier !== '무주택') {
    return '생애최초는 무주택일 때만 true일 수 있습니다';
  }
  return null;
}

async function getProfile() {
  const row = await userProfileRepository.findById1();
  return mapProfileRow(row);
}

async function updateProfile(patch) {
  const current = await userProfileRepository.findById1();
  const merged = {
    workplace: patch.workplace !== undefined ? patch.workplace : current.workplace,
    ownership_structure: patch.ownershipStructure !== undefined ? patch.ownershipStructure : current.ownership_structure,
    annual_income: patch.annualIncome !== undefined ? patch.annualIncome : current.annual_income,
    annual_bonus: patch.annualBonus !== undefined ? patch.annualBonus : current.annual_bonus,
    available_capital: patch.availableCapital !== undefined ? patch.availableCapital : current.available_capital,
    housing_ownership_tier: patch.housingOwnershipTier !== undefined ? patch.housingOwnershipTier : current.housing_ownership_tier,
    is_first_time_buyer: patch.isFirstTimeBuyer !== undefined ? patch.isFirstTimeBuyer : current.is_first_time_buyer
  };

  const validationError = validatePatch(merged);
  if (validationError) {
    const err = new Error(validationError);
    err.status = 400;
    throw err;
  }

  const updated = await userProfileRepository.update(merged);
  return mapProfileRow(updated);
}

module.exports = { getProfile, updateProfile };
