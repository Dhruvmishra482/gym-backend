const Owner = require("../models/Owner");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config()

exports.signUp = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, email, password } = req.body;

       console.log("Signup Request Body:", req.body);

    const existingUser = await Owner.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await Owner.create({
      firstName,
      lastName,
      mobileNumber,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Something went wrong, please try again" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("REQ BODY: ", req.body);


    const user = await Owner.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not registered" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

  const token = jwt.sign(
  { id: user._id, email: user.email, role: user.accountType }, 
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
);

    user.password = undefined;

    res
      .cookie("token", token, {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        // secure: true,
        secure:false,
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        token,
        user,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to login, please try again" });
  }
};

exports.logout = (req, res) => {
  res
    .clearCookie("token", { httpOnly: true, sameSite: "none", secure: true })
    .status(200)
    .json({
      success: true,
      message: "Logged out successfully",
    });
};
