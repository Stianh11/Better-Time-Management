const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Route to display all timesheets
router.get('/timesheets', adminController.getAllTimesheets);

module.exports = router;