import UserModel from "../models/user.model.js";
import OrganizerModel from "../models/organizer.model.js";
import { EventsModel, registrationsModel, teamsModel } from "../models/events.model.js";
import { autoGenerateCredentials, autoGenPassword } from "../utils/credentials.js";

export const addOrganization = async (req, res) => {
    try {
        const orgCount = await OrganizerModel.countDocuments();
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); //hopefully we dont collide
        const { email, password, passwordHash } = await autoGenerateCredentials(orgCount + randomSuffix);

        const newUser = new UserModel({
            username: email,
            passwordHash: passwordHash,
            role: "organizer"
        });

        const savedUser = await newUser.save();

        const newOrganizer = new OrganizerModel({
            user: savedUser._id,
            name: "organization",
            email: email,
        });

        await newOrganizer.save();

        return res.status(201).json({
            message: "Organization created successfully",
            credentials: {
                username: email,
                password: password
            }
        });

    } catch (error) {
        console.log("An error in the admin add org controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


export const removeOrganization = async (req, res) => {
    try {
        const orgId = req.params.id;
        const organizer = await OrganizerModel.findById(orgId);
        if (!organizer) {
            return res.status(404).json({ error: "Organizer not found" });
        }


        const events = await EventsModel.find({ organizer: orgId }).select('_id');
        const eventIds = events.map(e => e._id); // i want an array with event ids for this guy


        const teamIds = await registrationsModel.distinct('teamId', {
            EventId: { $in: eventIds },
            teamId: { $ne: null }
        });


        if (teamIds.length > 0) {
            await teamsModel.deleteMany({ _id: { $in: teamIds } });
        }


        if (eventIds.length > 0) {
            await registrationsModel.deleteMany({ EventId: { $in: eventIds } });
        }


        await EventsModel.deleteMany({ organizer: orgId });


        await OrganizerModel.findByIdAndDelete(orgId);


        await UserModel.findByIdAndDelete(organizer.user);

        return res.status(200).json({ message: "Organizer and all related data deleted" });
    } catch (error) {
        console.log("Error in admin removeOrganization controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getAllOrganizers = async (req, res) => {
    try {
        const organizers = await OrganizerModel.find().lean(); // might have to attach something to this
        return res.status(200).json(organizers);
    } catch (error) {
        console.log("Error in admin getAllOrganizers controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const viewResetRequests = async (req, res) => {
    try {
        const organizers = await OrganizerModel.find({
            "resetRequest.reason": { $nin: [null, ""] }
        }).lean();

        return res.status(200).json(organizers);

    }
    catch (error) {
        console.log("Error in admin viewResetRequests controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const orgId = req.params.id;
        const organizer = await OrganizerModel.findById(orgId);
        if (!organizer.resetRequest.reason) {
            return res.status(400).json({ error: "Did not request a reset" });
        }

        const user = await UserModel.findById(organizer.user);
        const { password, passwordHash } = await autoGenPassword();


        const pendingEntry = organizer.resetHistory.find(r => r.status === 'Pending');
        if (pendingEntry) {
            pendingEntry.status = 'Approved';
            pendingEntry.resolvedAt = new Date();
        }

        organizer.resetRequest.reason = null;
        user.passwordHash = passwordHash;

        await user.save();
        await organizer.save();

        return res.status(200).json({ message: "Password reset successful", newPassword: password });

    }
    catch (error) {
        console.log("Error in admin resetPassword controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const rejectResetRequest = async (req, res) => {
    try {
        const orgId = req.params.id;
        const organizer = await OrganizerModel.findById(orgId);
        if (!organizer.resetRequest.reason) {
            return res.status(400).json({ error: "No pending request" });
        }

        const pendingEntry = organizer.resetHistory.find(r => r.status === 'Pending');
        if (pendingEntry) {
            pendingEntry.status = 'Rejected';
            pendingEntry.resolvedAt = new Date();
        }

        organizer.resetRequest.reason = null;
        await organizer.save();

        return res.status(200).json({ message: "Request rejected" });
    } catch (error) {
        console.log("Error in admin rejectResetRequest controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}