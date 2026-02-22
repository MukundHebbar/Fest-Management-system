import { EventsModel, registrationsModel } from '../models/events.model.js';
import organizerModel from '../models/organizer.model.js';
import OrganizerModel from '../models/organizer.model.js'
import UserModel from '../models/user.model.js';

//middle ware has to ensure only organizations have access  to these endpoints
export const getEvents = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Havent authenticated" });
        }
        const userId = req.user._id;
        // 1. Find the organizer profile for this user
        if (!req.orgId) {
            return res.status(401).json({ error: "Not an organizer - something is wrong" });
        }

        const orgId = req.orgId;

        // 2. Find all events where the organizer matches
        const events = await EventsModel.find({ organizer: orgId });
        res.status(200).json(events);
    } catch (error) {
        console.log("some error in the organizer getEvents controller ", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


// the frontend will send a json with any  fields user wants to send 
/** user client will send fields corresponding to schema 
 * for ones where client didnt send anything - we gotta enter as "" as i defined required in schema
*/

export const updateEvents = async (req, res) => { // this does not allow changing status
    const eventId = req.params.id;
    const event = await EventsModel.findById(eventId);
    try {
        if (!event) {
            console.log("Not an event");
            return res.status(400).json({ error: "Event not found" });
        }
        const allFields = [
            'name', 'description', 'eventType', 'eligibility', 'tags',
            'registrationFee', 'registrationLimit', 'registrationDeadline',
            'startDate', 'endDate', 'registrationForm', 'merchandise','TeamEvents'
        ];
        const publishFields = ['description', 'registrationDeadline',
            'registrationLimit',] // closing registration is same as preponing deadline

        const updates = {} // dictionary

        // rn expecting the client to send the all the fields - 
        // as all the fields from the prev version are sent - client has to send thise
        // along with updates as well
        if (event.status == 'Draft') {

            allFields.forEach((field) => { updates[field] = req.body[field] })
            Object.assign(event, updates);
            // save to db
            await event.save()
        }
        else if (event.status == 'Published') {
            const { description, registrationLimit, registrationDeadline, closeRegistration } = req.body;

            // Update description if it's a non-empty string
            if (description && typeof description === 'string' && description.trim().length > 0) {
                event.description = description;
            }

            // Increase registration limit only
            if (registrationLimit && registrationLimit > event.registrationLimit) {
                event.registrationLimit = registrationLimit;
            }

            // Handle deadline updates
            if (closeRegistration) {
                event.registrationDeadline = new Date();
            } else if (registrationDeadline) {
                const newDeadline = new Date(registrationDeadline);
                // Postpone deadline (must be later than current deadline)
                if (newDeadline > event.registrationDeadline) {
                    event.registrationDeadline = newDeadline;
                }
            }
            await event.save();
        }
        return res.status(201).json(event);
    }
    catch (error) {
        console.log("some error in the organizer updateEvents controller ", error);
        res.status(500).json({ error: "Internal server error" });
    }

}


export const publishEvent = async (req, res) => {
    const eventId = req.params.id;
    try {
        const event = await EventsModel.findById(eventId);
        if (!event) {
            console.log("Not an event");
            return res.status(400).json({ error: "Event not found" });
        }
        if (event.status == 'Published' || event.status == 'Ongoing') {
            return res.status(404).json({ error: "Event is already Published" });
        }
        console.log("niggesh ")
        const flag = false;
        const coreFields = [
            'name', 'description', 'eventType', 'eligibility',
            'registrationDeadline', 'startDate', 'endDate',
            'registrationLimit', 'registrationFee', 'tags'
        ];

        const missing = coreFields.filter(field => !event[field]);

        if (event.eventType == 'normal') {
            // check the validity of registration form
            if (!event.registrationForm)
                missing.push("registration Form");
        } 
        else if(event.TeamEvent == true)
        {   
            console.log("Merch event no team");
            return res.status(401).json({ error: "merch events cant be team based" });
        }
        else {
            const merchandise = event.merchandise; // assuming that the browser will send correctly
            if (!merchandise) {
                console.log("Screwed here ")
                missing.push("merchandise form");
            }
        }
        if (missing.length > 0) {
            console.log(event)
            return res.status(401).json({ error: "Some fields are missing", missing: missing })
        }
        event.status = "Published"
        await event.save(); // save as published
        return res.status(201).json(event);
    } catch (error) {

        console.log("Some error in the publishEvent controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }

}


export const createDraft = async (req, res) => {
    try {
        if (!req.orgId) {
            return res.status(401).json({ error: "Unauthorized: Missing organizer ID" });
        }

        if (req.body.eventType == 'merchandise') delete req.body.registrationForm;
        if (req.body.eventType == 'normal') delete req.body.merchandise;

        const eventData = {
            ...req.body, // spread operator - spreads all fields sent
            organizer: req.orgId, // the middleware adds it upon checking the role of the user
            status: 'Draft',
            // Default fields to ensure consistent state
            tags: req.body.tags || [],
        };


        const newEvent = new EventsModel(eventData);


        await newEvent.save();

        res.status(201).json(newEvent);

    } catch (error) {
        if (error.name === 'ReferenceError') {
            console.log("Validation error in createDraft:", error.message);
            return res.status(400).json({ error: error.message });
        }
        console.log("Error in createDraft controller:", req.body, error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const fetchEventAnalysis = async (req, res) => {
    // req params - will give us the event id for analysis
    // right now only basic - event details and registrations
    // will later implement the per participant details fetching as well

    try {
        const event_id = req.params.id;

        const user = await UserModel.findById(req.user._id)

        const event = await EventsModel.findById(event_id).lean();
        if (event.organizer.toString() != req.orgId.toString()) { // had to convert to strings
            return res.status(400).json({ error: "Event not found" })
        }
        // lean lets us add our json fields into event
        if (!event) {
            return res.status(400).json({ error: "Event not found" });
        }
        console.log("====================");
        // this will return the number of registrations for the event, 
        // also returns - revenue - sum of all participation fees 
        // or for merch events - sum of all costs/sales made. 
        if (event.status != "Draft") {
            const registrations = await registrationsModel.countDocuments({ EventId: event._id });
            const fee = event.registrationFee;
            const revenue = fee * registrations;
            event.revenue = revenue;
            event.registrations = registrations;
        }
        return res.status(201).json(event);
    }
    catch (error) {
        console.log("Fetch event analysis controller fucked", error);
        return res.status(400).json({ error: "Internal server Error" });
    }


}

export const requestPasswordReset = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ error: "Reason is required" });
        }
        const organizer = await organizerModel.findById(req.orgId);
        organizer.requestPasswordReset.reason = reason;
        await organizer.save();

        return res.status(201).json({ message: "Password reset request submitted successfully" });

    } catch (error) {

        console.log("Error in requestPasswordReset controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const putOrganizer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, description, category, email } = req.body;
        if (!(name && description && category && email)) {
            return res.status(400).json({ error: "Missing some of the required fields" });
        }

        const organizer = await OrganizerModel.findOne({ user: userId });
        if (!organizer) {
            return res.status(404).json({ error: "Organizer was not found" });
        }
        organizer.name = name;
        organizer.description = description;
        organizer.category = category;
        organizer.email = email

        await organizer.save();

        res.status(200).json(organizer);

    }

    catch (error) {

        console.log("Error in organizer profile update controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export const getOrganizer = async (req, res) => {
    try {

        const userId = req.user._id;
        const organizer = await OrganizerModel.findOne({ user: userId }).lean();
        if (!organizer) {
            return res.status(404).json({ error: "Organizer was not found" });
        }
        organizer.login = req.user.username

        return res.status(201).json(organizer);

    }
    catch (error) {
        console.log("Error in getOrganizer controller", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getEventRegistrations = async (req, res) => {
    try {
        const eventId = req.params.id;
        if (!req.orgId) return res.status(401).json({ error: "Unauthorized" });

        // Verify ownership
        const event = await EventsModel.findById(eventId);
        if (!event || event.organizer.toString() !== req.orgId.toString()) {
            return res.status(403).json({ error: "Unauthorized access to event" });
        }

        // Fetch basic details: ID, Participant Name, Ticket ID
        const registrations = await registrationsModel.find({ EventId: eventId })
            .populate('participantId', 'firstName lastName email')
            .select('_id participantId ticketId createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json(registrations);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getRegistrationDetails = async (req, res) => {
    try {
        const regId = req.params.id;
        if (!req.orgId) return res.status(401).json({ error: "Unauthorized" });

        // Ensure the organizer owns the event associated with this registration
        // Optimization: We could populate EventId and check organizer, or trust that the ID is valid if found
        // For security, let's populate event
        const registration = await registrationsModel.findById(regId).populate('EventId');

        if (!registration) return res.status(404).json({ error: "Registration not found" });

        if (registration.EventId.organizer.toString() !== req.orgId.toString()) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        res.status(200).json(registration);
    } catch (error) {
        console.error("Error fetching registration details:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const getRegistrationFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const { gridfsBucket } = await import('../config/db.js');
        const { ObjectId } = await import('mongodb');

        if (!gridfsBucket) {
            return res.status(500).json({ error: "File service unavailable" });
        }

        const _id = new ObjectId(fileId);
        const downloadStream = gridfsBucket.openDownloadStream(_id);

        downloadStream.on('error', (error) => {
            console.error("GridFS Download Error:", error);
            return res.status(404).json({ error: "File not found" });
        });

        downloadStream.pipe(res);

    } catch (error) {
        console.error("Error streaming file:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const exportRegistrationsCsv = async (req, res) => {
    try {
        const eventId = req.params.id;
        if (!req.orgId) return res.status(401).json({ error: "Unauthorized" });

        const event = await EventsModel.findById(eventId);
        if (!event || event.organizer.toString() !== req.orgId.toString()) {
            return res.status(403).json({ error: "Unauthorized access to event" });
        }

        const registrations = await registrationsModel.find({ EventId: eventId })
            .populate({
                path: 'participantId',
                select: 'firstName lastName user',
                populate: { path: 'user', select: 'username' }
            })
            .select('_id participantId ticketId createdAt')
            .sort({ createdAt: -1 });

        // Build CSV
        const header = 'Registration ID,First Name,Last Name,Username,Ticket ID,Registration Date\n';
        const rows = registrations.map(reg => {
            const firstName = reg.participantId?.firstName || '';
            const lastName = reg.participantId?.lastName || '';
            const username = reg.participantId?.user?.username || '';
            const ticketId = reg.ticketId || '';
            const date = reg.createdAt ? new Date(reg.createdAt).toISOString() : '';
            return `${reg._id},${firstName},${lastName},${username},${ticketId},${date}`;
        }).join('\n');

        const csv = header + rows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=registrations_${eventId}.csv`);
        res.status(200).send(csv);

    } catch (error) {
        console.error("Error exporting CSV:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// marking attendance- 
// marking attendance via Qr or ticket id , marking attendance manually
// override - unmarking attendance for an event by the organizer. 
export const manageAttendance = async (req , res) => {
// mark a registration as attended
    try {
        const regId = req.params.regId; 
        const action= req.params.action; // boolean value - mark or unmark attendance
        const registration = await (registrationsModel.findById(regId))?.populate("EventId");

        if(!registration || registration.EventId._id != req.orgId)
        {
            return res.status(401).json({error:"Registration Not found"});
        } 

        registration.attended = action; 
        
        await registration.save();
        
        return res.status(201).json(registration);
    }
     catch(error)
     {
        console.log("something is wrong with attendance controller", error);
        return res.status(500).json({error:"Internal Server Error"});
     }
}