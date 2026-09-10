const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationService = require('../notifications/notification.service');

// POST /notifications -> create
router.post('/', auth, async (req, res, next) => {
  try {
    const actor = req.user;
    const created = await NotificationService.createNotification(req.body, actor);
    res.status(202).json(created);
  } catch (err) {
    next(err);
  }
});

// GET /notifications/:userId
router.get('/:userId', auth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const actor = req.user;
    const items = await NotificationService.listForUser(userId, actor);
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.user;
    const updated = await NotificationService.markRead(id, actor);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
