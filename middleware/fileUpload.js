const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Ensure upload directories exist
const profileUploadDir = path.join(__dirname, '../public/uploads/profile');
const tempUploadDir = path.join(profileUploadDir, 'temp');

if (!fs.existsSync(profileUploadDir)) {
    fs.mkdirSync(profileUploadDir, { recursive: true });
}
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Define storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with UUID
        const uniqueFileName = `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueFileName);
    }
});

// File type validation
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and WebP images are allowed.'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Process image after upload
const processImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const tempFilePath = req.file.path;
        const outputFilename = req.file.filename;
        const outputPath = path.join(profileUploadDir, outputFilename);

        // Process image with sharp - resize and optimize
        await sharp(tempFilePath)
            .resize({
                width: 300,
                height: 300,
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 80 }) // Optimize quality
            .toFile(outputPath);

        // Update file path in request
        req.file.path = path.relative(path.join(__dirname, '../public'), outputPath);
        req.file.processedPath = outputPath;

        // Clean up temp file
        fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });

        next();
    } catch (error) {
        console.error('Error processing image:', error);
        next(error);
    }
};

module.exports = { upload, processImage };
