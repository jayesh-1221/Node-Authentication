const express=require("express");
const {registerUser,
  getUsers,
  getUserWithEmail,
  userLogin,
  resetPassword,
  logOutUser,
  emailVerificationOtp,
  verifyEmail,
  resetSubmit,
  isAuthenticated
}=require("../controller/authController")

const {userAuth}=require('../middleware/userAuth')

const authRouter=express.Router();


authRouter.post('/register',registerUser);
authRouter.get('/users',getUsers);
authRouter.get('/user/:email',getUserWithEmail);
authRouter.post('/login',userLogin);
authRouter.post('/reset',resetPassword);
authRouter.post('/logout',logOutUser);
authRouter.post('/verifyOtp',userAuth,emailVerificationOtp);
authRouter.post('/verify-account',userAuth,verifyEmail);
authRouter.post('/reset-submit',resetSubmit);
authRouter.post('/is-auth',userAuth,isAuthenticated);






module.exports={
    authRouter
}