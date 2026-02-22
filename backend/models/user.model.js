import mongoose from 'mongoose';

const  user_schema = new mongoose.Schema (
    {
        username:{  // the same as email
            type:String,
            required:true,
            unique:true
        }, 
        passwordHash: {
            type:String,
            required:true
        }, 
        role:{
            type:String,
            required:true,
            enum: ["participant", "organizer", "admin"]
        }
        
    }
) 

    const UserModel = mongoose.model('User', user_schema);
            
    export default UserModel; 
