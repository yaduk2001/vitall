const express = require('express');
const Content = require('../models/Content');
const { authMiddleware } = require('../utils/jwt');
const User = require('../models/User');

const router = express.Router();

// POST /api/content - Upload new content
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, type, thumbnailUrl, contentUrl, metadata, tags, duration } = req.body;

        if (!title || !contentUrl) {
            return res.status(400).json({ error: 'Title and content URL are required' });
        }

        // Verify user is a content creator
        if (req.user.role !== 'content_creator') {
            return res.status(403).json({ error: 'Only content creators can upload here' });
        }

        const content = await Content.create({
            creatorId: req.user.id,
            title,
            description,
            type,
            thumbnailUrl,
            contentUrl,
            duration,
            metadata: metadata || {},
            tags: tags || []
        });

        res.status(201).json({ message: 'Content published successfully', content });
    } catch (err) {
        console.error('Content upload error:', err);
        res.status(500).json({ error: 'Failed to publish content' });
    }
});

// GET /api/content - List content (optional filters)
router.get('/', async (req, res) => {
    try {
        const { type, creatorId, search } = req.query;
        let query = { isActive: true };

        if (type) query.type = type;
        if (creatorId) query.creatorId = creatorId;
        if (search) {
            query.$text = { $search: search };
        }

        // Populate creator details
        const content = await Content.find(query)
            .sort({ createdAt: -1 })
            .populate('creatorId', 'fullName avatarUrl creatorType')
            .limit(50);

        res.json({ content });
    } catch (err) {
        console.error('Fetch content error:', err);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// GET /api/content/:id - Get single content details
router.get('/:id', async (req, res) => {
    try {
        const content = await Content.findById(req.params.id).populate('creatorId', 'fullName avatarUrl creatorType');
        if (!content) return res.status(404).json({ error: 'Content not found' });

        // Increment views (simple implementation)
        content.views += 1;
        await content.save();

        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch content details' });
    }
});

module.exports = router;
