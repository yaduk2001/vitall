const express = require('express');
const Content = require('../models/Content');
const { authMiddleware } = require('../utils/jwt');
const User = require('../models/User');

const router = express.Router();

// POST /api/content - Upload new content
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, type, thumbnailUrl, contentUrl, metadata, tags, duration, quality, isHDR } = req.body;

        if (!title || !contentUrl) {
            return res.status(400).json({ error: 'Title and content URL are required' });
        }

        // Verify user is a content creator
        if (req.user.role !== 'content_creator') {
            return res.status(403).json({ error: 'Only content creators can upload here' });
        }

        const content = new Content({
            creatorId: req.user.id,
            title,
            description,
            type,
            thumbnailUrl,
            contentUrl,
            duration,
            quality: quality || '',
            isHDR: isHDR || false,
            metadata: metadata || {},
            tags: tags || []
        });

        // Generate Custom ID for Content
        if (req.user.role === 'content_creator' && req.user.creatorType) {
            const prefixMap = {
                'vlogger': 'VCONT',
                'music_company': 'MCONT',
                'corporate': 'CCONT',
                'medical': 'HCONT'
            };
            const prefix = prefixMap[req.user.creatorType];
            if (prefix) {
                // Generate a unique 4-digit alphanumeric ID
                for (let i = 0; i < 5; i++) {
                    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase().padStart(4, '0');
                    const candidate = `${prefix}-${randomSuffix}`;
                    const exists = await Content.findOne({ customId: candidate });
                    if (!exists) {
                        content.customId = candidate;
                        break;
                    }
                }
                // Fallback if needed
                if (!content.customId) {
                    const fallbackSuffix = Date.now().toString(36).slice(-4).toUpperCase();
                    content.customId = `${prefix}-${fallbackSuffix}`;
                }
            }
        }

        await content.save();

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

        const formattedContent = content.toObject();
        // Handle legacy likes (number) vs new likes (array)
        if (typeof formattedContent.likes === 'number') {
            formattedContent.likeCount = formattedContent.likes;
            formattedContent.likes = [];
        } else {
            formattedContent.likeCount = formattedContent.likes ? formattedContent.likes.length : 0;
            formattedContent.likes = formattedContent.likes || [];
        }

        res.json(formattedContent);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch content details' });
    }
});

// POST /api/content/:id/like - Toggle like on content
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) return res.status(404).json({ error: 'Content not found' });

        const userId = req.user.id;

        // Handle migration from number to array if needed
        if (typeof content.likes === 'number') {
            content.likes = []; // Reset old count to array
        }

        // Initialize if undefined
        if (!content.likes) content.likes = [];

        const likeIndex = content.likes.indexOf(userId);

        if (likeIndex === -1) {
            // Like
            content.likes.push(userId);
        } else {
            // Unlike
            content.likes.splice(likeIndex, 1);
        }

        await content.save();

        res.json({
            likes: content.likes.length,
            isLiked: likeIndex === -1
        });
    } catch (e) {
        console.error('Error toggling content like:', e);
        res.status(500).json({ error: 'Failed to like content' });
    }
});

module.exports = router;
