const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AuditService = require('../audit/audit.service');

// POST /audit
router.post('/', auth, async (req, res, next) => {
  try {
    const actor = req.user;
    const entry = await AuditService.createAudit(req.body, actor);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// GET /audit/:projectId?from=&to=&eventType=
router.get('/:projectId', auth, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { from, to, eventType } = req.query;
    const actions = eventType ? eventType.split(',') : undefined;
    const orgId = req.user.organizationId;
    const rows = await AuditService.queryByProject(projectId, orgId, { from, to, actions });
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
