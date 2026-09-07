const regionalTransactionsService = require('../services/regional-transactions.service');

function parseNumberOrUndefined(value) {
  return value === undefined ? undefined : Number(value);
}

async function searchRecentTransactions(req, res, next) {
  try {
    const { minPrice, maxPrice, minArea, maxArea, city } = req.query;
    const result = await regionalTransactionsService.searchRecentTransactions({
      minPrice: parseNumberOrUndefined(minPrice),
      maxPrice: parseNumberOrUndefined(maxPrice),
      minArea: parseNumberOrUndefined(minArea),
      maxArea: parseNumberOrUndefined(maxArea),
      city: city || undefined
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function selectRecentTransaction(req, res, next) {
  try {
    const id = Number(req.body.id);
    const result = await regionalTransactionsService.selectCacheEntry(id);
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

async function selectRecentTransactionComplex(req, res, next) {
  try {
    const id = Number(req.body.id);
    const result = await regionalTransactionsService.selectCacheEntryComplex(id);
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

module.exports = { searchRecentTransactions, selectRecentTransaction, selectRecentTransactionComplex };
