import { asyncHandler } from "../utils/asyncHandler.js"
import {Video} from "../models/videoModel.js"
import {Likes} from "../models/likesoModel.js"
import {Comment} from "../models/commentMode.js"
import { ApiError } from "../utils/apiError.js";
import { ApiRes } from "../utils/res.js";
import mongoose, { isValidObjectId} from "mongoose";

export const getAllComments = asyncHandler(
    async(req , res)=>{
        const {videoId} = req.params
        const {page=10 , limit=10 , sortType="acc"} = req.query

        if(!isValidObjectId(videoId)){
            throw new ApiError(402 , "invalid video")
        }

       const comments  =  await Comment.aggregate([
            {
                $match : {
                    video : new mongoose.Types.ObjectId(videoId)
                }
            } , 
            {
                $lookup : {
                    from : "User" , 
                    localField : "owner",
                    foreignField : "_id",
                    as : "owenerDetails"
                }
            },
            {
                $lookup : {
                        from : "Likes",
                        foreignField : "comment",
                        localField : "_id",
                        as : "Likes"
                }
            },
            {
                $addFields : {
                    likesCount : {
                        $size : "$Likes"
                    }
                }
            } , 
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    likesCount: 1,
                    owner: {
                        username: 1,
                        fullName: 1,
                    },
                }
            }
        ])

        const options = {
            page:parseInt(page , 10),
            limit:parseInt(limit,10)
        }

        const commentPagi = await Comment.aggregatePaginate(comments , options)

        return ApiRes(200 , "successfully fetched" , commentPagi)

    }
)

export const addComment = asyncHandler(
    async (req , res)=>{
        const {content} = req.body
        const {videoId} = req.params

        if(!content){
            throw new ApiError(402 , "content is required")
        }

        if(!isValidObjectId(videoId)){
            throw new ApiError(402 , "video not found")
        }

       const newComment =  await Comment.create(
            {
                content , 
                owner : req.user?._id,
                video : videoId
            }
        )

        if(!newComment){
            throw new ApiError(404 , "comment not added")
        }

        return ApiRes(200 , "successfully Added" , newComment)

    }
)

export const updateComent = asyncHandler(
    async (req , res)=>{
        const {commentId} = req.params 
       const {content} =  req.body

        if(!isValidObjectId(commentId)){
            throw new ApiError(402 , "invalid video")
        }

        const comment = Comment.findById(commentId)

        if(req.user._id.toString() !== comment.owner ){
            throw new ApiError(402 , "only authenticated user can update")
        }

       const updated = await  Comment.findByIdAndUpdate(
            commentId , 
            {
                $set : {
                    content
                } , 
            } ,
            {new : true}
        )

        return ApiRes(
            200 , "successflly updated" , updated
        )

    }
)

export const deleteComent = asyncHandler(
    async (req , res)=>{

      const {commentId} = req.params

     const comment = await Comment.findById(commentId)

     if(!comment){
        throw new ApiError(402 , "invalid comment")
     }

     if(req.user?._id.toString() !== comment.owner.toString()){
        throw new ApiError(403 , "only authenticated user can delete comment")
     }

    //  When you need to delete multiple documents that match a certain condition then use Comment.deleteMany({_id : commentId}) 

    await Comment.findByIdAndDelete(commentId);

    await Likes.deleteMany({comment : commentId})

    return ApiRes(200 , "successfully deleted" , {})

    }
)