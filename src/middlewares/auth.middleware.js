import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {User} from "../models/userModel.js"
import {ApiError} from "../utils/apiError.js"

export const jwtVerify = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(500, "Error in accessing token");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken._id).select("-password -refreshToken");
        console.log("user through jwt =>" , user)

        if (!user) {
            throw new ApiError(402, "Invalid access token");
        }

        req.user = user;
        next();
    } catch (e) {
        throw new ApiError(401, e.message || "Invalid token");
    }
});

// Token Structure: A JWT (JSON Web Token) consists of three parts:
// Header: Contains the token's type (JWT) and the signing algorithm (HS256, RS256, etc.).
// Payload: Contains user-related data, such as userId, email, or any other information you pass when generating the token.
// Signature: A hash created by combining the header and payload with a secret key using the specified algorithm.
