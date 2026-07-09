const userProfileService = require('../services/user-profile.service');

async function getProfile(req, res, next) {
  try {
    const result = await userProfileService.getProfile();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const result = await userProfileService.updateProfile(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
