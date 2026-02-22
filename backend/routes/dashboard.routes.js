import express from 'express';
import {protectRoute} from '../middleware/auth.middleware.js';

const router = express.Router();

// we ll just apply the middleware in server - with app.use right before 
// importing this in server.js
router.get("/dashboard", (req, res) => {
    res.json({message:"Participant Authenticated and arrived at dashboard", user:req.user});

});

export default router; 
