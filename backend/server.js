require('dotenv').config()
const express = require("express");
const cors = require("cors");
const connectDB = require('./config/database');
const Message = require('./models/Message');
const Video = require('./models/Video');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const Channel = require('./models/Channel');
const Course = require('./models/Course');
const AnalyticsEvent = require('./models/AnalyticsEvent');
const Subscription = require('./models/Subscription');
const Enrollment = require('./models/Enrollment');
const Progress = require('./models/Progress');
const Notification = require('./models/Notification');
const Comment = require('./models/Comment');
const Like = require('./models/Like');
const path = require('path');
const fs = require('fs');
let multer; try { multer = require('multer'); } catch { multer = null; }

const app = express();

// Environment variables
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4321';
const FRONTEND_URL_PROD = process.env.FRONTEND_URL_PROD || '';
const NODE_ENV = process.env.NODE_ENV || 'development';
const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8000';

// Connect to MongoDB Atlas
connectDB();

// CORS Configuration - Allow frontend origins
const allowedOrigins = [
  ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : []),
  'http://localhost:5173',
  FRONTEND_URL,
  FRONTEND_URL_PROD
].filter((url, index, arr) => url && arr.indexOf(url) === index); // Remove duplicates and empty strings

console.log('CORS allowed origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' })); // Increase JSON payload limit to 100MB
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Increase URL encoded payload limit

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    frontendUrl: FRONTEND_URL,
    frontendUrlProd: FRONTEND_URL_PROD
  });
});

// Serve uploads (for backward compatibility)
// Serve uploads (for backward compatibility)
let uploadsDir;
try {
  // In Vercel/Serverless, we can only write to /tmp
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    uploadsDir = path.join('/tmp', 'uploads');
  } else {
    uploadsDir = path.join(process.cwd(), 'uploads');
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (error) {
  console.warn('Warning: Could not create uploads directory', error);
  // Fallback to avoid crashing, though uploads won't work
  uploadsDir = path.join(os.tmpdir(), 'uploads');
}

// Only serve static files if directory exists (avoid crashing app.use)
if (uploadsDir && fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir));
}

// Serve Base64 data from Atlas as files
app.get('/api/files/:id/:type', async (req, res) => {
  try {
    const { id, type } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ error: 'File not found' });
    }

    let data, mimeType;
    if (type === 'thumbnail') {
      data = video.thumbnailData;
      mimeType = video.thumbnailMimeType;
    } else if (type === 'video') {
      data = video.videoData;
      mimeType = video.videoMimeType;
    } else {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    if (!data) {
      return res.status(404).json({ error: 'File data not found' });
    }

    const buffer = Buffer.from(data, 'base64');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (e) {
    console.error('Error serving file:', e);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', require('./routes/content'));
app.use('/api/comments', require('./routes/comments'));

// Channels
app.post('/api/channels', async (req, res) => {
  try {
    console.log('Channel creation request body:', req.body);

    const {
      tutorId,
      name,
      organization = '',
      description = '',
      bio = '',
      avatarUrl = '',
      bannerUrl = '',
      coverUrl = '',
      socialLinks = {}
    } = req.body;

    console.log('Extracted data - tutorId:', tutorId, 'name:', name);

    if (!tutorId || !name) {
      console.log('Missing required fields - tutorId:', !!tutorId, 'name:', !!name);
      return res.status(400).json({ error: 'tutorId and name are required' });
    }

    const updateData = {
      tutorId,
      name,
      organization,
      description,
      bio: bio || description, // Use description as bio if bio is empty
      avatarUrl,
      bannerUrl,
      coverUrl: coverUrl || bannerUrl, // Use bannerUrl as coverUrl for backward compatibility
      isActive: true
    };

    // Handle socialLinks explicitly to ensure nested object updates work
    if (socialLinks && typeof socialLinks === 'object') {
      updateData.socialLinks = {
        website: socialLinks.website || '',
        twitter: socialLinks.twitter || '',
        linkedin: socialLinks.linkedin || '',
        youtube: socialLinks.youtube || ''
      };
    }

    console.log('Updating channel with data:', updateData);
    console.log('Social links in updateData:', updateData.socialLinks);

    const channel = await Channel.findOneAndUpdate(
      { tutorId },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Channel saved successfully:', channel._id);
    res.status(201).json({ channel: Channel.format(channel) });
  } catch (e) {
    console.error('Create channel failed', e);
    res.status(500).json({ error: 'Failed to create channel', details: e.message });
  }
});

// Get all active channels
app.get('/api/channels', async (req, res) => {
  try {
    const channels = await Channel.find({ isActive: true })
      .populate('tutorId', 'role creatorType')
      .sort({ subscriberCount: -1, createdAt: -1 });

    res.json({
      channels: channels.map(doc => {
        const formatted = Channel.format(doc);
        // Add role info from populated user
        if (doc.tutorId && doc.tutorId.role) {
          formatted.role = doc.tutorId.role;
          formatted.creatorType = doc.tutorId.creatorType;
          // Fix tutorId to be just the string ID for frontend compatibility
          formatted.tutorId = doc.tutorId._id.toString();
        }
        return formatted;
      })
    });
  } catch (e) {
    console.error('Failed to fetch channels', e);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

app.get('/api/channels/:tutorId', async (req, res) => {
  try {
    console.log('Fetching channel for tutorId:', req.params.tutorId);
    const channel = await Channel.findOne({ tutorId: req.params.tutorId, isActive: true });
    console.log('Channel found:', !!channel);
    if (channel) {
      console.log('Channel data:', {
        name: channel.name,
        organization: channel.organization,
        description: channel.description,
        socialLinks: channel.socialLinks
      });
    }
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json({ channel: Channel.format(channel) });
  } catch (e) {
    console.error('Error fetching channel:', e);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

// Debug endpoint to check tutorId mapping
app.get('/api/debug/tutor-mapping/:tutorId', async (req, res) => {
  try {
    const tutorId = req.params.tutorId;

    const [channel, courses] = await Promise.all([
      Channel.findOne({ tutorId: tutorId }),
      Course.find({ tutorId: tutorId })
    ]);

    res.json({
      tutorId: tutorId,
      channel: channel ? {
        id: channel._id.toString(),
        tutorId: channel.tutorId.toString(),
        name: channel.name
      } : null,
      courses: courses.map(c => ({
        id: c._id.toString(),
        tutorId: c.tutorId.toString(),
        title: c.title
      })),
      courseCount: courses.length
    });
  } catch (e) {
    console.error('Debug mapping error:', e);
    res.status(500).json({ error: 'Debug failed' });
  }
});

// Courses
app.post('/api/courses', async (req, res) => {
  try {
    const { tutorId, title, description = '', thumbnailUrl = '', tags = [], modules = [], isPaid = false, price = 0 } = req.body;
    console.log('Creating course with tutorId:', tutorId, 'title:', title);
    console.log('Number of modules received:', modules.length);
    console.log('Modules data:', JSON.stringify(modules, null, 2));
    console.log('Thumbnail URL:', thumbnailUrl);
    console.log('Pricing:', isPaid ? `Paid ($${price})` : 'Free');

    if (!tutorId || !title) {
      console.log('Missing required fields - tutorId:', !!tutorId, 'title:', !!title);
      return res.status(400).json({ error: 'tutorId and title are required' });
    }

    // Ensure tags is not an empty array for text index compatibility
    const safeTags = Array.isArray(tags) && tags.length > 0 ? tags : undefined;

    console.log('About to create course with modules:', modules.length);

    const course = new Course({
      tutorId,
      title,
      description,
      thumbnailUrl,
      ...(safeTags && { tags: safeTags }),
      modules,
      isPaid,
      price
    });

    console.log('Course object created, about to save...');
    const saved = await course.save();
    console.log('Course saved successfully!');
    console.log('Course ID:', saved._id.toString());
    console.log('Tutor ID:', saved.tutorId.toString());
    console.log('Modules count in saved course:', saved.modules.length);
    console.log('Thumbnail URL in saved course:', saved.thumbnailUrl);

    // Create notifications for all subscribers
    try {
      await Notification.createForNewContent(saved.tutorId, 'course', saved._id, saved.title);
      console.log('Notification created successfully');
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the course creation if notification fails
    }

    res.status(201).json({ course: Course.format(saved) });
  } catch (e) {
    console.error('Create course failed', e);
    console.error('Error details:', e.message);
    console.error('Error stack:', e.stack);
    res.status(500).json({ error: 'Failed to create course', details: e.message });
  }
});

// Update course (title, description, thumbnail, modules)
app.put('/api/courses/:id', async (req, res) => {
  try {
    const update = {};
    const allowed = ['title', 'description', 'thumbnailUrl', 'tags', 'modules', 'isPaid', 'price'];
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];
    const updated = await Course.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!updated) return res.status(404).json({ error: 'Course not found' });

    // Identify if significant content was updated (title, modules, description)
    // For now, we assume any update via this endpoint is worthy of notification if the user decides needed.
    // However, to avoid spam, maybe check if modules or title changed.
    // The request usually sends whole objects.
    // Let's notify on module changes or explicit content updates.
    if (req.body.modules || req.body.title) {
      try {
        await Notification.createForCourseUpdate(updated._id, updated.title, 'updated with new content');
      } catch (notifErr) {
        console.error('Failed to create update notification', notifErr);
      }
    }

    res.json({ course: Course.format(updated) });
  } catch (e) {
    console.error('Update course failed', e);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Basic analytics endpoints
app.post('/api/analytics/events', async (req, res) => {
  try {
    const { type, tutorId, courseId, moduleOrder = 0, userId, commentText = '' } = req.body;
    if (!type || !courseId) return res.status(400).json({ error: 'type and courseId are required' });
    const ev = await AnalyticsEvent.create({ type, tutorId, courseId, moduleOrder, userId, commentText });
    res.status(201).json({ event: ev });
  } catch (e) {
    console.error('Create analytics event failed', e);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

// Aggregated analytics for a tutor (basic)
app.get('/api/analytics/summary/:tutorId', async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    const [watch, likes, comments] = await Promise.all([
      AnalyticsEvent.countDocuments({ tutorId, type: 'watch' }),
      AnalyticsEvent.countDocuments({ tutorId, type: 'like' }),
      AnalyticsEvent.countDocuments({ tutorId, type: 'comment' })
    ]);
    res.json({ tutorId, watch, likes, comments });
  } catch (e) {
    console.error('Analytics summary error', e);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/courses/by-tutor/:tutorId', async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    const courses = await Course.find({ tutorId: tutorId, isActive: true }).sort({ createdAt: -1 });



    res.json({ courses: courses.map(Course.format) });
  } catch (e) {
    console.error('Error fetching courses by tutor:', e);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.isActive) return res.status(404).json({ error: 'Course not found' });
    res.json({ course: Course.format(course) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Get all courses (for recommended section)
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ createdAt: -1 }).limit(50);
    res.json({ courses: courses.map(Course.format), count: courses.length });
  } catch (e) {
    console.error('Error fetching all courses:', e);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Subscriptions
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { studentId, tutorId } = req.body;
    console.log('Subscription request:', { studentId, tutorId });
    if (!studentId || !tutorId) return res.status(400).json({ error: 'studentId and tutorId required' });

    // Validate that studentId is a valid student
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.role !== 'student') return res.status(400).json({ error: 'Only students can subscribe to channels' });

    // Validate that tutorId is a valid organization/tutor
    const tutor = await User.findById(tutorId);
    if (!tutor) return res.status(404).json({ error: 'Tutor not found' });
    if (tutor.role !== 'organization') return res.status(400).json({ error: 'Can only subscribe to organization channels' });
    if (!tutor.isApproved) return res.status(400).json({ error: 'This organization is not yet approved' });

    // Check if already subscribed
    const existingSub = await Subscription.findOne({ studentId, tutorId });
    if (existingSub) {
      console.log('User already subscribed to this channel');
      return res.status(400).json({ error: 'You are already subscribed to this channel' });
    }

    // Create new subscription
    const sub = new Subscription({ studentId, tutorId });
    await sub.save();

    // Update channel subscriber count
    const updatedChannel = await Channel.findOneAndUpdate(
      { tutorId },
      { $inc: { subscriberCount: 1 } },
      { new: true }
    );
    console.log('New subscription created. Updated subscriber count for channel:', tutorId, 'New count:', updatedChannel?.subscriberCount);

    res.status(201).json({ subscription: Subscription.format(sub), isNewSubscription: true });
  } catch (e) {
    console.error('Subscribe failed', e);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

app.delete('/api/subscriptions', async (req, res) => {
  try {
    const { studentId, tutorId } = req.body;
    console.log('Unsubscribe request:', { studentId, tutorId });

    const deleteResult = await Subscription.deleteOne({ studentId, tutorId });

    // Only decrement if subscription was actually deleted
    if (deleteResult.deletedCount > 0) {
      await Channel.findOneAndUpdate(
        { tutorId },
        { $inc: { subscriberCount: -1 } }
      );
      console.log('Decremented subscriber count for channel:', tutorId);
    }

    res.json({ message: 'Unsubscribed' });
  } catch (e) {
    console.error('Unsubscribe failed', e);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

app.get('/api/subscriptions/by-student/:studentId', async (req, res) => {
  try {
    const subs = await Subscription.find({ studentId: req.params.studentId });
    res.json({ subscriptions: subs.map(Subscription.format) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 50;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ notifications: notifications.map(Notification.format) });
  } catch (e) {
    console.error('Failed to fetch notifications:', e);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    res.json({ notification: Notification.format(notification) });
  } catch (e) {
    console.error('Failed to mark notification as read:', e);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    res.json({ message: 'Notification deleted' });
  } catch (e) {
    console.error('Failed to delete notification:', e);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Mark all notifications as read for a user
app.put('/api/notifications/mark-all-read/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    console.error('Failed to mark all notifications as read:', e);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Enrollments
app.post('/api/enrollments', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    console.log('Enrollment request:', { studentId, courseId });

    if (!studentId || !courseId) return res.status(400).json({ error: 'studentId and courseId required' });

    // Validate student exists and is a student
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.role !== 'student') return res.status(400).json({ error: 'Only students can enroll in courses' });

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (!course.isActive) return res.status(400).json({ error: 'Course is not active' });

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ studentId, courseId });
    let isNewEnrollment = !existingEnrollment;

    const enr = await Enrollment.findOneAndUpdate(
      { studentId, courseId },
      { studentId, courseId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Enrollment processed:', {
      studentId,
      courseId,
      isNewEnrollment,
      enrollmentId: enr._id.toString()
    });

    res.status(201).json({
      enrollment: Enrollment.format(enr),
      isNewEnrollment,
      courseTitle: course.title
    });
  } catch (e) {
    console.error('Enroll failed', e);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

app.get('/api/enrollments/by-student/:studentId', async (req, res) => {
  try {
    const enrs = await Enrollment.find({ studentId: req.params.studentId });
    res.json({ enrollments: enrs.map(Enrollment.format) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// Fetch full course details for enrolled courses (My Learning)
app.get('/api/enrollments/my-learning/:studentId', async (req, res) => {
  try {
    const enrs = await Enrollment.find({ studentId: req.params.studentId }).populate('courseId');
    const courses = enrs
      .map(e => e.courseId)
      .filter(c => c != null)
      .map(Course.format);
    res.json({ courses });
  } catch (e) {
    console.error('My Learning fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch my learning' });
  }
});

// Analytics - tutor summary
app.get('/api/analytics/tutor/:tutorId', async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    const [subsCount, courses] = await Promise.all([
      Subscription.countDocuments({ tutorId }),
      Course.find({ tutorId, isActive: true }, { _id: 1 })
    ]);
    const courseIds = courses.map(c => c._id);
    const enrollmentsCount = courseIds.length
      ? await Enrollment.countDocuments({ courseId: { $in: courseIds } })
      : 0;
    // Basic placeholders
    const revenueUsd = enrollmentsCount * 15; // $15 per enrollment (dummy)
    const views = courseIds.length * 100; // dummy views
    res.json({
      tutorId,
      subscribers: subsCount,
      courses: courseIds.length,
      enrollments: enrollmentsCount,
      views,
      revenueUsd
    });
  } catch (e) {
    console.error('Tutor analytics error', e);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Create new video (multipart upload)
app.post('/api/videos', async (req, res) => {
  try {
    if (!multer) {
      return res.status(500).json({ error: 'File upload not available (multer not installed)' });
    }
    const storage = multer.diskStorage({
      destination: function (req, file, cb) { cb(null, uploadsDir); },
      filename: function (req, file, cb) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || '').toLowerCase();
        cb(null, file.fieldname + '_' + unique + ext);
      }
    });
    const upload = multer({ storage }).fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'video', maxCount: 1 },
      { name: 'resource', maxCount: 1 }
    ]);

    upload(req, res, async function (err) {
      if (err) {
        console.error('Upload error', err);
        return res.status(400).json({ error: 'Upload failed' });
      }
      try {
        const title = (req.body.title || '').trim();
        if (!title) return res.status(400).json({ error: 'Title is required' });
        const description = (req.body.description || '').trim();
        const tutorId = req.body.tutorId; // Optional tutorId for notifications
        const durationSeconds = req.body.durationSeconds ? parseInt(req.body.durationSeconds, 10) : 0;
        const tags = (req.body.tags || '').split(',').map(t => t.trim()).filter(Boolean);

        // Ensure tags is not an empty array for text index compatibility
        const safeTags = tags.length > 0 ? tags : undefined;

        const thumbFile = req.files && req.files.thumbnail && req.files.thumbnail[0];
        const videoFile = req.files && req.files.video && req.files.video[0];
        const resourceFile = req.files && req.files.resource && req.files.resource[0];

        console.log('Received files:', {
          thumbnail: thumbFile ? thumbFile.filename : 'none',
          video: videoFile ? videoFile.filename : 'none',
          resource: resourceFile ? resourceFile.filename : 'none'
        });

        // Convert files to Base64 for Atlas storage
        let thumbnailData = '';
        let videoData = '';
        let thumbnailMimeType = '';
        let videoMimeType = '';
        let thumbnailUrl = '';
        let videoUrl = '';
        let resourceUrl = '';

        if (thumbFile) {
          try {
            console.log('Processing thumbnail file:', thumbFile.filename, 'at path:', thumbFile.path);
            // Read file from disk and convert to Base64
            const thumbnailBuffer = fs.readFileSync(thumbFile.path);
            thumbnailData = thumbnailBuffer.toString('base64');
            thumbnailMimeType = thumbFile.mimetype;
            thumbnailUrl = `/uploads/${thumbFile.filename}`; // Keep for backward compatibility
            console.log('Thumbnail processed successfully, size:', thumbnailBuffer.length, 'bytes');
          } catch (fileError) {
            console.error('Error reading thumbnail file:', fileError);
            throw new Error('Failed to process thumbnail file');
          }
        }

        if (videoFile) {
          try {
            console.log('Processing video file:', videoFile.filename, 'at path:', videoFile.path);
            // Read file from disk and convert to Base64
            const videoBuffer = fs.readFileSync(videoFile.path);
            videoData = videoBuffer.toString('base64');
            videoMimeType = videoFile.mimetype;
            videoUrl = `/uploads/${videoFile.filename}`; // Keep for backward compatibility
            console.log('Video processed successfully, size:', videoBuffer.length, 'bytes');
          } catch (fileError) {
            console.error('Error reading video file:', fileError);
            throw new Error('Failed to process video file');
          }
        }

        if (resourceFile) {
          resourceUrl = `/uploads/${resourceFile.filename}`;
        }

        const doc = new Video({
          title,
          description,
          ...(tutorId && { tutorId }),
          durationSeconds,
          ...(safeTags && { tags: safeTags }),
          thumbnailUrl,
          videoUrl,
          thumbnailData,
          videoData,
          videoMimeType
        });

        // Use persistent API URLs instead of ephemeral file paths
        doc.thumbnailUrl = `/api/files/${doc._id}/thumbnail`;
        doc.videoUrl = `/api/files/${doc._id}/video`;
        // Also set resourceUrl if it exists (though we don't have a DB endpoint for it yet, keep as is or update if we added one)

        const saved = await doc.save();

        // Create notifications for all subscribers if tutorId is provided
        if (tutorId) {
          await Notification.createForNewContent(tutorId, 'video', saved._id, saved.title);
        }

        const payload = Video.format(saved);
        return res.status(201).json({ video: { ...payload, resourceUrl } });
      } catch (e2) {
        console.error('Error saving video', e2);
        return res.status(500).json({ error: 'Failed to save video' });
      }
    });
  } catch (e) {
    console.error('Unexpected error in /api/videos POST', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete video (soft delete)
app.delete('/api/videos/:id', async (req, res) => {
  try {
    const updated = await Video.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Video not found' });
    res.json({ message: 'Video deleted' });
  } catch (e) {
    console.error('Error deleting video', e);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Document upload endpoint for course modules
app.post('/api/documents', async (req, res) => {
  try {
    if (!multer) {
      return res.status(500).json({ error: 'File upload not available (multer not installed)' });
    }

    const storage = multer.memoryStorage(); // Use memory storage instead of disk storage

    const upload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        console.log('File filter - received file:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          fieldname: file.fieldname
        });

        // Allow document files
        const allowedTypes = [
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/csv',
          'application/rtf'
        ];

        if (allowedTypes.includes(file.mimetype)) {
          console.log('File type allowed:', file.mimetype);
          cb(null, true);
        } else {
          console.log('File type not allowed:', file.mimetype);
          cb(new Error(`Only document files are allowed (PDF, TXT, DOC, DOCX, XLS, XLSX, PPT, PPTX, CSV, RTF). Received: ${file.mimetype}`), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
      }
    }).single('document');

    upload(req, res, async function (err) {
      console.log('Document upload request received');
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      console.log('Request file:', req.file);

      if (err) {
        console.error('Document upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size too large. Maximum 50MB allowed.' });
        }
        return res.status(400).json({ error: err.message || 'Upload failed' });
      }

      try {
        if (!req.file) {
          console.error('No file received in request');
          return res.status(400).json({ error: 'No document uploaded' });
        }

        console.log('Document uploaded successfully:', req.file.originalname);
        console.log('File details:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });

        // Convert file to Base64 for database storage
        const documentData = req.file.buffer.toString('base64');
        const documentType = req.file.mimetype;
        const documentName = req.file.originalname;

        // Generate a unique document URL (for compatibility with frontend)
        const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const documentUrl = `data:${documentType};base64,${documentData}`;

        console.log('Document converted to Base64, size:', documentData.length, 'characters');

        // ------------------------------------------------------------------
        // AI BACKEND INTEGRATION: Upload PDF to create lesson
        // ------------------------------------------------------------------
        let lessonId = '';
        if (documentType === 'application/pdf') {
          try {
            console.log('Uploading PDF to AI Backend...');
            const formData = new FormData();
            const blob = new Blob([req.file.buffer], { type: documentType });
            formData.append('file', blob, documentName);

            // Use title from body or filename
            const title = req.body.title || documentName.replace('.pdf', '');

            const aiRes = await fetch(`${AI_BACKEND_URL}/lesson/upload?title=${encodeURIComponent(title)}`, {
              method: 'POST',
              body: formData
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              lessonId = aiData.lesson_id;
              console.log('AI Backend Lesson Created:', lessonId);
            } else {
              console.error('AI Backend returned error:', await aiRes.text());
            }
          } catch (aiErr) {
            console.error('Failed to upload to AI Backend:', aiErr);
            // Continue without failing the main upload
          }
        }

        res.status(200).json({
          success: true,
          documentUrl: documentUrl,
          documentType: documentType,
          documentName: documentName,
          lessonId: lessonId,
          message: 'Document uploaded successfully'
        });

      } catch (e2) {
        console.error('Error processing document upload:', e2);
        return res.status(500).json({ error: 'Failed to process document upload' });
      }
    });
  } catch (e) {
    console.error('Unexpected error in /api/documents POST:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Image upload endpoint for channel avatars and banners
app.post('/api/images', async (req, res) => {
  try {
    if (!multer) {
      return res.status(500).json({ error: 'File upload not available (multer not installed)' });
    }

    const storage = multer.diskStorage({
      destination: function (req, file, cb) { cb(null, uploadsDir); },
      filename: function (req, file, cb) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || '').toLowerCase();
        cb(null, 'image_' + unique + ext);
      }
    });

    const upload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      }
    }).single('file');

    upload(req, res, async function (err) {
      if (err) {
        console.error('Image upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
        }
        return res.status(400).json({ error: err.message || 'Upload failed' });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Image uploaded successfully:', req.file.filename);

        // Return the image URL
        const imageUrl = `/uploads/${req.file.filename}`;

        res.status(200).json({
          success: true,
          imageUrl: imageUrl,
          thumbnailUrl: imageUrl, // For compatibility with frontend
          message: 'Image uploaded successfully'
        });

      } catch (e2) {
        console.error('Error processing image upload:', e2);
        return res.status(500).json({ error: 'Failed to process image upload' });
      }
    });
  } catch (e) {
    console.error('Unexpected error in /api/images POST:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Comments API
// Create a new comment
app.post('/api/comments', async (req, res) => {
  try {
    const { studentId, courseId, moduleIndex, moduleType, content } = req.body;

    if (!studentId || !courseId || moduleIndex === undefined || !moduleType || !content) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Comment is too long (max 1000 characters)' });
    }

    const comment = new Comment({
      studentId,
      courseId,
      moduleIndex,
      moduleType,
      content: content.trim()
    });

    const savedComment = await comment.save();

    // Get course details for notification
    const course = await Course.findById(courseId).populate('tutorId', 'name email');
    if (course) {
      // Create notification for tutor
      await Notification.create({
        userId: course.tutorId._id,
        type: 'comment',
        title: 'New Comment on Your Course',
        message: `A student commented on "${course.title}" - Module ${moduleIndex + 1}`,
        relatedId: savedComment._id,
        relatedType: 'comment',
        isRead: false
      });
    }

    // Populate student details for response
    const populatedComment = await Comment.findById(savedComment._id)
      .populate('studentId', 'name email')
      .populate('courseId', 'title');

    res.status(201).json({
      comment: Comment.format(populatedComment),
      message: 'Comment created successfully'
    });
  } catch (e) {
    console.error('Create comment failed:', e);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Get comments for a specific module
app.get('/api/comments/:courseId/:moduleIndex', async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;

    const comments = await Comment.find({
      courseId,
      moduleIndex: parseInt(moduleIndex)
    })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      comments: comments.map(comment => Comment.format(comment))
    });
  } catch (e) {
    console.error('Get comments failed:', e);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Get all comments for a course (for tutor dashboard)
app.get('/api/comments/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const comments = await Comment.find({ courseId })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      comments: comments.map(comment => Comment.format(comment))
    });
  } catch (e) {
    console.error('Get course comments failed:', e);
    res.status(500).json({ error: 'Failed to fetch course comments' });
  }
});

// Reply to a comment (tutor only)
app.post('/api/comments/:commentId/reply', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { tutorId, replyContent } = req.body;

    if (!tutorId || !replyContent || replyContent.trim().length === 0) {
      return res.status(400).json({ error: 'Tutor ID and reply content are required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verify the tutor owns the course
    const course = await Course.findById(comment.courseId);
    if (!course || course.tutorId.toString() !== tutorId) {
      return res.status(403).json({ error: 'Unauthorized to reply to this comment' });
    }

    comment.tutorReply = {
      content: replyContent.trim(),
      repliedAt: new Date(),
      repliedBy: tutorId
    };
    comment.isResolved = true;

    const updatedComment = await comment.save();

    // Populate for response
    const populatedComment = await Comment.findById(updatedComment._id)
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .populate('tutorReply.repliedBy', 'name email');

    res.json({
      comment: Comment.format(populatedComment),
      message: 'Reply added successfully'
    });
  } catch (e) {
    console.error('Reply to comment failed:', e);
    res.status(500).json({ error: 'Failed to reply to comment' });
  }
});

// Get comments for tutor dashboard (all courses by tutor)
app.get('/api/tutor/:tutorId/comments', async (req, res) => {
  try {
    const { tutorId } = req.params;

    // Get all courses by this tutor
    const courses = await Course.find({ tutorId }).select('_id');
    const courseIds = courses.map(course => course._id);

    const comments = await Comment.find({
      courseId: { $in: courseIds }
    })
      .populate('studentId', 'name email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    res.json({
      comments: comments.map(comment => Comment.format(comment))
    });
  } catch (e) {
    console.error('Get tutor comments failed:', e);
    res.status(500).json({ error: 'Failed to fetch tutor comments' });
  }
});

// Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Backend is running 🚀",
    environment: NODE_ENV,
    database: "MongoDB Atlas",
    timestamp: new Date().toISOString()
  });
});

// API endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    environment: NODE_ENV,
    database: "MongoDB Atlas",
    timestamp: new Date().toISOString()
  });
});

// Get all messages from MongoDB
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.getRecentMessages(50);
    res.json({
      messages: messages.map(msg => msg.formatMessage()),
      count: messages.length
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Create new message in MongoDB
app.post("/api/messages", async (req, res) => {
  try {
    const { text, sender = 'Anonymous' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const newMessage = new Message({
      text: text.trim(),
      sender: sender.trim()
    });

    const savedMessage = await newMessage.save();

    res.status(201).json({
      message: "Message created successfully",
      data: savedMessage.formatMessage()
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: "Failed to create message" });
  }
});

// Get message by ID
app.get("/api/messages/:id", async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json({ message: message.formatMessage() });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: "Failed to fetch message" });
  }
});

// Update message
app.put("/api/messages/:id", async (req, res) => {
  try {
    const { text, sender } = req.body;
    const updateData = {};

    if (text !== undefined) updateData.text = text.trim();
    if (sender !== undefined) updateData.sender = sender.trim();

    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({
      message: "Message updated successfully",
      data: updatedMessage.formatMessage()
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: "Failed to update message" });
  }
});

// Delete message (soft delete)
app.delete("/api/messages/:id", async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Search messages
app.get("/api/messages/search/:query", async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const messages = await Message.find({
      $text: { $search: searchQuery },
      isActive: true
    }).sort({ timestamp: -1 }).limit(20);

    res.json({
      messages: messages.map(msg => msg.formatMessage()),
      count: messages.length,
      query: searchQuery
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: "Failed to search messages" });
  }
});

// Progress tracking endpoints
app.post('/api/progress', async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      moduleIndex,
      moduleType,
      progress = 100,
      watchTimeSeconds = 0,
      lastPositionSeconds = 0
    } = req.body;
    console.log('Recording progress:', { studentId, courseId, moduleIndex, moduleType, progress, watchTimeSeconds, lastPositionSeconds });

    if (!studentId || !courseId || moduleIndex === undefined || !moduleType) {
      return res.status(400).json({ error: 'studentId, courseId, moduleIndex, and moduleType are required' });
    }

    // Validate inputs
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ error: 'Invalid student' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ error: 'Course not found' });
    }

    // Prepare update data
    const updateData = {
      studentId,
      courseId,
      moduleIndex,
      moduleType,
      progress,
      lastWatchedAt: new Date(),
      watchTimeSeconds,
      lastPositionSeconds
    };

    // Only update completedAt if progress is 100%
    if (progress >= 100) {
      updateData.completedAt = new Date();
    }

    // Upsert progress record
    const progressRecord = await Progress.findOneAndUpdate(
      { studentId, courseId, moduleIndex, moduleType },
      updateData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('Progress saved:', progressRecord);
    res.status(201).json({ progress: Progress.format(progressRecord) });
  } catch (e) {
    console.error('Failed to save progress:', e);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

app.get('/api/progress/:studentId/:courseId', async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    console.log('Fetching progress for student:', studentId, 'course:', courseId);

    const progressRecords = await Progress.find({ studentId, courseId }).sort({ moduleIndex: 1 });
    console.log('Found progress records:', progressRecords.length);

    res.json({ progress: progressRecords.map(Progress.format) });
  } catch (e) {
    console.error('Failed to fetch progress:', e);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get progress for a specific module
app.get('/api/progress/:studentId/:courseId/:moduleIndex', async (req, res) => {
  try {
    const { studentId, courseId, moduleIndex } = req.params;
    console.log('Fetching progress for student:', studentId, 'course:', courseId, 'module:', moduleIndex);

    const progressRecord = await Progress.findOne({
      studentId,
      courseId,
      moduleIndex: parseInt(moduleIndex)
    });

    if (!progressRecord) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    console.log('Found progress record:', progressRecord);
    res.json({ progress: Progress.format(progressRecord) });
  } catch (e) {
    console.error('Failed to fetch module progress:', e);
    res.status(500).json({ error: 'Failed to fetch module progress' });
  }
});

// Like/Unlike a module
app.post('/api/likes', async (req, res) => {
  try {
    const { studentId, courseId, moduleIndex, moduleType } = req.body;

    if (!studentId || !courseId || moduleIndex === undefined || !moduleType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ error: 'Invalid student' });
    }

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ error: 'Course not found' });
    }

    // Check if like already exists
    const existingLike = await Like.findOne({
      studentId,
      courseId,
      moduleIndex,
      moduleType
    });

    let isLiked;
    let likeCount;

    if (existingLike) {
      // Unlike - remove the like
      await Like.findByIdAndDelete(existingLike._id);
      isLiked = false;

      // Get updated like count
      likeCount = await Like.countDocuments({
        courseId,
        moduleIndex,
        moduleType
      });
    } else {
      // Like - create new like
      const newLike = new Like({
        studentId,
        courseId,
        moduleIndex,
        moduleType
      });
      await newLike.save();
      isLiked = true;

      // Get updated like count
      likeCount = await Like.countDocuments({
        courseId,
        moduleIndex,
        moduleType
      });
    }

    res.json({ isLiked, likeCount });
  } catch (e) {
    console.error('Failed to toggle like:', e);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Get like status and count for a module
app.get('/api/likes/:courseId/:moduleIndex', async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;
    const studentId = req.query.studentId;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Check if student has liked this module
    const userLike = await Like.findOne({
      studentId,
      courseId,
      moduleIndex: parseInt(moduleIndex)
    });

    // Get total like count for this module
    const likeCount = await Like.countDocuments({
      courseId,
      moduleIndex: parseInt(moduleIndex)
    });

    res.json({
      isLiked: !!userLike,
      likeCount
    });
  } catch (e) {
    console.error('Failed to fetch likes:', e);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// Continue Watching endpoint - get recently watched content for a student
app.get('/api/continue-watching/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    console.log('Fetching continue watching for student:', studentId);

    // Validate student exists and is a student
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.role !== 'student') return res.status(400).json({ error: 'Only students can access continue watching' });

    // Get progress records where user has watched but not completed (progress < 100)
    const progressRecords = await Progress.find({
      studentId,
      progress: { $lt: 100, $gt: 0 } // Watched but not completed
    })
      .populate('courseId', 'title description thumbnailUrl modules')
      .sort({ lastWatchedAt: -1 })
      .limit(limit);

    // Format the response with course and module information
    const continueWatching = progressRecords.map(record => {
      const course = record.courseId;
      const module = course.modules[record.moduleIndex];

      return {
        id: record._id.toString(),
        courseId: course._id.toString(),
        courseTitle: course.title,
        courseDescription: course.description,
        courseThumbnail: course.thumbnailUrl,
        moduleIndex: record.moduleIndex,
        moduleTitle: module ? module.title : `Module ${record.moduleIndex + 1}`,
        moduleType: record.moduleType,
        progress: record.progress,
        lastWatchedAt: record.lastWatchedAt,
        watchTimeSeconds: record.watchTimeSeconds,
        lastPositionSeconds: record.lastPositionSeconds,
        moduleDuration: module ? module.durationSeconds : 0
      };
    });

    console.log('Found continue watching items:', continueWatching.length);
    res.json({ continueWatching });
  } catch (e) {
    console.error('Failed to fetch continue watching:', e);
    res.status(500).json({ error: 'Failed to fetch continue watching' });
  }
});


// ------------------------------------------------------------------
// AI BUDDY ROUTES
// ------------------------------------------------------------------

// Get Buddy Configuration
app.get('/api/buddy/config/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('buddyConfig');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Return default if not set, or merged with defaults
    res.json({ config: user.buddyConfig });
  } catch (e) {
    console.error('Failed to fetch buddy config:', e);
    res.status(500).json({ error: 'Failed to fetch buddy config' });
  }
});

// Update Buddy Configuration
app.put('/api/buddy/config/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const newConfig = req.body;

    console.log(`Updating buddy config for user ${userId}:`, newConfig);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { buddyConfig: newConfig } },
      { new: true, runValidators: true }
    ).select('buddyConfig');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Buddy configuration saved', config: user.buddyConfig });
  } catch (e) {
    console.error('Failed to update buddy config:', e);
    res.status(500).json({ error: 'Failed to update buddy config' });
  }
});

// Start a tutoring session
app.post('/api/buddy/start-session', async (req, res) => {
  try {
    const { userId, lessonId } = req.body;
    if (!userId || !lessonId) {
      return res.status(400).json({ error: 'userId and lessonId are required' });
    }

    console.log(`Starting AI session for user ${userId} and lesson ${lessonId}`);

    const aiRes = await fetch(`${AI_BACKEND_URL}/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, lesson_id: lessonId })
    });

    if (aiRes.ok) {
      const data = await aiRes.json();
      res.json(data);
    } else {
      const errorText = await aiRes.text();
      console.error('AI Backend error:', errorText);
      res.status(aiRes.status).json({ error: 'Failed to start AI session' });
    }
  } catch (e) {
    console.error('Error starting AI session:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat with Buddy
app.post('/api/buddy/chat', async (req, res) => {
  try {
    const { message, conversationHistory, userId, buddyConfig, sessionId } = req.body;

    // If we have a sessionId, use the AI backend
    if (sessionId) {
      console.log(`Sending message to AI session ${sessionId}: ${message}`);
      const aiRes = await fetch(`${AI_BACKEND_URL}/session/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question: message })
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        return res.json({ response: data.answer });
      } else {
        console.error('AI Backend chat error:', await aiRes.text());
        // Fallback to default response if AI fails
      }
    }

    // Default/Demo response if no session or AI fails
    console.log('Using default buddy response (no session or AI error)');
    const buddyName = buddyConfig?.buddyName || 'Buddy';
    res.json({
      response: `I'm ${buddyName}! I can help you study. Open a document to start a tutoring session!`
    });

  } catch (e) {
    console.error('Failed to chat with buddy:', e);
    res.status(500).json({ error: 'Failed to chat with buddy' });
  }
});

// ------------------------------------------------------------------
// NOTIFICATION ROUTES
// ------------------------------------------------------------------

// Get notifications for student
app.get('/api/notifications/by-student/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Get latest 50 notifications, sorted by creation date
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications: notifications.map(n => Notification.format(n)) });
  } catch (e) {
    console.error('Failed to fetch notifications:', e);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ notification: Notification.format(notification) });
  } catch (e) {
    console.error('Failed to mark notification as read:', e);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for a user
app.put('/api/notifications/mark-all-read/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    console.error('Failed to mark all notifications as read:', e);
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (e) {
    console.error('Failed to delete notification:', e);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
    console.log(`🗄️ Database: MongoDB Atlas`);
  });
}

module.exports = app;
