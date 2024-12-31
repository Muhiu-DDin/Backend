import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/userModel.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import {ApiRes} from "../utils/res.js"

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

export const loginUser = asyncHandler(async (req , res)=>{

    const {email , password , userName} = req.body

    if(!(email || userName)){
        throw new ApiError(402 , "email is required")
    }
    
    // User.findOne({
    //     $or : [{ email } ,{ userName }]
    // })

    // at this user refrence , user dont have tokens

   const user =  await User.findOne({email})

   if(!user){
    throw new ApiError(402 , "user not found")
   }

    const userPass = user.isPasswordCorrect(password)

    if(!userPass){
        throw new ApiError(403 , "incorrect password")
    }

    const {refreshToken , accessToken} = await generateRefreshAndAccessToken(user._id)

    // At this reference of user , it has tokens

    const loginUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly : true , 
        secure : true
    }

    // these token is send to user as encoded tokens and can be decoded using jwt.verify or other methods 

    return res.status(200).
    cookie("refreshToken" , refreshToken , options ).
    cookie("accessToken" , accessToken , options ).
    json(
        new ApiRes(200 , "successfully login" , {
            user : loginUser , refreshToken , accessToken
        })
    )
})

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
        // is ensuring that the refresh token being sent by the user is the same as the one stored in the database , his can prevent cases where someone might attempt to send an old or manipulated refresh token to get a new access token.

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

            const uid = req.user?._id
            user = await User.findById(uid)
            
           const isValid =  user.isPasswordCorrect(password)

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