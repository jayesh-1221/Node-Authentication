const jwt=require('jsonwebtoken');


const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json("Authentication failed..login again");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    if (decoded.email) {
      req.user = decoded; // ✅ This must be set
      return next();
    } else {
      return res.status(401).json("Not authorized. Login again");
    }

  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

module.exports={
    userAuth
}