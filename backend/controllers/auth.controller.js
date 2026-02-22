import UserModel from '../models/user.model.js'
import ParticipantModel from '../models/participant.model.js';
import bcrypt from 'bcryptjs';
import generateTokenAndSetCookie from '../utils/generateToken.js'; 

// to be specific this is only for participant signup. 
export const signup = async (req, res) => {
    try {
        const { username, password, firstName, lastName, type, orgName,
            contactNumber
        } = req.body;

        if (!(username && password && firstName && lastName && type
            && orgName && contactNumber)) {
            return res.status(400).json({ error: "Missing requried Fields" });
        }
        const user = await UserModel.findOne({ username: username });
        if (user) {   // user already exists bro
            return res.status(400).json({ error: "Email/Username already exists" });
        }   

        if(type == "Y")
        {   if((!(username.endsWith("iiit.ac.in"))) || orgName != "IIITH")
            return res.status(400).json({error:"IIIT Student needs IIIT email"});
        } 

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new UserModel({
            username,
            passwordHash: hashedPassword,
            role: "participant" // right now this is default
        });
        // assuming newUser has been created by now
        generateTokenAndSetCookie(newUser._id, res);

        await newUser.save();

        const newParticipant = new ParticipantModel({
            user: newUser._id,
            firstName,
            lastName,
            orgName,
            contactNumber,
            type
        });
        await newParticipant.save();

        res.status(201).json({
            _id: newUser._id,
            username: newUser.username,
            role: newUser.role
        });


    }
    catch (error) {
        //cooked
        console.log("Signup in authcontroller is not working", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
    // the signup requires preferred
}

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userInDb = await UserModel.findOne({ username });

        if (!userInDb)
            return res.status(401).json({ error: `This User doesn't exist` });

        const correctPassword = userInDb.passwordHash;
        const passwordMatched = await bcrypt.compare(password, correctPassword);

        if (!passwordMatched)
            return res.status(400).json({ error: `Please enter the correct Password` });

        generateTokenAndSetCookie(userInDb._id, res);
        res.status(200).json({
            _id: userInDb._id,
            username: userInDb.username,
            role: userInDb.role,
        });
    }
    catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {
            maxAge: 0, httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development",
        });
        res.status(200).json({ message: "Log out completed successfully" });

    }
    catch (error) {
        console.log("Unable to logout - check controller", error.message);
        res.status(500).json({ error: "Internal Server died" });
    }
};


