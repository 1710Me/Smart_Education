const jwt = require("jsonwebtoken");
require('dotenv').config();

// ================ AUTH ================
// user Authentication by checking token validating
exports.auth = (req, res, next) => {
    try {
        // extract token by anyone from these 3 ways
        const token = req.body?.token || req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

        // if token is missing
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token is Missing'
            });
        }

        console.log('JWT_SECRET:', process.env.JWT_SECRET); // Log the secret key (remove in production)
        console.log('JWT_SECRET:', process.env.JWT_SECRET);
        console.log('Received token:', token);
        // verify token
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
            req.user = decode;
        }
        catch (error) {
            console.log('Error while decoding token');
            console.log(error);
            return res.status(401).json({
                success: false,
                error: error.message,
                message: 'Error while decoding token'
            });
        }
        // go to next middleware
        next();
    }
    catch (error) {
        console.log('Error while token validating');
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Error while token validating'
        });
    }
};

// ================ IS STUDENT ================
exports.isStudent = (req, res, next) => {
    try {
        if (req.user?.accountType !== 'Student') {
            return res.status(401).json({
                success: false,
                message: 'This page is protected only for students'
            });
        }
        next();
    }
    catch (error) {
        console.log('Error while checking user validity with student accountType');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while checking user validity with student accountType'
        });
    }
};

// ================ IS INSTRUCTOR ================
exports.isInstructor = (req, res, next) => {
    try {
        if (req.user?.accountType !== 'Instructor') {
            return res.status(401).json({
                success: false,
                message: 'This page is protected only for instructors'
            });
        }
        next();
    }
    catch (error) {
        console.log('Error while checking user validity with Instructor accountType');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while checking user validity with Instructor accountType'
        });
    }
};

// ================ IS ADMIN ================
exports.isAdmin = (req, res, next) => {
    try {
        if (req.user?.accountType !== 'Admin') {
            return res.status(401).json({
                success: false,
                message: 'This page is protected only for admins'
            });
        }
        next();
    }
    catch (error) {
        console.log('Error while checking user validity with Admin accountType');
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while checking user validity with Admin accountType'
        });
    }
};