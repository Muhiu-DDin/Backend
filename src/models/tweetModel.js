import mongoose from "mongoose"

const tweetSchema = new mongoose.Schema(
{
    owner : {
        type : mongoose.Types.ObjectId,
        ref : "User"
    } , 
    content : {
        type : String , 
        required : true
    }
}
,
{
    timestamps:true ,
}
)

export const Tweet = mongoose.models.Tweet || mongoose.model("Tweet" , tweetSchema)
