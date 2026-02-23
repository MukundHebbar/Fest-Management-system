import express from 'express';
import { addOrganization, resetPassword, viewResetRequests, getAllOrganizers } from '../controllers/admin.controller.js';
import { getNonDraftEvents, getEventById } from '../controllers/participant.controller.js';

const router = express.Router();

router.get("/createOrg", addOrganization);
router.get("/organizers", getAllOrganizers);
router.get("/resetRequests", viewResetRequests);
router.get("/events", getNonDraftEvents);
router.get("/events/:id", getEventById);
router.get("/:id/reset", resetPassword);

export default router;