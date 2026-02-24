import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

import {
    fetchMe, putMe, putMyInterests, putMyOrganizations, registerForEvent,
    getNonDraftEvents, getEventById, getMyRegistrations, getAllClubs
} from '../controllers/participant.controller.js';



const router = express.Router();

// we ll just apply the middleware in server - with app.use right before 
// importing this in server.js




router.get("/me", fetchMe); // just fetches all participant details except - registered events

router.put("/me", putMe
    // lets me edit personal account details 
);

router.put("/me/tags", putMyInterests);
router.put("/me/organizations", putMyOrganizations);


router.post("/register/:id", upload.any(), registerForEvent);

router.get("/events", getNonDraftEvents);
router.get("/clubs", getAllClubs);
router.get("/events/:id", getEventById);
router.get("/registrations", getMyRegistrations);

export default router; 