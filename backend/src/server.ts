import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';

function start(port: number) {
  const server = http.createServer(app);
  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      const fallback = port === 5000 ? 5050 : port + 1;
      // eslint-disable-next-line no-console
      console.warn(`Port ${port} in use. Retrying on ${fallback}...`);
      start(fallback);
    } else {
      throw err;
    }
  });
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${port}`);
  });
}

const initialPort = Number(process.env.PORT || 5000);
start(initialPort);


