// const asyncHandler = (fn) =>{
// return (req , res , next)=>{
//     Promise.resolve(fn(req , res , next))
//     .catch((e)=>next(e))
// }
// }


export const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (e) {
        res.status(e.statusCode || 500).json({
            success: false,
            message: e.message,
        });
    }
};
