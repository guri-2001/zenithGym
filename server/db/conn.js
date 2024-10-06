const mongoose = require("mongoose");

const DB = process.env.MONGODB_URL
// const DB = "mongodb+srv://codecrafters:Devteam2024@data.ma9zn4r.mongodb.net/companyRecords?retryWrites=true&w=majority&appName=data"

mongoose.connect(DB,{
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(()=>console.log("DATABASE connected")).catch((err)=> console.log("error" + err.message))