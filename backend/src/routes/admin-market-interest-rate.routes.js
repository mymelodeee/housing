const express = require('express');
const adminMarketInterestRateController = require('../controllers/admin-market-interest-rate.controller');

const router = express.Router();
router.get('/', adminMarketInterestRateController.getCurrent);

module.exports = router;
