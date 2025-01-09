import { asyncHandler } from "../utils/asyncHandler.js"
import {Video} from "../models/videoModel.js"
import { Playlist } from "../models/playlistModel.js";
import { ApiError } from "../utils/apiError.js";
import { ApiRes } from "../utils/res.js";
import mongoose, { isValidObjectId} from "mongoose";

export const createPlaylist = asyncHandler(
    async (req , res)=>{
        const { name , description } = req.body;

        if(!(name && description)){
            throw new ApiError(402 , "fields are required")
        }

        const playlist = await Playlist.create(
            {
                owner : req.user?._id , 
                name , description
            }
        )
        if (!playlist) {
            throw new ApiError(500, "failed to create playlist");
        }
        return res
        .status(200)
        .json(new ApiRes(200,"playlist created successfully",playlist));

    }
)

export const updatePlaylist = asyncHandler(
    async(req , res)=>{

       const{name , description} =  req.body
       const {playlistId} = req.params

       const playlist = await Playlist.findById(playlistId);

       if(playlist.owner.toString() !== req.user?._id){
        throw new ApiError(403 , "only authenticated users are allowed")
       }

       if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

       if(!(name && description)){
        throw new ApiError(402 , "fields are required")
       }

     const updated = await Playlist.findByIdAndUpdate(
        playlistId , {
            $set : {
                name , description
            }
        } ,{new : true}
       )

       if(!updated){
        throw new ApiError(402 , "unable to update")
       }

       return res
       .status(200)
       .json(
           new ApiResponse(
               200,
               "playlist updated successfully",
               updated
           )
       );

    }
)

export const deletePlaylist = asyncHandler(
    async(req , res)=>{

       const {playlistId} =  req.params

       
       const playlist = await Playlist.findById(playlistId);

       if(playlist.owner.toString() !== req.user?._id){
        throw new ApiError(403 , "only authenticated users are allowed")
       }

       if (!playlist) {
        throw new ApiError(404, "Playlist not found");
       }

       await Playlist.findByIdAndDelete(playlist._id)

       return res
       .status(200)
       .json(
           new ApiRes(
               200,
               "playlist deleted successfully",
               {}
           ))    
       }
)

export const addVideos = asyncHandler(
    async(req , res)=>{

        const {videoId , playlistId} = req.params

        if(!isValidObjectId(videoId)){
            throw new ApiError(402 , "invalid video")
        }

        if(!isValidObjectId(playlistId)){
            throw new ApiError(402 , "invalid playlist")
        }

       const video = await Playlist.findById(videoId)

       if(!video){
        throw new ApiError(402 , "video not found")
       }

       const playlist = await Playlist.findById(playlistId)

       if(!playlist){
        throw new ApiError(402 , "playlist not found")
       }
       if(playlist.owner.toString() !== req.user?._id){
        throw new ApiError(403 , "only authenticated users are allowed")
       }

       const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId , {
        $push : {
            videos : video
        }
       } , {new : true})

       return res
       .status(200)
       .json(
           new ApiResponse(
               200,
               "Added video to playlist successfully",
               updatePlaylist
           )
       );
    }
)

export const removeVideos = asyncHandler(
    async(res , req)=>{

      const {videoId , playlistId} = req.prams

      if(!isValidObjectId(videoId)){
        throw new ApiError(402 , "invalid video")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(402 , "invalid playlist")
    }

    const video = await Playlist.findById(videoId)

    if(!video){
     throw new ApiError(402 , "video not found")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
     throw new ApiError(402 , "playlist not found")
    }
    if(playlist.owner.toString() !== req.user?._id){
     throw new ApiError(403 , "only authenticated users are allowed")
    }

    // The $pull operator is used to remove an element from an array in MongoDB,
    // delete video from videos array  , findByIdAndDelete deletes the entrie doc

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlist._id , {
        $pull : {
            videos : videoId
        }
    } , {new  : true})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Removed video from playlist successfully",
            updatedPlaylist
        )
    );









    }
)

export const getPlaylistById = asyncHandler(
    async(req , res)=>{

        const {playlistId} = req.params

        if(!isValidObjectId(playlistId)){
            throw new ApiError(402 , "invalid playlist")
        }

      const playlistVideos =   await Playlist.aggregate([
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(playlistId)
                }
            } , 
            {
                $lookup : {
                    from : "User" , 
                    localField : "owner" , 
                    foreignField : "_id" ,
                    as : "ownerDetails"
                }
            },
            {
                $lookup: {
                    from: "Videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videoDetails",
                },
            
            },
            {
                $group : {
                    videos : "$videoDetails"
                }
            },
            {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                ownerDetails: {
                    $first: "$owner"
                }
            }
        },
            {
                $project: {
                    _id: 1,
                    owner: 1,
                    ownerDetails: {
                        userName: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                    name: 1,
                    description: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    videos: {
                        _id: 1,
                        title: 1,
                        description: 1,
                        "thumbnail.url": 1,
                        "videoFile.url": 1,
                        duration: 1,
                        createdAt: 1,
                    },
                },
            }
        ])

        return res
        .status(200)
        .json(new ApiResponse(200, playlistVideos[0], "playlist fetched successfully"));
    }
)

export const getUserPlaylists = asyncHandler(
    async(req , res) => {
        
     const {userId} = req.params

    const playlists = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        } ,
        {
            $lookup:{
                from : "Video",
                localField : "videos",
                foreignField : "_id",
                as : "videos"
            }
        },
        {
            $addFields : {
                totalVideos : {
                    $size : "$videos"
                } ,
                totalViews : {
                    $sum : "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
     ])
     

     return res
     .status(200)
     .json(new ApiRes(200 , 
        "User playlists fetched successfully" ,
        playlists
    ));
    }
)