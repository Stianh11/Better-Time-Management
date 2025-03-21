const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Route to get all timesheets and highlight missing times
router.get('/timesheets', adminController.getAllTimesheets);

module.exports = router;