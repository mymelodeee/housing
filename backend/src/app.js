const express = require('express');
const corsMiddleware = require('./middlewares/cors');
const { notFoundHandler, errorHandler } = require('./middlewares/error-handler');
const complexesRoutes = require('./routes/complexes.routes');
const listingsRoutes = require('./routes/listings.routes');
const userProfileRoutes = require('./routes/user-profile.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const comparisonSetsRoutes = require('./routes/comparison-sets.routes');

const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/complexes', complexesRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/comparison-sets', comparisonSetsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
