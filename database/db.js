const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const DB_PATH = path.join(__dirname, "db.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

let dbInstance;

async function initDb() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf8");
  await dbInstance.exec(schemaSql);

  return dbInstance;
}

async function run(query, params = []) {
  const db = await initDb();
  return db.run(query, params);
}

async function get(query, params = []) {
  const db = await initDb();
  return db.get(query, params);
}

async function all(query, params = []) {
  const db = await initDb();
  return db.all(query, params);
}

module.exports = {
  initDb,
  run,
  get,
  all,
  DB_PATH
};
