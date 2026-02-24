import mongoose from 'mongoose';


const organizer_schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true   // ensures 1–1 mapping
    },
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
    },
    category: {
        type: String
        // probably will add an enum to this
    },
    email: {  // this is contact email - initially same as login email organizer needs to change
        type: String,
        required: true
    },

    resetRequest: {
        reason: { type: String, default: null },
    },
    resetHistory: [{
        reason: { type: String, required: true },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        requestedAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date },
    }]
})
const OrganizerModel = mongoose.model('Organizer', organizer_schema);
export default OrganizerModel;



