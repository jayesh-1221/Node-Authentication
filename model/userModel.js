const mongoose=require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    verifyOTP: {
      type: String,
      default: "",
    },
    verifyOTPExpireAt: {
      type: Number,
      default: 0,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    resetotp: {
      type: String,
      default: "",
    },
    reserotpExpireAt: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true } // Fix typo
);
 const userModel = mongoose.model('user', userSchema); // Named export


 module.exports={userModel};

