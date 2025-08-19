const express = require("express")
const app = express()
const database = require("./config/db")
const cookieParser = require('cookie-parser')
const cors = require("cors")
require("dotenv").config()
const authRoutes = require("./routes/authRoutes")
const memberRoutes=require("./routes/memberRoutes")

database.connect()
app.use(express.json());
app.use(cookieParser());


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      //    process.env.FRONT_END_URL
    ],
    credentials: true,
  })
);

app.use("/api/v1/auth",authRoutes)
app.use("/api/v1/member",memberRoutes)



app.listen(process.env.PORT,() =>
{
});


module.exports = app; 