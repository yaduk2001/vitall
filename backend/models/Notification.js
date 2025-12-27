const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['new_course', 'new_video', 'comment', 'system_alert'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // ID of the course, video, or comment
  },
  relatedType: {
    type: String,
    enum: ['course', 'video', 'comment'],
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

// Static method to format notification for API response
notificationSchema.statics.format = function (notification) {
  return {
    id: notification._id.toString(),
    userId: notification.userId.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    relatedId: notification.relatedId ? notification.relatedId.toString() : null,
    relatedType: notification.relatedType,
    isRead: notification.isRead,
    createdAt: notification.createdAt
  };
};

// Static method to create notifications for all students when new content is uploaded
notificationSchema.statics.createForNewContent = async function (tutorId, contentType, contentId, contentTitle) {
  try {
    const Subscription = require('./Subscription');
    const User = require('./User');

    // Get tutor info
    const tutor = await User.findById(tutorId);
    if (!tutor) return;

    // Correctly accessing fullName from the User model
    const tutorName = tutor.fullName || tutor.organization || tutor.email?.split('@')[0] || 'Unknown';

    // 1. Get all subscribers of this tutor
    const subscriptions = await Subscription.find({ tutorId });
    const subscriberIds = subscriptions.map(sub => sub.studentId.toString());

    // 2. Get all students
    const allStudents = await User.find({ role: 'student' });

    const notifications = [];

    for (const student of allStudents) {
      if (subscriberIds.includes(student._id.toString())) {
        // Scenario 1: Subscribed Channel - Elated message
        notifications.push({
          userId: student._id,
          type: contentType === 'course' ? 'new_course' : 'new_video',
          title: `New Content from ${tutorName}! 🎉`,
          message: `Get excited! ${tutorName} just dropped a new ${contentType}: "${contentTitle}". Check it out now!`,
          relatedId: contentId,
          relatedType: contentType
        });
      } else {
        // Scenario 2: Non-Subscribed Channel - Discovery message
        notifications.push({
          userId: student._id,
          type: contentType === 'course' ? 'new_course' : 'new_video',
          title: 'New Course Alert 🚀',
          message: `A new ${contentType} has arrived: "${contentTitle}" by ${tutorName}. Wanna check it out?`,
          relatedId: contentId,
          relatedType: contentType
        });
      }
    }

    if (notifications.length > 0) {
      await this.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications for new ${contentType}: ${contentTitle}`);
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};

// Static method to create notifications for enrolled students when course is updated
notificationSchema.statics.createForCourseUpdate = async function (courseId, courseTitle, updateType = 'updated') {
  try {
    const Enrollment = require('./Enrollment');

    // Get all enrollments for this course
    const enrollments = await Enrollment.find({ courseId });
    if (enrollments.length === 0) return;

    const title = `Course Updated`;
    const message = `The course "${courseTitle}" you are enrolled in has been ${updateType}. Check out the new content!`;

    const notifications = enrollments.map(enr => ({
      userId: enr.studentId,
      type: 'course_update', // You might need to add this to the enum if strict
      title: title,
      message: message,
      relatedId: courseId,
      relatedType: 'course'
    }));

    // Note: If 'type' enum is strict in schema, we need to use 'new_course' or add 'course_update' to enum.
    // Assuming we can use 'new_course' or update schema. Let's check schema.
    // Schema enum: ['new_course', 'new_video', 'comment']
    // We should probably update the schema enum or reuse 'new_course'.
    // reusing 'new_course' to avoid schema validation error, but title clarifies it's an update.

    const safeNotifications = notifications.map(n => ({ ...n, type: 'new_course' }));

    if (safeNotifications.length > 0) {
      await this.insertMany(safeNotifications);
      console.log(`Created ${safeNotifications.length} update notifications for course: ${courseTitle}`);
    }
  } catch (error) {
    console.error('Error creating update notifications:', error);
  }
};

module.exports = mongoose.model('Notification', notificationSchema);