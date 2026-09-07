const express = require('express');
const listingsController = require('../controllers/listings.controller');
const regionalTransactionsController = require('../controllers/regional-transactions.controller');

const router = express.Router();
router.get('/', listingsController.listListings);
router.get('/regions/cities', listingsController.getCities);
router.get('/market-search', regionalTransactionsController.searchRecentTransactions);
router.post('/market-search/select', regionalTransactionsController.selectRecentTransaction);
router.post('/market-search/select-complex', regionalTransactionsController.selectRecentTransactionComplex);
router.get('/:id', listingsController.getListing);
router.get('/:id/locality', listingsController.getListingLocality);
router.get('/:id/price-history', listingsController.getPriceHistory);
router.get('/:id/jeonse-history', listingsController.getJeonseHistory);
router.get('/:id/assigned-schools', listingsController.getAssignedSchools);
router.get('/:id/remodeling', listingsController.getRemodeling);
router.get('/:id/regulation', listingsController.getListingRegulation);
router.get('/:id/loan-simulation', listingsController.getListingLoanSimulation);

module.exports = router;
