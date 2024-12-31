import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    
        userName : {
            type : String,
            required : true ,
            unique : true , 
            index : true , 
            lowercase : true ,
            trim : true
        } , 
        email : {
            type : String,
            required : true ,
            unique : true ,
            lowercase : true ,
            trim : true
        },
        fullName : {
            type : String,
            required : true ,
            trim : true,
            index : true
        },
        avtar : {
            type : String,
            required : true ,
        },
        coverImage : {
            type : String,
        },
        watchHistory: [
            {
                type : mongoose.Schema.Types.ObjectId ,
                ref : "Video"
            }
        ] , 
        password : {
            type : String , 
            required : [true,"password must required"]
        } , 

        refreshToken : {
            type : String
        }

    } , {timestamps : true}
)

// type of middleware,
//in Mongoose it is an automatic hook that runs before saving (mongoose.create()) the document to the database.

userSchema.pre("save" , async function (next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
        next()
    }else{
        return next()
    }
})

userSchema.methods.isPasswordCorrect = async function(password){
    // bcrypt.compare this return true or false
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = async function (){

    // The decodedToken will be an object containing the payload data (that we are passing below)
    
   return jwt.sign(
        {
            _id:this._id,
            userName:this.userName,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET ,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function (){
   
   return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
// here User is a collection name which replace by mongodb as users 
export const User = mongoose.models.User || mongoose.model('User',userSchema )

// A token is like a special pass or ID card that proves who you are. It is used in online applications to keep you logged in or verify your identity without needing to repeatedly enter your username and password.
// The jsonwebtoken package helps with:
// Creating tokens: When you log in, it creates a token that contains your user information (like your ID) and a secret key that only the server knows. This token is sent to the client (usually the browser).
// Verifying tokens: When the client sends the token back to the server (in future requests), jsonwebtoken checks if the token is valid and hasn’t been tampered with, using the secret key.
// In simple terms, it helps create and check tokens to keep users authenticated while interacting with an app.