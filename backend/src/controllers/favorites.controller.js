const favoritesService = require('../services/favorites.service');

const UNIQUE_VIOLATION = '23505';

async function addComplexFavorite(req, res, next) {
  try {
    const result = await favoritesService.addComplexFavorite(Number(req.body.complexId));
    res.status(201).json(result);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ message: '이미 즐겨찾기에 추가된 단지입니다' });
    }
    next(err);
  }
}

async function addListingFavorite(req, res, next) {
  try {
    const result = await favoritesService.addListingFavorite(Number(req.body.listingId));
    res.status(201).json(result);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ message: '이미 즐겨찾기에 추가된 매물입니다' });
    }
    next(err);
  }
}

async function removeComplexFavorite(req, res, next) {
  try {
    const removed = await favoritesService.removeComplexFavorite(Number(req.params.complexId));
    if (!removed) {
      const err = new Error('존재하지 않는 즐겨찾기입니다');
      err.status = 404;
      return next(err);
    }
    res.status(200).json({ message: '해제되었습니다' });
  } catch (err) {
    next(err);
  }
}

async function removeListingFavorite(req, res, next) {
  try {
    const removed = await favoritesService.removeListingFavorite(Number(req.params.listingId));
    if (!removed) {
      const err = new Error('존재하지 않는 즐겨찾기입니다');
      err.status = 404;
      return next(err);
    }
    res.status(200).json({ message: '해제되었습니다' });
  } catch (err) {
    next(err);
  }
}

async function listComplexFavorites(req, res, next) {
  try {
    res.json(await favoritesService.listComplexFavorites());
  } catch (err) {
    next(err);
  }
}

async function listListingFavorites(req, res, next) {
  try {
    res.json(await favoritesService.listListingFavorites());
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addComplexFavorite, addListingFavorite,
  removeComplexFavorite, removeListingFavorite,
  listComplexFavorites, listListingFavorites
};
