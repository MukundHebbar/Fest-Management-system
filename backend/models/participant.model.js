import mongoose from 'mongoose';

const user_schema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true   // ensures 1–1 mapping
        },

        firstName: {
            required: true,
            type: String
        },
        lastName: {
            required: true,
            type: String
        },
        type: {   // yes implies IIIT student
            required: true,
            type: String,
            enum: ["Y", "N"]
        },
        orgName: {
            required: true,
            type: String,   // front end must send orgname as IIITH for our students
        },
        contactNumber: {
            required: true,
            type: String,
        },
        followingOrganizations: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organizer"
        }],

        // list of possible tags are stored in the database - check events.model.js . 
        tags: [{ // tags selected by  the user for areas of interest. 
            type: "String",
        }], // here the backend must check before adding if the tags are valid or not

        registered: [ // should probably change this to point to registrations
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Registration",
            }
        ]
    });

const ParticipantModel = mongoose.model('Participant', user_schema);

export default ParticipantModel;
