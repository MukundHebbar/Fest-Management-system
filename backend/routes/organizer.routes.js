import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';

import {
    getEvents, updateEvents, createDraft, publishEvent, fetchEventAnalysis
    , requestPasswordReset, putOrganizer,
    getOrganizer, getEventRegistrations, getRegistrationDetails, getRegistrationFile, exportRegistrationsCsv,
    manageAttendance
} from '../controllers/organizer.controller.js'
//this defines events and organizer routes
// the events endpoints are specifically for organizers
// for participants we will have a separate one
const router = express.Router();



router.get("/events", getEvents);
router.get("/organizer", getOrganizer);
router.get("/events/:id/stats", fetchEventAnalysis);
router.get("/events/:id/registrations", getEventRegistrations);
router.get("/registrations/:id", getRegistrationDetails);
router.get("/registrations/file/:id", getRegistrationFile);
router.get("/events/:id/registrations/csv", exportRegistrationsCsv);

router.post("/events", createDraft); // a draft has to be created for an event
// before publication of the event.
router.post("/events/:id/publish", publishEvent); // publish an event after drafted


router.post("/reset", requestPasswordReset);

router.put("/profile", putOrganizer);
router.put("/events/:id", updateEvents); // updates an event with edits based on publish or draft    

router.patch("/events/attend/:regId/:action", manageAttendance);
router.patch("/events/:eventId/attend-ticket/:ticketId", manageAttendance);

router.patch("/events/:id/status", (req, res) => {
    console.log("doesnt work");
    res.status(400).json({ error: "Not implemented gendu" })
});  // change status from published/ongoing to something else

export default router;