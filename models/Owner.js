const mongoose=require("mongoose")

const ownerSchema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        trim:true,
    },
      lastName:{
        type:String,
        required:true,
        trim:true,
    },
    mobileNumber:{
        type:Number,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        require:true,
    },
    accountType:{
        type:String,
        default:"owner"


    }
})

module.exports=mongoose.model("Owner",ownerSchema)