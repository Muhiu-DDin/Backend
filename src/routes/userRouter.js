import { Router } from "express";
import { registerUser , loginUser , logoutUser , refreshaccesstoken } from "../controller/userController.js";
import { upload} from "../middlewares/multer.middleware.js";
import {jwtVerify} from "../middlewares/auth.middleware.js"

export const router = Router();

router.route("/register").post(
    upload.fields([

        // these name and the filed we use in frontent for uploading avtar should same , bcz when this upload middleware would call it matches the fields it the filed exist then multer uploads

        { name: "avtar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser)

router.route("/logout").post(jwtVerify , logoutUser )

router.route("/refreshToken").post(refreshaccesstoken)