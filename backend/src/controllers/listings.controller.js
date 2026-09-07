const listingsService = require('../services/listings.service');

function parseNumberOrUndefined(value) {
  return value === undefined ? undefined : Number(value);
}

async function listListings(req, res, next) {
  try {
    const { minPrice, maxPrice, minLat, maxLat, minLng, maxLng, city } = req.query;
    const result = await listingsService.listListings({
      minPrice: parseNumberOrUndefined(minPrice),
      maxPrice: parseNumberOrUndefined(maxPrice),
      minLat: parseNumberOrUndefined(minLat),
      maxLat: parseNumberOrUndefined(maxLat),
      minLng: parseNumberOrUndefined(minLng),
      maxLng: parseNumberOrUndefined(maxLng),
      city: city || undefined
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getCities(req, res, next) {
  try {
    res.json({ cities: listingsService.getCities() });
  } catch (err) {
    next(err);
  }
}

async function getListing(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await listingsService.getListingDetail(id);
    if (!result) {
      const err = new Error('존재하지 않는 매물입니다');
      err.status = 404;
      next(err);
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getListingLocality(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await listingsService.getListingLocality(id);
    if (!result) {
      const err = new Error('존재하지 않는 매물입니다');
      err.status = 404;
      next(err);
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getPriceHistory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await listingsService.getPriceHistory(id);
    if (!result) {
      const err = new Error('존재하지 않는 매물입니다');
      err.status = 404;
      next(err);
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getJeonseHistory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await listingsService.getJeonseHistory(id);
    if (!result) {
      const err = new Error('존재하지 않는 매물입니다');
      err.status = 404;
      next(err);
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getAssignedSchools(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await listingsService.getAssignedSchools(id);
    if (!result) {
      const err = new Error('존재하지 않는 매물입니다');
      err.status = 404;
      next(err);
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getRemodeling(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await listingsService.getRemodeling(id);
    if (!result) {
      const err = new Error('존재하지 않는 매물입니다');
      err.status = 404;
      next(err);
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getListingRegulation(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await listingsService.getListingRegulation(id);
    if (!result) {
      const err = new Error('존재하지 않는 매물입니다');
      err.status = 404;
      next(err);
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getListingLoanSimulation(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await listingsService.getListingLoanSimulation(id);
    if (!result) {
      const err = new Error('존재하지 않는 매물입니다');
      err.status = 404;
      next(err);
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listListings,
  getCities,
  getListing,
  getListingLocality,
  getPriceHistory,
  getJeonseHistory,
  getAssignedSchools,
  getRemodeling,
  getListingRegulation,
  getListingLoanSimulation
};
