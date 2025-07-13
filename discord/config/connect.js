const mongoose = require('mongoose');

const connectDB = async(url) =>{
    try{
        await mongoose.connect(url);
        console.log("Connected to the database successfully");
    }catch(err){
        console.error("Error connecting to the database:", err);
        process.exit(1); // Exit the process with failure
    }
}

module.exports = connectDB; 