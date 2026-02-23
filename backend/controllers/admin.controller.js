import UserModel from "../models/user.model.js";
import OrganizerModel from "../models/organizer.model.js";
import { autoGenerateCredentials, autoGenPassword } from "../utils/credentials.js";

export const addOrganization = async (req, res) => {
    // admin client makes a request to create organizer- 
    // system responds with auto generated email and password

    try {
        // first we create the user entry in the users collection
        const orgCount = await OrganizerModel.countDocuments();

        // we ll make an increment - to avoid zero indexing
        const { email, password, passwordHash } = await autoGenerateCredentials(orgCount + 1);

        const newUser = new UserModel({
            username: email,
            passwordHash: passwordHash,
            role: "organizer"
        });

        const savedUser = await newUser.save();

        const newOrganizer = new OrganizerModel({
            user: savedUser._id,
            name: "organization", // Generic name as requested
            email: email,
            // category and description empty initially
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
    ;
    //make use of url parameter to get organizer id to be deleted - 
    // this will be for a delete method

}

export const getAllOrganizers = async (req, res) => {
    try {
        const organizers = await OrganizerModel.find().lean();
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