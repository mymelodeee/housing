const express = require('express');
const userProfileController = require('../controllers/user-profile.controller');

const router = express.Router();
router.get('/', userProfileController.getProfile);
router.put('/', userProfileController.updateProfile);

module.exports = router;
