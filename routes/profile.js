const express = require('express');
const router = express.Router();
const { upload, processImage } = require('../middleware/fileUpload');
const db = require('../config/sqliteConn');
const path = require('path');

// Erstatt JWT-verifisering med en sessjonssjekk
router.use((req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
});

// Get profile data
router.get('/', async (req, res) => {
    try {
        // Bruk session.user.id i stedet for userId fra JWT
        const userId = req.session.user.id;
        const user = await db.get('SELECT id, username, name, email, role, department, profile_image FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile data' });
    }
});

// Upload profile image
router.post('/upload-image', upload.single('profileImage'), processImage, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Bruk session.user.id i stedet for userId fra JWT
        const userId = req.session.user.id;
        const imagePath = '/' + req.file.path.replace(/\\/g, '/'); // Normalize path for web use
        
        // Update user's profile image in database
        await db.run('UPDATE users SET profile_image = ? WHERE id = ?', [imagePath, userId]);
        
        res.json({
            success: true,
            message: 'Profile image uploaded successfully',
            imagePath
        });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({ message: 'Error uploading profile image' });
    }
});

// Delete profile image
router.delete('/delete-image', async (req, res) => {
    try {
        // Bruk session.user.id i stedet for userId fra JWT
        const userId = req.session.user.id;
        
        // Get current profile image
        const user = await db.get('SELECT profile_image FROM users WHERE id = ?', [userId]);
        
        if (user && user.profile_image) {
            const imagePath = path.join(__dirname, '../public', user.profile_image);
            
            // Delete file if it exists
            if (require('fs').existsSync(imagePath)) {
                require('fs').unlinkSync(imagePath);
            }
            
            // Update user record
            await db.run('UPDATE users SET profile_image = NULL WHERE id = ?', [userId]);
        }
        
        res.json({ success: true, message: 'Profile image deleted successfully' });
    } catch (error) {
        console.error('Error deleting profile image:', error);
        res.status(500).json({ message: 'Error deleting profile image' });
    }
});

// Update profile information
router.put('/', async (req, res) => {
    try {
        // Bruk session.user.id i stedet for userId fra JWT
        const userId = req.session.user.id;
        const { name, email, department } = req.body;
        
        // Validate inputs
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }
        
        // Update user record
        await db.run(
            'UPDATE users SET name = ?, email = ?, department = ? WHERE id = ?',
            [name, email, department, userId]
        );
        
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

module.exports = router;
