const { userModel } = require("../model/userModel");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookieparser");
const { transporter } = require("../config/nodemailer");
const { text } = require("express");

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json("All fields are mandatory");
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json("User already exists");
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to My Site",
      text: `Hello ${username}, your account has been created with the email: ${email}`,
    };
    await transporter.sendMail(mailOptions);

    return res.status(201).json("User created");
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json("Server error");
  }
};

const getUsers = async (req, res) => {
  const users = await userModel.find();

  if (!users) {
    res.status(200).json("User doesnot exist");
  }

  res.status(200).json(users);
};

const getUserWithEmail = async (req, res) => {
  try {
    const email = req.params.email;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json("User does not exist");
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by email:", error.message);
    return res.status(500).json("Server error");
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are mandatory!" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { username: user.username, email: user.email },
      process.env.JWT_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json(`Login successful. Welcome ${user.username}!`);
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    res.status(400).json("user not exist");
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  const mailOption = {
    from: process.env.SENDER_EMAIL,
    to: user.email,
    subject: "Password Reset OTP",
    text: `OTP for resetting password is ${otp} . OTP expires in 2hrs `,
  };

  user.resetotp = otp;
  user.reserotpExpireAt = Date.now() + 2 * 60 * 60 * 1000;
  await user.save();

  await transporter.sendMail(mailOption);
  res.json("Email sent");
};

const resetSubmit = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.json("All fiels should be filled");
    }

    const user = await userModel.findOne({ email });

    if (user.reserotpExpireAt < Date.now()) {
      return res.json("OTP has expired");
    }

    if (user.resetotp === otp) {
      const newHashedPassword = await bcryptjs.hash(password, 10);

      user.password = newHashedPassword;
      user.resetotp = "";
      user.reserotpExpireAt = 0;

      await user.save();
    }

    return res.json("Password changed .. Log in to proceed");
  } catch (error) {
    return res.json({ message: error.message });
  }
};

const logOutUser = async (req, res) => {
  try {
    // Clear the JWT token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
    });

    // Send success response
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ message: "Server error during logout" });
  }
};

const emailVerificationOtp = async (req, res) => {
  try {
    // Get user email from decoded JWT stored by middleware
    const { email } = req.user;

    if (!email) {
      return res.status(400).json({ message: "Missing user data in token" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isAccountVerified) {
      return res.status(200).json({ message: "Account already verified" });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP and expiration (24 hours)
    user.verifyOTP = otp;
    user.verifyOTPExpireAt = Date.now() + 10 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      text: `Hello ${user.username},\n\nYour OTP for verifying your account is: ${otp}\n\nIt is valid for 24 hours.`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "OTP has been sent to your email" });
  } catch (error) {
    console.error("OTP send error:", error.message);
    return res.status(500).json({ message: "Server error while sending OTP" });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { otp, email } = req.body;

    if (!otp) {
      return res.json("Crendentials required");
    }

    const user = await userModel.findOne({ email });

    if (user.verifyOTP === "" || user.verifyOTP != otp) {
      return res.json("Invalid OTP");
    }

    if (user.verifyOTPExpireAt < Date.now()) {
      return res.json("OTP expired !! Generate new OTP to verify account");
    }

    user.isAccountVerified = true;
    user.verifyOTP = "";
    user.verifyOTPExpireAt = 0;
    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verified",
      text: "Your account has been verified",
    };

    await transporter.sendMail(mailOption);

    return res.json("Email verified successfully");
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// To check user is authenticted
const isAuthenticated = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  getUsers,
  getUserWithEmail,
  userLogin,
  resetPassword,
  logOutUser,
  emailVerificationOtp,
  verifyEmail,
  resetSubmit,
  isAuthenticated,
};
