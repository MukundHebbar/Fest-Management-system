import mongoose from 'mongoose';
import crypto from 'crypto'
// this stores drafts and publications of events by various organizers
// there will be a separate collection for registrations


const eventsSchema = new mongoose.Schema({
 
 name: {
    type: String,
    required: true,
    trim: true
  },
description: {
    type: String,
    
  },
eventType: {
    type: String,
    enum: ["normal", "merchandise"]
  }, 
  TeamEvent:{ // controller needs to verify that only normal teams can be Team based
    type:Boolean,
    default:false    
  },
eligibility: {
    type: String
  },
tags: [{
    type: String,
    trim: true
  }],
organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizer",
    required: true
  }, 
  status:{ 
    type:String,
    required:true,
    enum:["Draft", "Published","Ongoing","Closed"]
  },
registrationFee: {
    type: Number,
    min: 0,
    default: 0
  },
registrationLimit: {
    type: Number,
    min: 1
  },
  // gotta add - number of participants registered
  registeredCount:{
    type:Number,
    default:0,
    min:0
  },
 registrationDeadline: {
    type: Date,

  },

  startDate: {
    type: Date,

  },

  endDate: {
    type: Date,

  },

  // we will use only if eventType === "normal"
  registrationForm: [
  {
    label: { type: String},
    type: { 
      type: String, 
      enum: ['text', 'dropdown', 'checkbox', 'file'], // Defined in source 
      required: true 
    },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] } // Only used for dropdowns
  }
] 
  ,

  // wil be used only if eventType === "merchandise"
  merchandise: {
    items: 
      {
        name: { type: String },

        variants: [
          {
            size: String,
            color: String,
            stock: { type: Number, min: 0 }
          }
        ]
      }
    ,

    purchaseLimitPerParticipant: {
      type: Number,
      min: 1
    }
  },
  

  createdAt: {
    type: Date,
    default: Date.now
  }
});

 export const EventsModel = mongoose.model('Event', eventsSchema);


 // we will make one more called registrations that will refer to Events and participants

const tags_schema = new mongoose.Schema({
    tag:{
        type:String,
        required:true,
        trim:true,
        unique:true,
    }
}) 

export const TagsModel = mongoose.model('Tag', tags_schema, 'tag');


export const registrations_schema = new mongoose.Schema({
  participantId:{
    required:true,
    type:mongoose.Schema.Types.ObjectId,
    ref:"Participant"
  }, 
  EventId:{
    required:true,
    type:mongoose.Schema.Types.ObjectId,
    ref:"Event"
  } ,
  teamId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Team"
  }
  ,
  eventType:{
    type:String,
    required:true,
  }, 

  attended:{
    type:Boolean,
    default:false
  },
  ticketId:{
    type:String, unique:true,
    default: () => crypto.randomBytes(3).toString('hex').toUpperCase()
    // very unlikely that two randomly generated 6 letter ids will collide
    
    // not going to add this in the controller
  },
  // the qr code is not a part of the schema - frontend generates it based on ticketId automaitaclly 

  formResponse:{
     type: mongoose.Schema.Types.Mixed
  } 
  , 
    // wont use an array here - each item bought is a registration
  merchandise:{
    items:
      {
       name: { type: String},

        variants: 
          {
            size: String,
            color: String,
            stock: { type: Number, min: 0 }
          }
    
  }  
    
}, 
  createdAt:{
  type:Date,
  default: Date.now
}   
}); 

export const registrationsModel = mongoose.model('Registration', registrations_schema, 'registrations');

const teams_schema = new mongoose.Schema({
  teamName:{
    required:true,
    type:String
  }, 
  capacity:{
    required:true,
    type:Number,
    min:2,
    max:5    // implicit constraint that team size <= 5 always
  }, 
  currentLength:{
    type:Number,
    default:0
  }, 
  teamLeader:{
    required:true,
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  }, 
  teamCode:{ // functions as the team joining code - controller must verify this for member reg
    type:String, unique:true,
    default: () => crypto.randomBytes(3).toString('hex').toUpperCase()
    // very unlikely that two randomly generated 6 letter ids will collide
    // not going to add this in the controller
  },
}); 

export const teamsModel = mongoose.model('Team', teams_schema);