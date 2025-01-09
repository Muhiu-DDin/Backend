import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/userModel.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import {ApiRes} from "../utils/res.js"
import mongoose from "mongoose"

export const registerUser = asyncHandler(async (req , res , next)=>{  

// get user details from frontend
// validation – not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object – create entry in db
// remove password and refresh token field from response
// check for user creation
// returnn res


const {userName , email ,  fullName , password} = req.body;

if(
    [userName , email ,  fullName , password].some(
        (field)=>field?.trim()===""
    )
){
    throw new ApiError(404 , "fileds are required")
    
}

const userExist = await User.findOne({ email })

if(userExist){
    console.log("use exist =>" , userExist)
    throw new ApiError(409 , "email already exists")
}


const avtarLocalPath = req.files?.avtar[0]?.path
console.log("Files received:", req.files);
console.log("avtar details => ", avtarLocalPath)

const coverLocalPath = req.files?.coverImage[0]?.path

if(!avtarLocalPath){
    throw new ApiError(404 , "avtar is required")
}

const avtar = await uploadOnCloudinary(avtarLocalPath)
const coverImg = await uploadOnCloudinary(coverLocalPath)

if(!avtar){
    throw new ApiError(404 , "avtar is required")   
}

const user = await User.create(
    {
        userName , 
        avtar : avtar?.url ,
        coverImage : coverImg?.img || "",
        email  , 
        fullName , 
        password
    }
)

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500 , "error in registering user")   
}

return res.status(200).json(
        new ApiRes(200 , "user register successfully" , createdUser )
)


})

const generateRefreshAndAccessToken = async (uid)=>{
    try{
        const user = await User.findById(uid)

        const refreshToken =  await user.generateRefreshToken()
        const accessToken = await user.generateAccessToken()

       user.refreshToken = refreshToken

    //since we are passing only refreshToken to user in database , when we use .save it checks for all the required fields to be pass for example password , here we only passing refreshToken so we dont want to check others fields 

       user.save({validateBeforeSave : false})

       return {refreshToken , accessToken }

    }catch(e){
        console.log("error=>" , e)
        throw new ApiError(500 , "something went wrong while generating tokens")
    }
}

export const loginUser = asyncHandler(async (req, res) => {

    const { email, password, userName } = req.body;
    console.log("Request Body:", req.body);

    if (!userName && !email) {
        throw new ApiError(402, "email or username is required");
    }

    // Find user by email or username
    const user = await User.findOne({ $or: [{ email }, { userName }] });

    if (!user) {
        throw new ApiError(402, "user not found");
    }

    const userPass = await user.isPasswordCorrect(password);

    if (!userPass) {
        throw new ApiError(403, "incorrect password");
    }

    const { refreshToken, accessToken } = await generateRefreshAndAccessToken(user._id);

    const loginUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiRes(200, "successfully login", {
                user: loginUser,
                refreshToken,
                accessToken,
            })
        );
});


// logoutUser controller would called after the execution of middleware jwtVerify , that why in this controller we have the access of req.user 

export const logoutUser = asyncHandler (async(req , res)=>{

    // await User.findByIdAndUpdate(
    //     req.user._id , {
    //         $set : {
    //             refreshToken : undefined
    //         }
    //     } , {
    //         new : true
    //     }
    // )

    const user = await User.findById(req.user._id)
    user.refreshToken = undefined
    user.save({validateBeforeSave : false})

    const options = {
        httpOnly : true ,
        secure : true
    }

    return res.status(200).
    clearCookie("refreshToken" , options).
    clearCookie("accessToken" , options).
    json(
        new ApiRes(200 , "successfully logout" , {})
    )
})

export const refreshaccesstoken = asyncHandler(

    async(res , req)=>{
        try{
        // this encoded refresh token is send by user as accessToken had been expired

        const SndByUser = req.cookies.refreshToken || req.body.refreshToken
        const decodedToken = jwt.verify(SndByUser , env.process.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id)

        if(!user){
            throw new ApiError(405 , "invalid refresh token")
        }
        // is ensuring that the refresh token being sent by the user is the same as the one stored in the database , this can prevent cases where someone might attempt to send an old or manipulated refresh token to get a new access token.

        if(user.refreshToken !== SndByUser){
            throw new ApiError(402 , "refresh token had been used or expire")
        }

        const {accessToken , refreshToken : newToken} = await generateRefreshAndAccessToken(user._id)

        const options = {
            httpOnly : true ,
            secure : true
        }

        return res.status(200).
        cookies("accessToken" , accessToken , options).
        cookies("refreshToken" , newToken , options).json(
            new ApiRes(200 , "refresh Token generated successfully" , {
                refreshToken , newToken
            })
        )
        }catch(e){
            console.log("error=>" , e)
            throw new ApiError(405 , e?.message|| "invalid token")
        }
    }
)

export const changeUserPassword = asyncHandler(

// for changing password , user must login , so this verfication is done by middleware jwtVerify , because when user is login only then it have tokens  

    async(req , res)=>{
        try{
            const {password , newPassword} = req.body

            console.log("request body of changePass=>" , req.body)

            const uid = req.user?._id
           const user = await User.findById(uid)

       
            
           const isValid =  await user.isPasswordCorrect(password)

           if(!isValid){
            throw new ApiError(403 , "password is in correct")
           }

            if(!user){
                throw new ApiError(405 , "user not found")
            }

            user.password = newPassword

            await user.save({validateBeforeSave : false})

            return res.status(200).json(
                new ApiRes(200 , "password changed successfully", {})
            )

        }catch(e){
            throw new ApiError(402 , "error in changing password")
        }
    }
)

export const getCurrectUser = asyncHandler(
    // again we use here jwtVerify middleware bcz req.user is only accessable when we use this middleware 

    async(req , res)=>{
        return res.status(202).json(
            new ApiRes(202 , "successfully get user" , req.user)
        )
    }
)

export const updateUserFields = asyncHandler(
    async(req , res)=>{

        const {userName , fullName} = req.body

        console.log("update Field'body =>" , req.body)

        if(!(userName || fullName)){
            throw new ApiError(402 , "userName or fullName is required")
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user?._id , 
            {
                $set : {
                    userName , 
                    fullName
                }
            } ,
            {
                new : true
            }
        ).select("-password -refreshToken")

        return res.status(202).json(
            new ApiRes(202 , "user successfully updated" , updatedUser )
        )
    }

)

export const updateAvtar = asyncHandler(
    async(req, res)=>{
        const avtarLocalPath = req.file?.path

        if(!avtarLocalPath){
            throw new ApiError(402 , "invalid path")
        }

      const avtar =  await uploadOnCloudinary(avtarLocalPath)

      if(!avtar.url){
        throw new ApiError(403 , "error in uploadin")
      }

      const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set : {
                avtar : avtar?.url
            }
        } ,
        {
            new : true
        }
      ).select("-password -refreshToken")

      if(!user){
        throw new ApiError(403 , "user does not exist")
      }

      return res.status(202).json(
        new ApiRes(202 , "avtar updated Successfully" , user )
      )


        



    }
)

export const updateCover = asyncHandler(
    async(req, res)=>{
        const coverLocalPath = req.file?.path

        if(!coverLocalPath){
            throw new ApiError(402 , "invalid path")
        }

      const cover =  await uploadOnCloudinary(coverLocalPath)

      if(!cover.url){
        throw new ApiError(403 , "error in uploading")
      }

      const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set : {
                coverImage : cover?.url
            }
        } ,
        {
            new : true
        }
      ).select("-password -refreshToken")

      if(!user){
        throw new ApiError(403 , "user does not exist")
      }

      return res.status(202).json(
        new ApiRes(202 , "cover updated Successfully" , user )
      )

    }
)

export const getUserProfile = asyncHandler(
    async(req , res)=>{

        // we needs to fetch profiles of other users too, req.params.userName is necessary.req.user.userName refers to the authenticated user's username 
        // which is typically used for actions where the user is interacting with their own data
        // If the goal is to fetch the profile of another user, req.user.userName wouldn't work because it doesn't let you specify another user's profile.

        
        const {userName}= req.params

        if(!userName){
            throw new ApiError("Invalid User")
        }
        console.log("username =>" , userName)

        // channel return an array in which there would be that particular user that is being matched

        const channel =   await User.aggregate([
            {
                $match : {
                    userName : userName
                } 
            },
                // when the match find that document it will pass to the next pipline in this case its lookUp

                // To fetch all subscriptions where the current user's _id appears as the channel

                // A subscriber: The user who is following another user (the "follower").
                // A channel: The user being followed (the "followed user").

                // eg : ali (User 2) subscribes to umar (User 1)
                // subscriber: This will be User 2's _id (2).
                // channel: This will be User 1's _id (1).

                // The Subscription model represents a relationship between two users:
                // A subscriber who follows another user.
                // A channel which is the user being followed.
            {
                $lookup:{
                    from:"Subscription",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                } 
            },
            {
                $lookup:{
                    from:"Subscription",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            },
                // these 3 fields will be added to the search user (user pass through params)
            {
                $addFields : {

                    subsCount : {
                        $size : "$subscribers"
                    } , 

                    subsToCount : {
                        $size : "$subscribedTo"
                    } , 
                
                // we have to find wheather the array of subscribers that have got from lookup have this particular user exsit or not 

                // $in expects two arguments:
                // The value to check: This is the value you want to check for existence within an array.
                // The array to search in: This is the array where the operator will look for the value.

                    isSubscribes : {
                        $cond : {
                            if : {$in : [req.user?._id , "$subscribers.subscriber"]},
                            then : true,
                            else : false 
                        }
                    }
                } 
            } , 
            {
                $project : {
                    userName:1 ,
                    fullName:1,
                    email:1,
                    avtar:1,
                    coverImage:1,
                    subsCount:1,
                    subsToCount:1,
                    isSubscribes:1,
                    subscribers:1,
                    subscribedTo:1

                }   
            }
        ]
    )
    
    if(!channel.length){
        throw new ApiError(402 , "channel does not exist")
    }

    return res.status(200).json(
        new ApiRes(200 , "channel fetched successfully" ,  channel[0])
    )
}
)

// Why Explicit Type Conversion of _id is Required in below function : 
// In functions like findById or findByIdAndUpdate, Mongoose automatically converts string values to ObjectId behind the scenes if the _id field is expected to be an ObjectId

// Explicit conversion to mongoose.Types.ObjectId is necessary when:
// 1) Using raw MongoDB aggregation queries (User.aggregate()).
// 2) Comparing _id values or other fields stored as ObjectId in the database.

// Mongoose does not automatically cast types in aggregation pipelines, unlike when using methods like find, findById, or findOneAndUpdate.

// This is because aggregation pipelines are lower-level and provide a more direct interface to MongoDB's aggregation functionality.

// The localField is "watchHistory", which is an array of ObjectIds in the User document.
// The foreignField is the _id field in the Video collection.
// The $lookup performs a join operation to match each ObjectId in the watchHistory array with the _id in the Video collection.
// For every ObjectId in the watchHistory, MongoDB looks up the corresponding Video document and places it into the new array field WacthedHistory.

// eg:
// {
//     "_id": "userId123",
//     "userName": "john_doe",

//     "watchHistory": [
//       "videoId1",
//       "videoId2",
//       "videoId3"
//     ],
//     "WacthedHistory": [
//       {
//         "_id": "videoId1",
//         "title": "Amazing Nature",
//         "duration": 120,
//         "views": 5000,
//             "owner" : {

//             }
//       },
//       {
//         "_id": "videoId2",
//         "title": "Tech Trends 2025",
//         "duration": 180,
//         "views": 3000,
//             "owner" : {

//             }
//       },
//       {
//         "_id": "videoId3",
//         "title": "Cooking 101",
//         "duration": 90,
//         "views": 8000,
//             "owner" : {

//             }
//       }
//     ]
//   }

   

export const getUserWatchHistory = asyncHandler(
    async(req , res)=>{
        // aggregate returns array , in this case it is an array of a particular user means array have only one object of user 
       const user = await User.aggregate([
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(req.user?._id)
                }
            }, 
            {
                $lookup : {
                    // control Switches to the Video collection from user collection 
                    from : "Video",
                    localField : "watchHistory",
                    foreignField : "_id",
                    as : "WatchedHistory",
                    pipeline : [
                        {
                            $lookup : {
                    // control Switches to the USER collection from VIDEOS collection 
                                from : "User",
                                localField : "owner",
                                foreignField : "_id",
                                as : "owner" , 
                                pipeline : [
                                    // Further processing in User context
                                    {
                                        $project : {
                                            userName:1 ,
                                            fullName:1,
                                            avtar:1
                                        }
                                    }
                                ]

                            }
                        } , 

                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ])

//The aggregate method returns an array of documents, even if only one document is returned.
// In your case, since you're matching a single user by their _id, MongoDB will return an array with one element: the matched user document. Hence, user[0] refers to the first (and only) document in that array.

        return res.status(200).json(
            new ApiRes(202 , "user watched history" , user[0].WatchedHistory)
        )
    }
)
