import multer from 'multer';

// Use memory storage to access file buffers in the controller
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
