import express, { urlencoded } from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser';

export const app = express();

app.use(cors(
    {
        origin : process.env.CORS_ORIGIN ,
        credentials  : true
    }
))
// This middleware is used to parse incoming requests with JSON data in the request body 
// It converts the request body from a JSON string into a JavaScript object.
app.use(express.json({limit:"10kb"}))

// This middleware is used to parse URL-encoded data, typically sent from HTML forms.
app.use(express.urlencoded({ extended: true }));

// Files inside the public folder are accessible to the public (anyone visiting your website). It allows you to serve t  hings like HTML files or images without writing extra routes for each file.
// In simple words, app.use(express.static('anyFolder')) tells your Express server to serve static files (like HTML, CSS, JavaScript, and images) from that particular folder.

app.use(express.static("public"))

//cookieParser package is used to parse cookies sent by the client (browser) in HTTP requests. It takes the cookies from the request headers and converts them into a JavaScript object that is easier to work with.
// helps to access and parse those cookies on the server, making them easy to use in your application
app.use(cookieParser())



import { router } from './routes/userRouter.js';
import { Videorouter } from './routes/videoRouter.js';


app.use("/api/v1/user" , router)
app.use("/api/v1/video" , Videorouter)
