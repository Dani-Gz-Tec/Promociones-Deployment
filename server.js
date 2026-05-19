import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, 'dist');

// Verify the build output exists before attempting to serve it.
// A missing dist/ folder means the build step was skipped or its output
// was not copied into the runtime image — fail fast with a clear message.
if (!fs.existsSync(DIST_DIR)) {
  console.error(
    `[ERROR] Build output directory not found: ${DIST_DIR}\n` +
    `        Make sure "npm run build" ran successfully during the build phase\n` +
    `        and that the dist/ folder is included in the runtime image.\n` +
    `        Current working directory: ${process.cwd()}\n` +
    `        __dirname: ${__dirname}`
  );
  process.exit(1);
}

const indexPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(
    `[ERROR] dist/index.html not found inside ${DIST_DIR}\n` +
    `        The build may have completed but produced unexpected output.`
  );
  process.exit(1);
}

console.log(`[INFO] Serving static files from: ${DIST_DIR}`);

// Serve static files from the Vite build output
app.use(express.static(DIST_DIR));

// SPA fallback — send index.html for any unmatched route so that
// client-side routing (React Router, etc.) works correctly
app.get('*', (_req, res) => {
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`[ERROR] Failed to send index.html:`, err);
      res.status(500).send('Internal server error');
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`[INFO] Server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error(`[ERROR] Server failed to start:`, err);
  process.exit(1);
});
