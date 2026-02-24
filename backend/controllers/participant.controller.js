import UserModel from '../models/user.model.js'
import ParticipantModel from '../models/participant.model.js';
import OrganizerModel from '../models/organizer.model.js';
import { TagsModel, registrationsModel, EventsModel, teamsModel } from '../models/events.model.js';
import { sendTicketEmail } from '../utils/mailer.js';

export const fetchMe = async (req, res) => {
    try {
        const userId = req.user._id;
        const participant = await ParticipantModel.findOne({ user: userId })
            .populate('followingOrganizations', 'name');

        if (!participant) {
            return res.status(401).json({ error: "Participant profile not found" });
        }
        const all_tags = await TagsModel.find().lean();
        const all_clubs = await OrganizerModel.find().select('name').lean();
        res.status(200).json({ participant, all_tags, all_clubs });
    } catch (error) {
        console.log("twas an Error in fetchMe controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const putMe = async (req, res) => {
    try {
        const userId = req.user._id;
        const { firstName, lastName, orgName, contactNumber } = req.body;
        if (!(firstName && lastName && orgName && contactNumber)) {
            return res.status(400).json({ error: "Missing some of the required fields" });
        }

        const participant = await ParticipantModel.findOne({ user: userId });
        if (!participant) {
            return res.status(404).json({ error: "Participant was not found" });
        }
        participant.firstName = firstName;
        participant.lastName = lastName;
        participant.orgName = orgName;
        participant.contactNumber = contactNumber;

        await participant.save();

        res.status(200).json(participant);

    } catch (error) {
        console.log("twas an Error in putMe controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const putMyInterests = async (req, res) => {
    try {
        const userId = req.user._id;
        const { tags } = req.body;

        if (!tags || !Array.isArray(tags)) {
            return res.status(400).json({ error: "Interests/Tags must be provided as an array" });
        }

        const participant = await ParticipantModel.findOne({ user: userId });
        if (!participant) {
            return res.status(404).json({ error: "Participant not found" });
        }

        participant.tags = tags;
        await participant.save();

        res.status(200).json(participant);

    } catch (error) {
        console.log("Error in putMyInterests controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const putMyOrganizations = async (req, res) => {
    try {
        const userId = req.user._id;
        const { followingOrganizations } = req.body;

        if (!followingOrganizations || !Array.isArray(followingOrganizations)) {
            return res.status(400).json({ error: "following organizations must be an array of organization names" });
        }


        const validOrganizers = await OrganizerModel.find({ name: { $in: followingOrganizations } });
        const validOrganizerIds = validOrganizers.map(org => org._id);

        const participant = await ParticipantModel.findOne({ user: userId });
        if (!participant) {
            return res.status(404).json({ error: "Participant not found" });
        }

        participant.followingOrganizations = validOrganizerIds;
        await participant.save();

        res.status(200).json(participant);

    } catch (error) {
        console.log("Error in putMyOrganizations controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const uploadFilesToGridFS = async (files) => {
    const { gridfsBucket } = await import('../config/db.js');
    const { Readable } = await import('stream');

    if (!gridfsBucket) {
        throw new Error("File upload service unavailable"); // code is only wrong if it happens
    }


    const uploadPromises = files.map(file => {
        return new Promise((resolve, reject) => {
            const filename = `${Date.now()}-${file.originalname}`;


            const readableStream = Readable.from(file.buffer);


            const uploadStream = gridfsBucket.openUploadStream(filename, {
                contentType: file.mimetype
            });


            readableStream.pipe(uploadStream)
                .on('error', (error) => {
                    console.error("Stream error:", error);
                    reject(error);
                })
                .on('finish', () => {
                    resolve({ fieldname: file.fieldname, id: uploadStream.id });
                });
        });
    });

    return await Promise.all(uploadPromises);
};

const handleTeamRegistration = async (req, event) => {
    const joinTeam = req.body.joinTeam;
    let createTeam = req.body.createTeam;


    if (typeof createTeam === 'string') {
        try { createTeam = JSON.parse(createTeam); } catch (e) { createTeam = null; }
    }

    if (joinTeam && event.TeamEvent) {

        const team = await teamsModel.findOne({ teamCode: joinTeam });
        if (!team) {
            throw { status: 404, message: "Team not found" };
        }

        if (team.currentLength >= team.capacity) {
            throw { status: 400, message: "Team is full" };
        }
        team.currentLength += 1;
        await team.save();
        return team._id;
    }
    else if (createTeam && event.TeamEvent) {

        const { teamName, capacity } = createTeam;
        if (!teamName || !capacity) {
            throw { status: 400, message: "Team name and capacity are required" };
        }
        if (capacity < 2 || capacity > 5) {
            throw { status: 400, message: "Team capacity must be between 2 and 5" };
        }
        const team = new teamsModel({
            teamName,
            capacity,
            currentLength: 1,
            teamLeader: req.user._id
        });
        await team.save();
        return team._id;
    }
    else if (event.TeamEvent) {
        throw { status: 400, message: "Team events require either creating or joining a team" };
    }

    return null;
};


const handleFormResponse = async (req, event) => {
    if (!event.registrationForm) return null;

    let responses = {};


    if (req.body.formResponse) {
        try {
            responses = JSON.parse(req.body.formResponse);
        } catch (e) {
            console.error("Error parsing formResponse:", e);
            throw { status: 400, message: "Invalid form response format" };
        }
    }


    if (req.files && req.files.length > 0) {
        try {
            const uploadedFiles = await uploadFilesToGridFS(req.files);
            uploadedFiles.forEach(f => {
                responses[f.fieldname] = f.id;
            });
        } catch (uploadError) {
            console.error("Upload failed:", uploadError);
            throw { status: 500, message: "Failed to upload files" };
        }
    }

    for (const field of event.registrationForm) {

        const val = responses[field.label];
        if (field.required) {
            if (val === undefined || val === null || val === '') {
                throw { status: 400, message: `Field '${field.label}' is required` };
            }
        }
    }

    return responses;
};


const handleMerchandiseRegistration = (req, event) => {
    if (!event.merchandise)
        throw { status: 400, message: "No merch selection" };

    const requestedVariant = req.body.merchandise.items.variants;
    const availableVariants = event.merchandise.items.variants;

    const targetVariant = availableVariants.find(v =>
        v.size === requestedVariant.size && v.color === requestedVariant.color
    );

    if (!targetVariant) {
        throw { status: 400, message: "Variant not found" };
    }

    if (targetVariant.stock <= 0) {
        throw { status: 400, message: "Out of stock" };
    }


    targetVariant.stock -= 1;

    return {
        items: {
            name: event.merchandise.items.name,
            variants: {
                size: targetVariant.size,
                color: targetVariant.color,
                stock: targetVariant.stock
            }
        }
    };
};

export const registerForEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const participant = await ParticipantModel.findOne({ user: req.user._id });

        if (!participant) {
            return res.status(404).json({ error: "Participant profile not found" });
        }


        const event = await EventsModel.findById(eventId);

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        if (event.status !== 'Published' && event.status !== 'Ongoing') {
            return res.status(400).json({ error: "Event is not open for registration" });
        }

        if (event.registrationLimit && event.registeredCount >= event.registrationLimit) {
            return res.status(400).json({ error: "Registration limit reached" });
        }

        if (event.registrationDeadline && new Date() > event.registrationDeadline) {
            return res.status(400).json({ error: "Registration deadline has passed" });
        }


        if (event.eligibility === 'Y' && participant.type !== 'Y') {
            return res.status(403).json({ error: "This event is restricted to IIIT-H students only" });
        }

        const registrationData = {
            participantId: participant._id,
            EventId: event._id,
            eventType: event.eventType
        };

        if (event.eventType === 'normal') {

            const registeredForEvent = await registrationsModel.findOne({ EventId: event._id, participantId: participant._id });
            if (registeredForEvent) {
                return res.status(400).json({ error: "Already registered" });
            }

            const teamId = await handleTeamRegistration(req, event);
            if (teamId) {
                registrationData.teamId = teamId;
                registrationData.status = false;
            }

            const formResponse = await handleFormResponse(req, event);
            if (formResponse) registrationData.formResponse = formResponse;

        } else if (event.eventType === 'merchandise') {

            const limit = event.merchandise.purchaseLimitPerParticipant;
            const bought = await registrationsModel.countDocuments({ EventId: eventId, participantId: participant._id });

            if (limit <= bought)
                return res.status(400).json({ error: "Cannot buy more" });

            registrationData.merchandise = handleMerchandiseRegistration(req, event);
        }

        event.registeredCount += 1;
        await event.save();

        const newRegistration = new registrationsModel(registrationData);
        await newRegistration.save();

        participant.registered.push(newRegistration._id);
        await participant.save();

        const organizer = await OrganizerModel.findById(event.organizer).select('name');
        const orgName = organizer?.name || 'Unknown';

        const responseData = { message: "Registered successfully", registration: newRegistration };
        if (newRegistration.teamId) {
            const team = await teamsModel.findById(newRegistration.teamId).select('teamCode teamName capacity currentLength');
            if (team) {
                responseData.team = { teamCode: team.teamCode, teamName: team.teamName };

                if (team.currentLength >= team.capacity) {
                    await registrationsModel.updateMany(
                        { teamId: team._id },
                        { $set: { status: true } }
                    );

                    const teamRegs = await registrationsModel.find({ teamId: team._id }).populate('participantId');
                    for (const reg of teamRegs) {
                        const user = await UserModel.findById(reg.participantId?.user);
                        if (user) {
                            try {
                                sendTicketEmail(user.username, event.name, reg.ticketId, orgName, event.startDate, event.endDate);
                            } catch (error) {
                                console.log("Error in sending mail", error);
                            }
                        }
                    }
                }
            }
        } else {
            const user = await UserModel.findById(req.user._id);
            if (user) {
                try {
                    sendTicketEmail(user.username, event.name, newRegistration.ticketId, orgName, event.startDate, event.endDate);
                }
                catch (error) {
                    console.log("Mailing error ", error);
                }
            }
        }

        res.status(201).json(responseData);
    }
    catch (error) {

        if (error.status) {
            return res.status(error.status).json({ error: error.message });
        }
        console.log("Error in registerForEvent controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getNonDraftEvents = async (req, res) => {
    try {
        const events = await EventsModel.find({ status: { $ne: 'Draft' } })
            .populate('organizer', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(events);
    } catch (error) {
        console.log("Error in getNonDraftEvents controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAllClubs = async (req, res) => {
    try {
        const clubs = await OrganizerModel.find().select('name email category description').lean();
        res.status(200).json(clubs);
    } catch (error) {
        console.log("Error in getAllClubs controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getEventById = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await EventsModel.findById(eventId).populate('organizer', 'name email').lean();

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        if (event.status === 'Draft') {
            return res.status(404).json({ error: "Event not found" });
        }


        if (event.TeamEvent && req.participantId) {
            const myReg = await registrationsModel.findOne({
                EventId: eventId,
                participantId: req.participantId
            });

            if (myReg?.teamId) {
                const team = await teamsModel.findById(myReg.teamId);


                const teamRegs = await registrationsModel.find({ teamId: myReg.teamId })
                    .populate({
                        path: 'participantId',
                        select: 'firstName lastName'
                    });

                const members = teamRegs
                    .map(r => `${r.participantId.firstName} ${r.participantId.lastName}`)
                    .filter(Boolean);

                event.teamInfo = {
                    teamName: team.teamName,
                    teamCode: team.teamCode,
                    members
                };
            }
        }

        res.status(200).json(event);
    } catch (error) {
        console.log("Error in getEventById controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMyRegistrations = async (req, res) => {

    try {
        const participantId = req.participantId;
        const registrations = await registrationsModel.find({ participantId: participantId })
            .populate({
                path: 'EventId',
                populate: { path: 'organizer', select: 'name email' }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json(registrations);


    }
    catch (error) {
        console.log("Error in get registrations controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}