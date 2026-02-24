import express from 'express';
import { addOrganization, removeOrganization, resetPassword, rejectResetRequest, viewResetRequests, getAllOrganizers } from '../controllers/admin.controller.js';
import { getNonDraftEvents, getEventById } from '../controllers/participant.controller.js';

const router = express.Router();

router.get("/createOrg", addOrganization);
router.get("/organizers", getAllOrganizers);
router.get("/resetRequests", viewResetRequests);
router.get("/events", getNonDraftEvents);
router.get("/events/:id", getEventById);
router.get("/:id/reset", resetPassword);
router.patch("/:id/reject", rejectResetRequest);
router.delete("/:id/remove", removeOrganization);

export default router;