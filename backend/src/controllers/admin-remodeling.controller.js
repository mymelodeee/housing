const remodelingService = require('../services/remodeling.service');
const { STALE_AFTER_DAYS } = require('../config/remodeling');

async function getStale(req, res, next) {
  try {
    const { staleAfterDays } = req.query;
    const days = staleAfterDays === undefined ? STALE_AFTER_DAYS : Number(staleAfterDays);

    if (!Number.isFinite(days)) {
      const err = new Error('staleAfterDays는 숫자여야 합니다');
      err.status = 400;
      next(err);
      return;
    }

    const result = await remodelingService.getStaleReport({ staleAfterDays: days });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getStale };
