const express = require('express');
const favoritesController = require('../controllers/favorites.controller');

const router = express.Router();
router.get('/complexes', favoritesController.listComplexFavorites);
router.post('/complexes', favoritesController.addComplexFavorite);
router.delete('/complexes/:complexId', favoritesController.removeComplexFavorite);
router.get('/listings', favoritesController.listListingFavorites);
router.post('/listings', favoritesController.addListingFavorite);
router.delete('/listings/:listingId', favoritesController.removeListingFavorite);

module.exports = router;
