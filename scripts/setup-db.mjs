import 'dotenv/config';
import { copyFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import pg from 'pg';

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  console.log('Created .env from .env.example');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Add it to your .env file.');
  process.exit(1);
}

const url = new URL(connectionString);
const database = url.pathname.slice(1);
const host = url.hostname;
const port = url.port || 5432;
const username = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);

const adminClient = () =>
  new pg.Client({ host, port, user: username, password, database: 'postgres' });

const roleMissing = (err) => err.code === '28000' && /does not exist/.test(err.message);

async function createRole() {
  const bootstrap = new pg.Client({
    host,
    port,
    user: process.env.PGUSER || process.env.USER,
    database: 'postgres',
  });
  await bootstrap.connect();
  const role = username.replace(/"/g, '""');
  const pass = password.replace(/'/g, "''");
  await bootstrap.query(`CREATE ROLE "${role}" WITH LOGIN PASSWORD '${pass}' CREATEDB`);
  await bootstrap.end();
  console.log(`Created role "${username}"`);
}

let admin = adminClient();
try {
  await admin.connect();
} catch (err) {
  if (!roleMissing(err)) {
    console.error(`Could not connect to Postgres at ${host}:${port}.`);
    console.error('Is Postgres running and are the credentials in DATABASE_URL correct?');
    console.error(err.message);
    process.exit(1);
  }
  try {
    await createRole();
  } catch (createErr) {
    console.error(`Role "${username}" does not exist and could not be created automatically.`);
    console.error(`Create it manually, then re-run: CREATE ROLE "${username}" WITH LOGIN PASSWORD '...' CREATEDB;`);
    console.error(createErr.message);
    process.exit(1);
  }
  admin = adminClient();
  await admin.connect();
}

const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
if (rowCount === 0) {
  await admin.query(`CREATE DATABASE "${database}"`);
  console.log(`Created database "${database}"`);
} else {
  console.log(`Database "${database}" already exists`);
}

await admin.end();

console.log('Applying schema...');
execSync('npm run migrate', { stdio: 'inherit' });

console.log('\nDatabase ready. Start the server with: npm run dev');
