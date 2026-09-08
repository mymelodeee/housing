const apartmentComplexesService = require('../services/apartment-complexes.service');
const complexDetailService = require('../services/complex-detail.service');

function parseNumberOrUndefined(value) {
  return value === undefined ? undefined : Number(value);
}

function notFound(next) {
  const err = new Error('존재하지 않는 단지입니다');
  err.status = 404;
  next(err);
}

async function listComplexes(req, res, next) {
  try {
    const result = await apartmentComplexesService.listComplexSummaries();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getComplex(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await apartmentComplexesService.getComplexDetail(id);

    if (!result) {
      notFound(next);
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
    const result = await complexDetailService.getPriceHistory(id);
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getJeonseHistory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await complexDetailService.getJeonseHistory(id, {
      exclusiveArea: parseNumberOrUndefined(req.query.exclusiveArea)
    });
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getAssignedSchools(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await complexDetailService.getAssignedSchools(id);
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getRemodeling(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await complexDetailService.getRemodeling(id);
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getDevelopmentProjects(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await complexDetailService.getDevelopmentProjects(id);
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getRegulation(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await complexDetailService.getRegulation(id, { salePrice: parseNumberOrUndefined(req.query.salePrice) });
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getLoanSimulation(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await complexDetailService.getLoanSimulation(id, { salePrice: parseNumberOrUndefined(req.query.salePrice) });
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getAcquisitionCosts(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await complexDetailService.getAcquisitionCosts(id, {
      salePrice: parseNumberOrUndefined(req.query.salePrice),
      exclusiveArea: parseNumberOrUndefined(req.query.exclusiveArea),
      homeCount: parseNumberOrUndefined(req.query.homeCount),
      isHeavyTaxExempt: req.query.isHeavyTaxExempt === 'true',
      negotiatedRatePercent: parseNumberOrUndefined(req.query.negotiatedRatePercent),
      buyerStampDutySharePercent: parseNumberOrUndefined(req.query.buyerStampDutySharePercent)
    });
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getLoanSchedule(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await complexDetailService.getLoanSchedule(id, {
      principal: parseNumberOrUndefined(req.query.principal),
      interestRatePercent: parseNumberOrUndefined(req.query.interestRatePercent),
      graceMonths: parseNumberOrUndefined(req.query.graceMonths),
      years: parseNumberOrUndefined(req.query.years)
    });
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getHoldingTaxEstimate(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await complexDetailService.getHoldingTaxEstimate(id, {
      salePrice: parseNumberOrUndefined(req.query.salePrice),
      publicPrice: parseNumberOrUndefined(req.query.publicPrice),
      publicRatio: parseNumberOrUndefined(req.query.publicRatio),
      homeCount: parseNumberOrUndefined(req.query.homeCount),
      includeUrbanAreaTax: req.query.includeUrbanAreaTax === 'true'
    });
    if (!result) return notFound(next);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listComplexes,
  getComplex,
  getPriceHistory,
  getJeonseHistory,
  getAssignedSchools,
  getRemodeling,
  getDevelopmentProjects,
  getRegulation,
  getLoanSimulation,
  getAcquisitionCosts,
  getLoanSchedule,
  getHoldingTaxEstimate
};
