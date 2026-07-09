const express = require('express');
const complexesController = require('../controllers/complexes.controller');

const router = express.Router();

router.get('/', complexesController.listComplexes);
router.get('/:id', complexesController.getComplex);

module.exports = router;
