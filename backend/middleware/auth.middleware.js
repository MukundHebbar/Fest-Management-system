import jwt from 'jsonwebtoken'
import UserModel from '../models/user.model.js';
import OrganizerModel from '../models/organizer.model.js';
import ParticipantModel from '../models/participant.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized Access No jwt Token" });

        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) // cooked, detected request response json tampering
        {
            return res.status(401).json({ error: "Unauthorized Access - Invalid jwt Token" });

        }

        const user = await UserModel.findById(decoded.userId).select("-passwordHash")
        if (!user) {
            return res.status(401).json({ error: "User does not exist" });
        }
        req.user = user; // attach user to the request object

        if (user.role == 'organizer') {
            const userId = user._id;
            // 1. Find the organizer profile for this user
            const organizer = await OrganizerModel.findOne({ user: userId });
            if (!organizer) {
                return res.status(404).json({ error: "Organizer not found - role mismatch" });
            }
            req.orgId = organizer._id
        } 
        else if(user.role == 'participant')
        {
             const userId = user._id;
            // 1. Find the organizer profile for this user
            const participant = await ParticipantModel.findOne({ user: userId });
            if (!participant) {
                return res.status(404).json({ error: "Participant not found - role mismatch" });
            }
            req.participantId = participant._id;
        }
        next();
    }
    catch (error) {
        console.log("Error occured in protectroute middleware", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }

};


export const authorize = (roles) => {
    return (req, res, next) => {
        const present = roles == req.user.role;
        if (!present) {
            return res.status(403).json({ error: "User does not have access scope for this route" });

        }
        next();
    }
}