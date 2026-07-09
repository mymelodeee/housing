const apartmentComplexesService = require('../services/apartment-complexes.service');

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
      const err = new Error('존재하지 않는 단지입니다');
      err.status = 404;
      next(err);
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listComplexes, getComplex };
