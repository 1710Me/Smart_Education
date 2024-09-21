// AUTH , IS STUDENT , IS INSTRUCTOR , IS ADMIN

const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.auth = (req, res, next) => {
  try {
    const token = req.body?.token || req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is Missing'
      });
    }

    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('Received token:', token);

    const secret = Buffer.from(process.env.JWT_SECRET, 'utf-8');

    try {
      const decode = jwt.verify(token, secret, { algorithms: ['HS256'] });
      req.user = decode;
      next();
    } catch (verifyError) {
      console.log('Verification error:', verifyError);
      const decodedPayload = jwt.decode(token, { complete: true });
      console.log('Decoded payload:', decodedPayload);
      throw verifyError;
    }
  } catch (error) {
    console.log('Error while decoding token:', error);
    return res.status(401).json({
      success: false,
      error: error.message,
      message: 'Error while decoding token'
    });
  }
};



// ================ IS STUDENT ================
exports.isStudent = (req, res, next) => {
    try {
        // console.log('User data -> ', req.user)
        if (req.user?.accountType != 'Student') {
            return res.status(401).json({
                success: false,
                messgae: 'This Page is protected only for student'
            })
        }
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('Error while cheching user validity with student accountType');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            messgae: 'Error while cheching user validity with student accountType'
        })
    }
}


// ================ IS INSTRUCTOR ================
exports.isInstructor = (req, res, next) => {
    try {
        // console.log('User data -> ', req.user)
        if (req.user?.accountType != 'Instructor') {
            return res.status(401).json({
                success: false,
                messgae: 'This Page is protected only for Instructor'
            })
        }
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('Error while cheching user validity with Instructor accountType');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            messgae: 'Error while cheching user validity with Instructor accountType'
        })
    }
}


// ================ IS ADMIN ================
exports.isAdmin = (req, res, next) => {
    try {
        // console.log('User data -> ', req.user)
        if (req.user.accountType != 'Admin') {
            return res.status(401).json({
                success: false,
                messgae: 'This Page is protected only for Admin'
            })
        }
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('Error while cheching user validity with Admin accountType');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            messgae: 'Error while cheching user validity with Admin accountType'
        })
    }
}


