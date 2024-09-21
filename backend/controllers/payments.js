const User = require('../models/user');
const Course = require('../models/course');
const CourseProgress = require("../models/courseProgress");
const mailSender = require('../utils/mailSender');
const { courseEnrollmentEmail } = require('../mail/templates/courseEnrollmentEmail');
const { default: mongoose } = require('mongoose');

// Simulate payment and enroll student
exports.processPayment = async (req, res) => {
    const { coursesId } = req.body;
    const userId = req.user.id;

    if (coursesId.length === 0) {
        return res.json({ success: false, message: "Please provide Course Id" });
    }

    try {
        // Enroll student in courses
        await enrollStudents(coursesId, userId);

        // Return success response
        res.status(200).json({
            success: true,
            message: "Payment done successfully. You are now enrolled in the course(s).",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Could not process payment" });
    }
};

// Enroll students to courses after payment
const enrollStudents = async (courses, userId) => {
    if (!courses || !userId) {
        throw new Error("Please provide data for Courses or UserId");
    }

    for (const courseId of courses) {
        try {
            // Find the course and enroll the student in it
            const enrolledCourse = await Course.findOneAndUpdate(
                { _id: courseId },
                { $push: { studentsEnrolled: userId } },
                { new: true },
            );

            if (!enrolledCourse) {
                throw new Error("Course not Found");
            }

            // Initialize course progress
            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [],
            });

            // Find the student and add the course to their list of enrolled courses
            const enrolledStudent = await User.findByIdAndUpdate(
                userId,
                {
                    $push: {
                        courses: courseId,
                        courseProgress: courseProgress._id,
                    },
                },
                { new: true }
            );

            // Send an email notification to the enrolled student
            await mailSender(
                enrolledStudent.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
            );
        } catch (error) {
            console.log(error);
            throw new Error("Failed to enroll in course");
        }
    }
};