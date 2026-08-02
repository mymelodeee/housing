const regionalListingsService = require('../services/regional-listings.service');

function parseNumberOrUndefined(value) {
  return value === undefined ? undefined : Number(value);
}

async function liveSearch(req, res, next) {
  try {
    const { minPrice, maxPrice, minArea, maxArea } = req.query;
    const result = await regionalListingsService.searchLiveListings({
      minPrice: parseNumberOrUndefined(minPrice),
      maxPrice: parseNumberOrUndefined(maxPrice),
      minArea: parseNumberOrUndefined(minArea),
      maxArea: parseNumberOrUndefined(maxArea)
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function selectLiveListing(req, res, next) {
  try {
    const id = Number(req.body.id);
    const result = await regionalListingsService.selectCacheEntry(id);
    if (!result) {
      const err = new Error('존재하지 않는 캐시 항목입니다');
      err.status = 404;
      next(err);
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { liveSearch, selectLiveListing };
