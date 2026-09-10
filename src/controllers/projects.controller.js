const express = require('express');
const router = express.Router();
const ProjectService = require('../projects/project.service');
const auth = require('../middleware/auth');
const { ValidationError } = require('../lib/errors');

/**
 * Projects controller routes
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const actor = req.user;
    const payload = Object.assign({}, req.body, { organizationId: actor.organizationId });
    const project = await ProjectService.createProject(payload, actor);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.patch('/:projectId/status', auth, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user.organizationId;
    const result = await ProjectService.updateStatus(projectId, organizationId, req.body);
    res.json(result.after);
  } catch (err) {
    next(err);
  }
});

router.get('/team/:teamId', auth, async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const organizationId = req.user.organizationId;
    const projects = await ProjectService.getByTeam(teamId, organizationId);
    res.json({ data: projects });
  } catch (err) {
    next(err);
  }
});

router.delete('/:projectId', auth, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user.organizationId;
    const out = await ProjectService.deleteProject(projectId, organizationId);
    res.json(out);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
