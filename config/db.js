// config/database.js
const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URL = process.env.MONGODB_URL;

exports.connect = () => {
  mongoose
    .connect(MONGODB_URL, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    })
    .then(() => {
      console.log("db connected");
      
    })
    .catch((err) => {
     console.log("error while connecting db");
     
      process.exit(1);
    });
};
