const FOREIGN_KEY_VIOLATION = '23503';

function notFoundHandler(req, res, next) {
  res.status(404).json({ message: '존재하지 않는 리소스입니다' });
}

function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.stack || err.message);

  if (err.code === FOREIGN_KEY_VIOLATION) {
    return res.status(404).json({ message: '존재하지 않는 리소스입니다' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status >= 400 && status < 500 ? err.message : '서버 오류가 발생했습니다';

  res.status(status).json({ message });
}

module.exports = { notFoundHandler, errorHandler };
