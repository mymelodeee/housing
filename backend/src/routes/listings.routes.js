const express = require('express');
const listingsController = require('../controllers/listings.controller');
const regionalListingsController = require('../controllers/regional-listings.controller');

const router = express.Router();
router.get('/', listingsController.listListings);
router.get('/live-search', regionalListingsController.liveSearch);
router.post('/live-search/select', regionalListingsController.selectLiveListing);
router.get('/:id', listingsController.getListing);
router.get('/:id/locality', listingsController.getListingLocality);
router.get('/:id/price-history', listingsController.getPriceHistory);
router.get('/:id/jeonse-history', listingsController.getJeonseHistory);
router.get('/:id/assigned-schools', listingsController.getAssignedSchools);
router.get('/:id/regulation', listingsController.getListingRegulation);
router.get('/:id/loan-simulation', listingsController.getListingLoanSimulation);

module.exports = router;
