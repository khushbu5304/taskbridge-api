const express = require('express');
const projectsRouter = require('./controllers/projects.controller');
const auditRouter = require('./controllers/audit.controller');
const notificationsRouter = require('./controllers/notifications.controller');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

app.use('/v1/projects', projectsRouter);
app.use('/v1/audit', auditRouter);
app.use('/v1/notifications', notificationsRouter);

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
