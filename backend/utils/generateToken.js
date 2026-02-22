import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (userId, res) =>
{
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {expiresIn: '5d'});
    
    //lets set the response's cookie now
    res.cookie("jwt", token, {
        maxAge: 86400*5*100,
        httpOnly:true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development",
    });
};

export default generateTokenAndSetCookie;


