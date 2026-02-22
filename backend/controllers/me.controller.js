import UserModel from "../models/user.model.js";


 
export const getMe = async (req, res) => {
    try{
        if(!(req.user))
        {
            res.status(400).json({error:"Havent authenticated"});
        } 
        else {
        const user = await UserModel.findById(req.user._id).select("-passwordHash");
        res.status(200).json(user); 
        }
    } 
    catch(error)
    {   
        console.log("Error in the getMe controller func", error);
        res.status(500).json({error:"Internal server error"});
    }
}