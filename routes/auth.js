const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const User = require('../model/User');

// Create controller instance
const authController = new AuthController(User);

// Authentication routes
router.post('/login', (req, res) => authController.login(req, res));
router.post('/register', (req, res) => authController.register(req, res));
router.get('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

module.exports = router;