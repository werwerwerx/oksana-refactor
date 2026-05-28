const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jsonServer = require('json-server');
const multer = require('multer');

const PORT = Number(process.env.MOCK_PORT) || 3001;
const SEED_PATH = path.join(__dirname, 'db.seed.json');
const DB_PATH = path.join(__dirname, 'db.json');
const TILE_IMAGE = fs.readFileSync(path.join(__dirname, 'assets', 'tile.png'));

fs.copyFileSync(SEED_PATH, DB_PATH);

const server = jsonServer.create();
const router = jsonServer.router(DB_PATH);
const db = router.db;
const upload = multer({ storage: multer.memoryStorage() });

const tileJobs = new Map();
const detectJobs = new Map();

const persistDb = () => {
  fs.writeFileSync(DB_PATH, JSON.stringify(db.getState(), null, 2));
};

const createToken = (username) => {
  const payload = Buffer.from(JSON.stringify({ sub: username, iat: Date.now() })).toString('base64url');
  return `mock.${payload}.token`;
};

const parseToken = (authHeader) => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  if (!token.startsWith('mock.')) return null;
  const parts = token.split('.');
  if (parts.length < 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

const requireAuth = (req, res, next) => {
  const payload = parseToken(req.headers.authorization);
  if (!payload?.sub) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.user = payload;
  next();
};

const findImage = (uuid) => db.get('images').find({ uuid }).value();

const findManifest = (uuid) => db.get('manifests').find({ uuid }).value();

const findDetections = (uuid) => db.get('detections').find({ imageUuid: uuid }).value();

const defaultLevels = (width, height) => ({
  '0': {
    width,
    height,
    tiles_x: Math.ceil(width / 256),
    tiles_y: Math.ceil(height / 256),
  },
});

server.use(jsonServer.defaults({ noCors: false }));
server.use(jsonServer.bodyParser);

server.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.get('users').find({ username, password }).value();
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = createToken(username);
  res.setHeader('Authorization', `Bearer ${token}`);
  res.status(200).json({ ok: true });
});

server.post('/checktoken/check', (req, res) => {
  const payload = parseToken(req.headers.authorization);
  if (!payload?.sub) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  res.json({ payload });
});

server.get('/metadata', requireAuth, (req, res) => {
  const limit = Math.max(Number(req.query.limit) || 5, 1);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const images = db.get('images').value();
  const items = images.slice(offset, offset + limit);
  res.json({ total: images.length, items });
});

server.delete('/ingest/:uuid', requireAuth, (req, res) => {
  const { uuid } = req.params;
  db.get('images').remove({ uuid }).write();
  db.get('manifests').remove({ uuid }).write();
  db.get('detections').remove({ imageUuid: uuid }).write();
  persistDb();
  res.status(204).end();
});

server.get('/tiles/:uuid/preview', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.send(TILE_IMAGE);
});

server.get('/tiles/:uuid/manifest', requireAuth, (req, res) => {
  const manifest = findManifest(req.params.uuid);
  if (!manifest) {
    res.status(404).json({ error: 'Manifest not found' });
    return;
  }
  res.json(manifest);
});

server.get('/tiles/:uuid/:z/:y/:x', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-store');
  res.send(TILE_IMAGE);
});

server.post('/ingest/images/ingest', requireAuth, upload.single('file'), (req, res) => {
  const file = req.file;
  const uuid = crypto.randomUUID();
  const name = file?.originalname || `upload_${Date.now()}.webp`;
  const width = 4096;
  const height = 3072;
  const now = new Date().toISOString();

  const image = {
    uuid,
    name,
    last_updated: now,
    format: name.split('.').pop() || 'webp',
    size_bytes: file?.size || 1024000,
    width,
    height,
    tile_build_ms: null,
    detect_ms: null,
  };

  db.get('images').unshift(image).write();
  persistDb();
  res.status(201).json(image);
});

server.post('/tiles/:uuid/build', requireAuth, (req, res) => {
  const image = findImage(req.params.uuid);
  if (!image) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  const jobId = crypto.randomUUID();
  const manifest = findManifest(req.params.uuid) || {
    uuid: req.params.uuid,
    levels: defaultLevels(image.width, image.height),
  };

  if (!findManifest(req.params.uuid)) {
    db.get('manifests').push(manifest).write();
    persistDb();
  }

  tileJobs.set(jobId, {
    uuid: req.params.uuid,
    manifest,
    readyAt: Date.now() + 1500,
  });

  res.status(202).json({ job_id: jobId });
});

server.get('/tiles/:jobId/result', requireAuth, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const job = tileJobs.get(req.params.jobId);
  if (job) {
    if (Date.now() < job.readyAt) {
      res.json({ status: 'pending' });
      return;
    }
    tileJobs.delete(req.params.jobId);
    res.json(job.manifest);
    return;
  }

  const manifest = findManifest(req.params.jobId);
  if (manifest) {
    res.json(manifest);
    return;
  }

  res.status(404).json({ error: 'Job not found' });
});

server.get('/statistics/summary', requireAuth, (req, res) => {
  res.json(db.get('statistics').value());
});

server.get('/detections/:uuid', requireAuth, (req, res) => {
  const record = findDetections(req.params.uuid);
  if (!record?.items?.length) {
    res.status(404).json({ error: 'Detections not found' });
    return;
  }
  res.json(record.items);
});

server.put('/detections/:uuid', requireAuth, (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  const normalized = items.map((item, index) => ({
    id: item.id || `saved-${index + 1}`,
    bbox_global: item.bbox_global || item.bbox,
    source: item.source || 'manual',
  }));

  const existing = findDetections(req.params.uuid);
  if (existing) {
    db.get('detections').find({ imageUuid: req.params.uuid }).assign({ items: normalized }).write();
  } else if (normalized.length > 0) {
    db.get('detections').push({ imageUuid: req.params.uuid, items: normalized }).write();
  }
  persistDb();
  res.status(204).end();
});

server.post('/detections/:uuid', requireAuth, (req, res) => {
  const image = findImage(req.params.uuid);
  if (!image) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  const taskId = crypto.randomUUID();
  const existing = findDetections(req.params.uuid);
  const mockItems = existing?.items?.length
    ? existing.items
    : [
      {
        id: 'mock-det-1',
        bbox_global: [400, 600, 580, 780],
        source: 'predicted',
      },
      {
        id: 'mock-det-2',
        bbox_global: [900, 1100, 1080, 1280],
        source: 'predicted',
      },
    ];

  detectJobs.set(taskId, {
    imageUuid: req.params.uuid,
    items: mockItems,
    startedAt: Date.now(),
    durationMs: 2500,
  });

  res.status(202).json({ task_id: taskId });
});

server.get('/detections/tasks/:jobId/result', requireAuth, (req, res) => {
  const job = detectJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Detection job not found' });
    return;
  }

  const elapsed = Date.now() - job.startedAt;
  const progress = Math.min(100, Math.round((elapsed / job.durationMs) * 100));

  if (progress < 100) {
    res.json({ status: 'running', progress_percent: progress });
    return;
  }

  if (!findDetections(job.imageUuid)) {
    db.get('detections').push({ imageUuid: job.imageUuid, items: job.items }).write();
    persistDb();
  }

  detectJobs.delete(req.params.jobId);

  res.json({
    status: 'completed',
    progress_percent: 100,
    result: {
      detections_total: job.items.length,
    },
  });
});

server.use(router);

server.listen(PORT, () => {
  console.log(`Mock API (json-server) → http://localhost:${PORT}`);
  console.log('Login: demo / demo');
});
