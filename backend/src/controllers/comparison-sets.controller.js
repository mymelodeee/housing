const comparisonSetService = require('../services/comparison-set.service');
const comparisonService = require('../services/comparison.service');

const UNIQUE_VIOLATION = '23505';

async function create(req, res, next) {
  try {
    const { targetType, complexIds, listingIds } = req.body;
    const result = await comparisonSetService.createComparisonSet({ targetType, complexIds, listingIds });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await comparisonSetService.listComparisonSets();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getDetail(req, res, next) {
  try {
    const result = await comparisonService.getComparisonSetDetail(Number(req.params.id));
    if (!result) {
      const err = new Error('존재하지 않는 비교셋입니다');
      err.status = 404;
      return next(err);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function addComplex(req, res, next) {
  try {
    const result = await comparisonSetService.addComplexMember(Number(req.params.id), Number(req.body.complexId));
    res.status(201).json(result);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ message: '중복입니다' });
    }
    next(err);
  }
}

async function addListing(req, res, next) {
  try {
    const result = await comparisonSetService.addListingMember(Number(req.params.id), Number(req.body.listingId));
    res.status(201).json(result);
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      return res.status(409).json({ message: '중복입니다' });
    }
    next(err);
  }
}

module.exports = { create, list, getDetail, addComplex, addListing };
