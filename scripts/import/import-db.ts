import { Client } from 'pg';
import { URL } from 'url';

export function getDbClient(target: 'local' | 'remote'): Client {
  const dbUrl = process.env.IMPORT_DATABASE_URL;
  if (!dbUrl) {
    throw new Error('IMPORT_DATABASE_URL environment variable is missing.');
  }

  let host = '';
  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;
  } catch {
    // Simple string parsing fallback
    const atIndex = dbUrl.lastIndexOf('@');
    if (atIndex !== -1) {
      const rest = dbUrl.substring(atIndex + 1);
      const colonIdx = rest.indexOf(':');
      const slashIdx = rest.indexOf('/');
      const endIdx = colonIdx !== -1 ? colonIdx : (slashIdx !== -1 ? slashIdx : rest.length);
      host = rest.substring(0, endIdx);
    }
  }

  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';

  if (!isLocal) {
    const allowRemote = process.env.IMPORT_ALLOW_REMOTE === '1';
    const remoteTargetName = process.env.IMPORT_REMOTE_TARGET_NAME;

    if (!allowRemote || !remoteTargetName || target !== 'remote') {
      throw new Error(
        `Connection target '${host}' is remote, but remote connections are locked. ` +
        `Required environment configurations: IMPORT_ALLOW_REMOTE=1, IMPORT_REMOTE_TARGET_NAME, and CLI flag '--target remote'.`
      );
    }
    console.log(`[WARNING] Connecting to REMOTE database: ${remoteTargetName}`);
  } else {
    console.log(`[INFO] Connecting to LOCAL database: ${host || 'localhost'}`);
  }

  return new Client({
    connectionString: dbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}
