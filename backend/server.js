import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import cookieParser from 'cookie-parser'
import authRoutes from "./routes/auth.routes.js";
import { protectRoute, authorize } from "./middleware/auth.middleware.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import ParticipantRoutes from "./routes/participant.routes.js"
import meRoute from "./routes/me.routes.js";
import cors from 'cors';
import OrganizerRoutes from "./routes/organizer.routes.js"
import adminRoutes from "./routes/admin.routes.js"
dotenv.config()

const app = express()

app.use(cors({
    origin: "http://localhost:5173", // Allow only your frontend
    credentials: true                // Required to allow cookies/JWT
}));

app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);

// protected routes

app.use("/api/me", protectRoute, meRoute);
app.use("/api/participants", protectRoute, authorize("participant"), ParticipantRoutes);

app.use("/api/organizers", protectRoute, authorize("organizer"), OrganizerRoutes);
app.use("/api/admin", protectRoute, authorize("admin"), adminRoutes);
app.get("/", (req, res) => {
    res.send("Server is ready")

})

//console.log(process.env.MONGO_URI)

app.listen(5000, () => {

    connectDB();
    console.log("Hello there - started listening on port 5000\n");


})