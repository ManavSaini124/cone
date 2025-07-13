
// pass the function
//  
const async_handler = (fn) =>{
     return async (req,res,next) =>{
        try{
            await fn(req,res,next)
        }catch(err){
            console.log("Error => ",err)
            res.status(err.status|| 500).json({success:false, message: err.message})
        }
    }
}

module.exports = async_handler;

// const loginUser = async_handler(async(req,res)=>{