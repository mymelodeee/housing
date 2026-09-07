const express = require('express');
const adminRemodelingController = require('../controllers/admin-remodeling.controller');

const router = express.Router();
router.get('/stale', adminRemodelingController.getStale);

module.exports = router;
