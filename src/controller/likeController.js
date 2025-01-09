import { asyncHandler } from "../utils/asyncHandler.js"
import {Video} from "../models/videoModel.js"
import {Likes} from "../models/likesoModel.js"
import {Tweet} from "../models/tweetModel.js"
import {Comment} from "../models/commentMode.js"
import { ApiError } from "../utils/apiError.js";
import { ApiRes } from "../utils/res.js";
import mongoose, { isValidObjectId} from "mongoose";

export const LikesOfCurrUser = asyncHandler(
async(req , res)=>{
    const {videoId} = req.params

   const likedVideosAggegate =  await Likes.aggregate([
        {
            // this will bring all the likes of tweet , videos , comments , i just want likes of videos 

            $match : {
                likedBy : new mongoose.Types.ObjectId(req.user?._id) ,
            }
        } , 
        {
            // likedVideo filed will added to only that video where video (localfield) matches video(foreignfield) 

            $lookup :{
                from:"Video",
                localField : "video",
                foreignField : "_id",
                as : "LikedVideos" , 
                pipleLine : [
                    {
                        $lookup:{
                            from : "User",
                            localField : "owner",
                            foreignField : "_id",
                            as : "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails",
                    }
                ]
            } ,
     
            
        } ,
        {
            $unwind : "$LikedVideos"
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        userName: 1,
                        fullName: 1,
                    },
                },
            },
        }
    ])

    
    return res
        .status(200)
        .json(
            new ApiRes(
                200,
                "liked videos fetched successfully",
                likedVideosAggegate
            ))
}
)

export const toggleVideoLike = asyncHandler(

    async (req , res)=>{
        const {videoId} = req.params

        const alreadyLiked = await Likes.findOne(
            {
                video : videoId , 
                likedBy : req.user?._id
            }
        )
        // if video is alreadyLiked , then after toggle it would be unlike 

        if(alreadyLiked){
            await Likes.findOneAndDelete(alreadyLiked?._id)

            return res
            .status(200)
            .json(new ApiRes(200, { isLiked: false }));
    }
        
        await Likes.create(
            {
                video : videoId ,
                likedBy : req.user?._id
            }
        )

        return res
        .status(200)
        .json(new ApiRes(200, { isLiked: true}));

    }
)

export const toggleTweetLike = asyncHandler(

    async (req , res)=>{

        const {tweetId} = req.params

        const alreadyLiked = await Likes.findOne(
            {
                tweet : tweetId , 
                likedBy : req.user?._id
            }
        )
        
        if(alreadyLiked){
            await Tweet.findOneAndDelete(alreadyLiked?._id)

            return res
            .status(200)
            .json(new ApiRes(200, { isLiked: false }));
    }
        
        await Likes.create(
            {
                tweet : tweetId ,
                likedBy : req.user?._id
            }
        )

        return res
        .status(200)
        .json(new ApiRes(200, { isLiked: true}));

    }
)

export const toggleCommentLike = asyncHandler(

    async (req , res)=>{

        const {commentId} = req.params

        const alreadyLiked = await Likes.findOne(
            {
                comment : commentId , 
                likedBy : req.user?._id
            }
        )
        
        if(alreadyLiked){
            await Tweet.findOneAndDelete(alreadyLiked?._id)

            return res
            .status(200)
            .json(new ApiRes(200, { isLiked: false }));
    }
        
        await Likes.create(
            {
                comment : commentId ,
                likedBy : req.user?._id
            }
        )

        return res
        .status(200)
        .json(new ApiRes(200, { isLiked: true}));

    }
)