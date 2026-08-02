const express = require('express');
const comparisonSetsController = require('../controllers/comparison-sets.controller');

const router = express.Router();
router.post('/', comparisonSetsController.create);
router.get('/', comparisonSetsController.list);
router.get('/:id', comparisonSetsController.getDetail);
router.post('/:id/complexes', comparisonSetsController.addComplex);
router.post('/:id/listings', comparisonSetsController.addListing);

module.exports = router;
