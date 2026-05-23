const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbPath = path.resolve(__dirname, 'onboarding.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error(err.message);
  console.log('Connected to the onboarding database.');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      website TEXT,
      contact TEXT,
      logoReceived INTEGER DEFAULT 0,
      appleWalletStrip INTEGER DEFAULT 0,
      googleWalletStrip INTEGER DEFAULT 0,
      brandColor TEXT DEFAULT '#000000',
      integrationType TEXT DEFAULT 'Altru',
      integrationDone INTEGER DEFAULT 0,
      testingRecordsPassed INTEGER DEFAULT 0,
      cardsDelivered INTEGER DEFAULT 0,
      isLaunched INTEGER DEFAULT 0,
      currentWeek INTEGER DEFAULT 1
    )
  `);

  db.get("SELECT COUNT(*) as count FROM organizations", [], (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare(`
        INSERT INTO organizations (id, name, website, contact, logoReceived, appleWalletStrip, googleWalletStrip, brandColor, integrationType, integrationDone, testingRecordsPassed, cardsDelivered, isLaunched, currentWeek)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run('1', 'Metropolitan Museum of Art', 'https://www.metmuseum.org', 'sarah.jenkins@metmuseum.org', 1, 1, 0, '#E4002B', 'Altru', 1, 0, 0, 0, 2);
      stmt.run('2', 'Sciencenter Discovery Park', 'https://www.sciencenter.org', 'm.ross@sciencenter.org', 0, 0, 0, '#00A3E0', 'RE NXT', 0, 0, 0, 0, 1);
      stmt.finalize();
    }
  });
});

app.get('/api/organizations', (req, res) => {
  db.all("SELECT * FROM organizations", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/organizations/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const keys = Object.keys(fields);
  if (keys.length === 0) return res.status(400).json({ error: "No fields provided" });

  const querySets = keys.map(key => `${key} = ?`).join(', ');
  const values = keys.map(key => typeof fields[key] === 'boolean' ? (fields[key] ? 1 : 0) : fields[key]);
  values.push(id);

  db.run(`UPDATE organizations SET ${querySets} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT * FROM organizations WHERE id = ?", [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
