const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/refreshModel");


class JWTservice{
    static signAccessToken(payload,expiryTime){
        return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: expiryTime});
    }

    static signRefreshToken(payload,expiryTime){
        return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: expiryTime});
    }

    static verifyAccessToken(token){
       return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    }

    static verifyRefreshToken(token){
        return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    }

    static async storeRefreshToken(token, userId){
        try {
            const newToken = new RefreshToken({
                token: token,
                userId: userId,
            })

            await newToken.save();
        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = JWTservice;