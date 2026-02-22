import express from 'express';
import { addOrganization, resetPassword } from '../controllers/admin.controller.js';

const router = express.Router();

router.get("/createOrg", addOrganization);
router.get("/:id/reset", resetPassword);

export default router;