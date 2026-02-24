import jwt from 'jsonwebtoken';

const generateTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '5d' });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie("jwt", token, {
        maxAge: 86400 * 5 * 1000,
        httpOnly: true,
        sameSite: isProduction ? "none" : "strict",
        secure: isProduction,
    });
};

export default generateTokenAndSetCookie;


