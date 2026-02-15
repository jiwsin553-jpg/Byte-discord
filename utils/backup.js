const fs = require("fs");
const path = require("path");
const { DB_PATH } = require("../database/db");

const BACKUP_DIR = path.join(__dirname, "..", "database", "backups");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function backupDatabase() {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(BACKUP_DIR, `db-${timestamp}.sqlite`);
  fs.copyFileSync(DB_PATH, target);
}

function pruneBackups(retentionDays) {
  ensureBackupDir();
  const limit = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(BACKUP_DIR);
  for (const file of files) {
    const fullPath = path.join(BACKUP_DIR, file);
    const stat = fs.statSync(fullPath);
    if (stat.mtimeMs < limit) {
      fs.unlinkSync(fullPath);
    }
  }
}

module.exports = {
  backupDatabase,
  pruneBackups
};
