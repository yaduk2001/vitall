const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Content = require('../models/Content');
const { authMiddleware } = require('../utils/jwt');

// Helper to validate ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// GET /api/comments/content/:contentId - Get comments for a specific content (video)
router.get('/content/:contentId', async (req, res) => {
    try {
        const { contentId } = req.params;

        if (!isValidObjectId(contentId)) {
            return res.status(400).json({ error: 'Invalid content ID' });
        }

        const comments = await Comment.find({ contentId })
            .populate('studentId', 'fullName avatarUrl role')
            .populate('replies.userId', 'fullName avatarUrl role') // Future proofing
            .sort({ createdAt: -1 });

        // Format comments to include like count and user like status (if auth user provided, hard to do without auth middleware here, but usually read is public)
        // For now returning formatted comments

        res.json({
            comments: comments.map(c => ({
                ...Comment.format(c),
                user: c.studentId ? {
                    id: c.studentId._id,
                    fullName: c.studentId.fullName,
                    avatarUrl: c.studentId.avatarUrl,
                    role: c.studentId.role
                } : null
            }))
        });
    } catch (e) {
        console.error('Error fetching comments:', e);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST /api/comments/content/:contentId - Post a new comment
router.post('/content/:contentId', authMiddleware, async (req, res) => {
    try {
        const { contentId } = req.params;
        const { content } = req.body;

        if (!content) return res.status(400).json({ error: 'Comment content is required' });

        if (!isValidObjectId(contentId)) {
            return res.status(400).json({ error: 'Invalid content ID' });
        }

        // Validate content exists
        const video = await Content.findById(contentId);
        if (!video) return res.status(404).json({ error: 'Content not found' });

        const comment = new Comment({
            contentId,
            studentId: req.user.id,
            content,
            // moduleIndex/type not needed for generic content
        });

        await comment.save();

        // Populate user details for immediate display
        await comment.populate('studentId', 'fullName avatarUrl role');

        res.status(201).json({
            comment: {
                ...Comment.format(comment),
                user: {
                    id: comment.studentId._id,
                    fullName: comment.studentId.fullName,
                    avatarUrl: comment.studentId.avatarUrl,
                    role: comment.studentId.role
                }
            }
        });
    } catch (e) {
        console.error('Error posting comment:', e);
        res.status(500).json({ error: 'Failed to post comment' });
    }
});

// POST /api/comments/:id/like - Toggle like on a comment
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const userId = req.user.id;
        const likeIndex = comment.likes.indexOf(userId);

        if (likeIndex === -1) {
            // Like
            comment.likes.push(userId);
        } else {
            // Unlike
            comment.likes.splice(likeIndex, 1);
        }

        await comment.save();

        res.json({
            likes: comment.likes.length,
            isLiked: likeIndex === -1
        });
    } catch (e) {
        console.error('Error toggling like:', e);
        res.status(500).json({ error: 'Failed to like comment' });
    }
});

module.exports = router;
