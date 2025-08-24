import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { createIO } from './sockets/io.js';
import adminRoutes from './routes/admin.routes.js';


dotenv.config();

app.use('/api/admin', adminRoutes);

const server = http.createServer(app);
createIO(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
