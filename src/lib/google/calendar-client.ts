import 'server-only';
import { google } from 'googleapis';
import { serverEnv } from '@/lib/env.server';

export function isGoogleCalendarSyncConfigured(): boolean {
  return (
    serverEnv.GOOGLE_CALENDAR_SYNC_ENABLED === 'true' &&
    !!serverEnv.GOOGLE_CALENDAR_ID &&
    !!serverEnv.GOOGLE_CALENDAR_SERVICE_ACCOUNT_CLIENT_EMAIL &&
    !!serverEnv.GOOGLE_CALENDAR_SERVICE_ACCOUNT_PRIVATE_KEY
  );
}

export function assertGoogleCalendarSyncConfigured(): void {
  if (serverEnv.GOOGLE_CALENDAR_SYNC_ENABLED !== 'true') {
    throw new Error('Google Calendar Sync is disabled.');
  }
  if (!serverEnv.GOOGLE_CALENDAR_ID) {
    throw new Error('GOOGLE_CALENDAR_ID is missing.');
  }
  if (!serverEnv.GOOGLE_CALENDAR_SERVICE_ACCOUNT_CLIENT_EMAIL) {
    throw new Error('GOOGLE_CALENDAR_SERVICE_ACCOUNT_CLIENT_EMAIL is missing.');
  }
  if (!serverEnv.GOOGLE_CALENDAR_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('GOOGLE_CALENDAR_SERVICE_ACCOUNT_PRIVATE_KEY is missing.');
  }
}

export function getGoogleCalendarClient() {
  assertGoogleCalendarSyncConfigured();

  const clientEmail = serverEnv.GOOGLE_CALENDAR_SERVICE_ACCOUNT_CLIENT_EMAIL!;
  const rawPrivateKey = serverEnv.GOOGLE_CALENDAR_SERVICE_ACCOUNT_PRIVATE_KEY!;
  
  // Normalize newline characters in private key
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  });

  return google.calendar({ version: 'v3', auth });
}
