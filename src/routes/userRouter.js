import { Router } from "express";
import { registerUser , loginUser , logoutUser , refreshaccesstoken , updateUserFields ,  
changeUserPassword , getCurrectUser , getUserProfile , updateAvtar , updateCover , getUserWatchHistory
} from "../controller/userController.js";
import { upload} from "../middlewares/multer.middleware.js";
import {jwtVerify} from "../middlewares/auth.middleware.js"

export const router = Router();

router.route("/register").post(
    upload.fields([

// these name and the filed we use in frontent for uploading avtar should same , bcz when this upload middleware would call it matches the fields it the filed exist then multer uploads

// req.files = {
//     avtar: [file1],
//     coverImage: [file2]
//   }

        { name: "avtar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    
    registerUser
);

  

router.route("/logout").post(jwtVerify , logoutUser )

router.route("/refreshToken").post(jwtVerify , refreshaccesstoken)

router.route("/updateUser").patch(jwtVerify , updateUserFields),

router.route("/changePassword").patch(jwtVerify , changeUserPassword)

router.route("/c/:userName").get(jwtVerify , getUserProfile)

router.route("/getUser").get(jwtVerify , getCurrectUser)

router.route("/updateAvtar").patch(jwtVerify , upload.single("avtar") , updateAvtar)

router.route("/updateCover").patch(jwtVerify , upload.single("coverImage") , updateCover)

router.route("/userHistory").get(jwtVerify , getUserWatchHistory)