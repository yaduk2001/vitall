const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');
const { authMiddleware } = require('../utils/jwt');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const Channel = require('../models/Channel');
const Course = require('../models/Course');
const Video = require('../models/Video');
const Enrollment = require('../models/Enrollment');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role = 'student', creatorType } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'fullName, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      if (existing.isBlocked) {
        return res.status(403).json({ error: 'You cannot register your mail id has been blocked' });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isApproved = role === 'student' || role === 'admin';
    const user = await User.create({ fullName, email, passwordHash, role, creatorType, isApproved });

    // Auto-create channel skeleton for tutors (organization role)
    if (role === 'organization') {
      try {
        await Channel.findOneAndUpdate(
          { tutorId: user._id },
          { tutorId: user._id, name: fullName, bio: '', avatarUrl: user.avatarUrl || '', coverUrl: '' },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (e) {
        console.error('Failed to auto-create channel', e);
      }
    }

    if (role === 'organization') {
      return res.status(201).json({
        message: 'Tutor registration submitted for approval',
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
          avatarUrl: user.avatarUrl || ''
        }
      });
    }

    const token = signToken({ id: user._id, role: user.role });
    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        avatarUrl: user.avatarUrl || ''
      },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.isApproved) {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'You cannot register your mail id has been blocked' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended. Please contact admin.' });
    }

    // Update Streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastLogin = user.streakLastLoginDate ? new Date(user.streakLastLoginDate) : null;
    if (lastLogin) lastLogin.setHours(0, 0, 0, 0);

    let streak = user.streak || 0;

    if (!lastLogin) {
      streak = 1;
    } else {
      const diffTime = Math.abs(today - lastLogin);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 1;
      }
    }

    if (!lastLogin || today > lastLogin) {
      user.streak = streak;
      user.streakLastLoginDate = new Date();
      await user.save();
    }

    const token = signToken({ id: user._id, role: user.role });
    return res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        avatarUrl: user.avatarUrl || '',
        streak: user.streak
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Admin routes
router.get('/admin/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
    // Filter out the requesting admin to avoid self-suspension if desired, or just show all
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/admin/organizations', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const orgs = await User.find({ role: { $in: ['organization', 'content_creator'] } }, { passwordHash: 0 }).sort({ createdAt: -1 });
    res.json({ organizations: orgs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

router.post('/admin/approve/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const user = await User.findByIdAndUpdate(req.params.userId, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User approved successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

router.post('/admin/reject/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'User rejected and deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

router.post('/admin/toggle-status/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent suspending self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot suspend your own account' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.json({ message: `User ${user.isSuspended ? 'suspended' : 'activated'}`, isSuspended: user.isSuspended });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

router.put('/admin/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { email, password } = req.body;
    const updates = {};

    if (email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing && existing._id.toString() !== req.user.id) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      updates.email = email.toLowerCase().trim();
    }

    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length === 0) return res.json({ message: 'No changes made' });

    await User.findByIdAndUpdate(req.user.id, updates);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/admin/block-user/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot block an admin' });

    // Block logic
    user.isBlocked = true;
    user.isSuspended = true; // Also suspend ensuring no login bypass
    await user.save();

    res.json({ message: 'User blocked permanently', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

const Notification = require('../models/Notification');
router.post('/admin/broadcast', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { message, targetRoles } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    let query = { role: { $ne: 'admin' } };

    // If targetRoles is provided and has items, filter by those roles
    if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
      // Validate roles if needed, or just trust the admin input logic (schema will filter invalid ones effectively by not matching)
      query.role = { $in: targetRoles };
    }

    // Send to filtered users
    const users = await User.find(query);
    const notifications = users.map(u => ({
      userId: u._id,
      type: 'system_alert',
      title: 'Admin Announcement 📢',
      message: message,
      relatedId: null,
      relatedType: null
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: `Broadcast sent to ${notifications.length} users` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to broadcast message' });
  }
});

// Admin Dashboard Stats
router.get('/admin/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalCourses,
      totalVideos,
      enrollments,
      recentUsers
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ lastActive: { $gte: fiveMinutesAgo } }),
      Course.countDocuments({}),
      Video.countDocuments({}),
      Enrollment.find({}).populate('courseId', 'price'),
      User.find({}, 'fullName email createdAt role').sort({ createdAt: -1 }).limit(5)
    ]);

    // Calculate approx revenue from enrollments (sum of course prices)
    const totalRevenue = enrollments.reduce((sum, enr) => {
      // @ts-ignore
      return sum + (enr.courseId?.price || 0);
    }, 0);

    // Mock graph data (since we don't have historical snapshots easily available without complex aggregation)
    // We can aggregate users created in last 7 days for a real "Growth" chart
    const usersLast7Days = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      totalContent: totalCourses + totalVideos,
      totalRevenue,
      recentUsers,
      graphData: usersLast7Days
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Admin Content Management endpoints
router.get('/admin/content', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const [courses, videos] = await Promise.all([
      Course.find({}).populate('tutorId', 'fullName email').sort({ createdAt: -1 }),
      Video.find({}).populate('tutorId', 'fullName email').sort({ createdAt: -1 })
    ]);

    // Normalize data structure
    const allContent = [
      ...courses.map(c => ({
        _id: c._id,
        title: c.title,
        type: 'course',
        isActive: c.isActive,
        createdAt: c.createdAt,
        creator: c.tutorId ? c.tutorId.fullName : 'Unknown',
        price: c.price || 0,
        isPaid: c.isPaid
      })),
      ...videos.map(v => ({
        _id: v._id,
        title: v.title,
        type: 'video',
        isActive: v.isActive,
        createdAt: v.createdAt,
        creator: v.tutorId ? v.tutorId.fullName : 'Unknown',
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ content: allContent });
  } catch (err) {
    console.error('Fetch content error:', err);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.get('/admin/content/:type/:id/details', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { type, id } = req.params;

    let item;
    if (type === 'course') {
      item = await Course.findById(id).lean();
    } else if (type === 'video') {
      item = await Video.findById(id).lean();
    } else {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    if (!item) return res.status(404).json({ error: 'Content not found' });

    // Send back the raw item which includes videoUrl, videoData, modules, etc.
    // The frontend will handle whether to stream via URL or display Base64
    res.json(item);
  } catch (err) {
    console.error('Fetch content details error:', err);
    res.status(500).json({ error: 'Failed to fetch content details' });
  }
});

router.post('/admin/content/toggle/:type/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { type, id } = req.params;

    let item;
    if (type === 'course') {
      item = await Course.findById(id);
    } else if (type === 'video') {
      item = await Video.findById(id);
    } else {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    if (!item) return res.status(404).json({ error: 'Content not found' });

    item.isActive = !item.isActive;
    await item.save();

    res.json({ message: `Content ${item.isActive ? 'enabled' : 'disabled'}`, isActive: item.isActive });
  } catch (err) {
    console.error('Toggle content error:', err);
    res.status(500).json({ error: 'Failed to toggle content status' });
  }
});

router.delete('/admin/content/:type/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { type, id } = req.params;

    if (type === 'course') {
      await Course.findByIdAndDelete(id);
    } else if (type === 'video') {
      await Video.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    res.json({ message: 'Content deleted permanently' });
  } catch (err) {
    console.error('Delete content error:', err);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Authenticated user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Update Streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastLogin = user.streakLastLoginDate ? new Date(user.streakLastLoginDate) : null;
    if (lastLogin) lastLogin.setHours(0, 0, 0, 0);

    let streak = user.streak || 0;

    if (!lastLogin) {
      streak = 1;
    } else {
      const diffTime = Math.abs(today - lastLogin);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak += 1;
      } else if (diffDays > 1) {
        streak = 1;
      }
    }

    if (!lastLogin || today > lastLogin) {
      user.streak = streak;
      user.streakLastLoginDate = new Date();
      await user.save();
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      avatarUrl: user.avatarUrl || '',
      streak: user.streak
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update avatar (expects base64 image data URL)
router.post('/me/avatar', authMiddleware, async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData || typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image data' });
    }
    const [meta, base64] = imageData.split(',');
    const ext = meta.includes('image/png') ? 'png' : meta.includes('image/jpeg') ? 'jpg' : 'png';
    const buffer = Buffer.from(base64, 'base64');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    const filename = `avatar_${req.user.id}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${filename}`;
    await User.findByIdAndUpdate(req.user.id, { avatarUrl: publicUrl });
    res.json({ avatarUrl: publicUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

module.exports = router;
