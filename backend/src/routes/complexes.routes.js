const express = require('express');
const complexesController = require('../controllers/complexes.controller');

const router = express.Router();

router.get('/', complexesController.listComplexes);
router.get('/:id', complexesController.getComplex);
router.get('/:id/price-history', complexesController.getPriceHistory);
router.get('/:id/jeonse-history', complexesController.getJeonseHistory);
router.get('/:id/assigned-schools', complexesController.getAssignedSchools);
router.get('/:id/remodeling', complexesController.getRemodeling);
router.get('/:id/regulation', complexesController.getRegulation);
router.get('/:id/loan-simulation', complexesController.getLoanSimulation);

module.exports = router;
