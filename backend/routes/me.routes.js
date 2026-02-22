import express from 'express';
import  {getMe}  from "../controllers/me.controller.js";

const router = express.Router();

router.get("/", getMe);

export default router;