import 'dotenv/config';
import pg from 'pg';

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

const admin = new pg.Client({ host, port, user: username, password, database: 'postgres' });
try {
  await admin.connect();
} catch (err) {
  console.error(`Could not connect to Postgres at ${host}:${port}.`);
  console.error('Is Postgres running and are the credentials in DATABASE_URL correct?');
  console.error(err.message);
  process.exit(1);
}

const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
if (rowCount === 0) {
  console.log(`Database "${database}" does not exist`);
} else {
  await admin.query(
    'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
    [database],
  );
  await admin.query(`DROP DATABASE "${database}"`);
  console.log(`Dropped database "${database}"`);
}

await admin.end();
