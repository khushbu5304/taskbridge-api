const express = require('express');
const projectsRouter = require('./controllers/projects.controller');
const auditRouter = require('./controllers/audit.controller');
const notificationsRouter = require('./controllers/notifications.controller');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'taskbridge-api',
    status: 'running',
    version: '1.0.0',
    routes: ['/v1/projects', '/v1/audit', '/v1/notifications']
  });
});

app.use('/v1/projects', projectsRouter);
app.use('/v1/audit', auditRouter);
app.use('/v1/notifications', notificationsRouter);

app.use(errorHandler);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

module.exports = app;
