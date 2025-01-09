import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema(
    {
     content : {
        type : String,
        required: true
     } ,
     owner : {
        type : mongoose.Types.ObjectId ,
        ref : "User"
     } , 
     video : {
        type : mongoose.Types.ObjectId,
        ref : "Video"
     }
    } , 
    {
        timestamps : true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.models.Comment || mongoose.model("Comment",commentSchema)