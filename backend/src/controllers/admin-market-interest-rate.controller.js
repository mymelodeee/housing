const marketInterestRateService = require('../services/market-interest-rate.service');

async function getCurrent(req, res, next) {
  try {
    const result = await marketInterestRateService.getCurrentRate();
    if (!result) {
      const err = new Error('등록된 기준금리 정보가 없습니다');
      err.status = 404;
      next(err);
      return;
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getCurrent };
