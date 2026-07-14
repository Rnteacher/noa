'use server';

import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit/log';
import { revalidatePath } from 'next/cache';
import { isGoogleCalendarSyncConfigured, getGoogleCalendarClient, assertGoogleCalendarSyncConfigured } from '@/lib/google/calendar-client';
import { mapLocalToGoogleEvent } from './google-calendar-mapping';
import { serverEnv } from '@/lib/env.server';


export type SyncPreviewResult = {
  success: boolean;
  error: string | null;
  isConfigured: boolean;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  warnings: string[];
};

export type SyncRunResult = {
  success: boolean;
  error: string | null;
  insertedCount: number;
  updatedCount: number;
  failedCount: number;
  failures: { eventId: string; title: string; reason: string }[];
};

export type CalendarActionResult = {
  success: boolean;
  error: string | null;
};

// Manager/Super-Admin authorization helper
async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'dashboard.error.noSession', user: null };
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return { error: 'admin.calendar.errorForbidden', user: null };
  }

  return { error: null, user };
}

export async function previewGoogleCalendarSyncAction(
  schoolYearId: string
): Promise<SyncPreviewResult> {
  const auth = await checkAdminAuth();
  if (auth.error) {
    return {
      success: false,
      error: auth.error,
      isConfigured: false,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      warnings: [],
    };
  }

  const isConfigured = isGoogleCalendarSyncConfigured();
  const warnings: string[] = [];

  const supabase = await createClient();
  const { data: events, error: fetchError } = await supabase
    .from('calendar_events')
    .select('id, title, starts_at, ends_at, is_all_day, visibility, location, google_calendar_event_id')
    .eq('school_year_id', schoolYearId);

  if (fetchError) {
    console.error('Failed to fetch events for sync preview:', fetchError);
    return {
      success: false,
      error: 'admin.calendar.errorFetchFailed',
      isConfigured,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      warnings,
    };
  }

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const event of events ?? []) {
    // Basic structural validation
    if (!event.title || !event.starts_at || !event.ends_at) {
      skippedCount++;
      warnings.push(`Event "${event.title || event.id}" skipped due to missing required fields.`);
      continue;
    }

    if (new Date(event.ends_at) <= new Date(event.starts_at)) {
      skippedCount++;
      warnings.push(`Event "${event.title}" skipped: end date is before or equal to start date.`);
      continue;
    }

    if (!event.google_calendar_event_id) {
      insertedCount++;
    } else {
      updatedCount++;
    }
  }

  try {
    await writeAuditLog({
      actorId: auth.user!.id,
      action: 'calendar_google_sync.previewed',
      entityType: 'calendar_event',
      afterData: {
        schoolYearId,
        insertedCount,
        updatedCount,
        skippedCount,
        warningsCount: warnings.length,
      },
    });
  } catch (auditError) {
    console.error('Failed to log preview sync audit:', auditError);
  }

  return {
    success: true,
    error: null,
    isConfigured,
    insertedCount,
    updatedCount,
    skippedCount,
    warnings,
  };
}

export async function runGoogleCalendarSyncAction(
  schoolYearId: string
): Promise<SyncRunResult> {
  const auth = await checkAdminAuth();
  if (auth.error) {
    return {
      success: false,
      error: auth.error,
      insertedCount: 0,
      updatedCount: 0,
      failedCount: 0,
      failures: [],
    };
  }

  try {
    assertGoogleCalendarSyncConfigured();
  } catch (cfgError) {
    const error = cfgError as Error;
    return {
      success: false,
      error: error.message || 'Sync not configured.',
      insertedCount: 0,
      updatedCount: 0,
      failedCount: 0,
      failures: [],
    };
  }

  const supabase = await createClient();
  const { data: events, error: fetchError } = await supabase
    .from('calendar_events')
    .select('id, title, description, starts_at, ends_at, is_all_day, visibility, location, google_calendar_event_id')
    .eq('school_year_id', schoolYearId);

  if (fetchError) {
    console.error('Failed to fetch events for sync:', fetchError);
    return {
      success: false,
      error: 'admin.calendar.errorFetchFailed',
      insertedCount: 0,
      updatedCount: 0,
      failedCount: 0,
      failures: [],
    };
  }

  try {
    await writeAuditLog({
      actorId: auth.user!.id,
      action: 'calendar_google_sync.started',
      entityType: 'calendar_event',
      afterData: { schoolYearId, totalEvents: events?.length ?? 0 },
    });
  } catch (auditError) {
    console.error('Failed to log sync start audit:', auditError);
  }

  const calendar = getGoogleCalendarClient();
  const calendarId = serverEnv.GOOGLE_CALENDAR_ID!;

  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const failures: { eventId: string; title: string; reason: string }[] = [];

  for (const event of events ?? []) {
    // Skip structurally invalid rows
    if (!event.title || !event.starts_at || !event.ends_at || new Date(event.ends_at) <= new Date(event.starts_at)) {
      failedCount++;
      failures.push({
        eventId: event.id,
        title: event.title || 'Untitled',
        reason: 'Missing fields or end date before start date.',
      });
      continue;
    }

    const googleEvent = mapLocalToGoogleEvent({
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      isAllDay: event.is_all_day,
      location: event.location,
    });

    try {
      if (!event.google_calendar_event_id) {
        // Insert new event
        const res = await calendar.events.insert({
          calendarId,
          requestBody: googleEvent,
        });

        const googleEventId = res.data.id;
        if (!googleEventId) {
          throw new Error('Google Calendar API response did not contain an event ID.');
        }

        const { error: dbUpdateError } = await supabase
          .from('calendar_events')
          .update({ google_calendar_event_id: googleEventId })
          .eq('id', event.id);

        if (dbUpdateError) {
          console.error(`Local db failed to save Google Event ID for event: ${event.title}`, dbUpdateError);
          failures.push({
            eventId: event.id,
            title: event.title,
            reason: `Google event created (${googleEventId}), but local database update failed. Local repairs needed.`,
          });
          failedCount++;
        } else {
          insertedCount++;
          try {
            await writeAuditLog({
              actorId: auth.user!.id,
              action: 'calendar_google_event.inserted',
              entityType: 'calendar_event',
              entityId: event.id,
              afterData: { eventId: event.id, googleEventId },
            });
          } catch (auditError) {
            console.error('Failed to log event insertion audit:', auditError);
          }
        }
      } else {
        // Update existing event
        try {
          await calendar.events.update({
            calendarId,
            eventId: event.google_calendar_event_id,
            requestBody: googleEvent,
          });

          updatedCount++;
          try {
            await writeAuditLog({
              actorId: auth.user!.id,
              action: 'calendar_google_event.updated',
              entityType: 'calendar_event',
              entityId: event.id,
              afterData: { eventId: event.id, googleEventId: event.google_calendar_event_id },
            });
          } catch (auditError) {
            console.error('Failed to log event update audit:', auditError);
          }
        } catch (updateApiError) {
          const apiError = updateApiError as { status?: number };
          if (apiError.status === 404) {
            // If deleted on Google, re-create it
            const res = await calendar.events.insert({
              calendarId,
              requestBody: googleEvent,
            });

            const googleEventId = res.data.id;
            if (!googleEventId) {
              throw new Error('Google Calendar API re-insert response did not contain an event ID.');
            }

            const { error: dbUpdateError } = await supabase
              .from('calendar_events')
              .update({ google_calendar_event_id: googleEventId })
              .eq('id', event.id);

            if (dbUpdateError) {
              console.error(`Local db failed to update Google Event ID for re-created event: ${event.title}`, dbUpdateError);
              failures.push({
                eventId: event.id,
                title: event.title,
                reason: `Google event re-created (${googleEventId}), but local database update failed.`,
              });
              failedCount++;
            } else {
              insertedCount++;
              try {
                await writeAuditLog({
                  actorId: auth.user!.id,
                  action: 'calendar_google_event.recreated',
                  entityType: 'calendar_event',
                  entityId: event.id,
                  afterData: {
                    eventId: event.id,
                    googleEventId,
                    previousGoogleEventId: event.google_calendar_event_id,
                  },
                });
              } catch (auditError) {
                console.error('Failed to log event recreation audit:', auditError);
              }
            }
          } else {
            throw updateApiError;
          }
        }
      }
    } catch (err) {
      console.error(`Sync execution failed for event: ${event.title}`, err);
      const apiError = err as { status?: number; message?: string };
      
      // If global connection/auth error, halt execution entirely
      if (apiError.status === 401 || apiError.status === 403) {
        try {
          await writeAuditLog({
            actorId: auth.user!.id,
            action: 'calendar_google_sync.failed',
            entityType: 'calendar_event',
            afterData: { schoolYearId, reason: 'Credential authorization error, halting sync.' },
          });
        } catch (auditError) {
          console.error('Failed to log sync fail audit:', auditError);
        }

        return {
          success: false,
          error: 'Google authentication or access permission rejected.',
          insertedCount,
          updatedCount,
          failedCount: failedCount + (events.length - (insertedCount + updatedCount + failedCount)),
          failures: [
            ...failures,
            { eventId: event.id, title: event.title, reason: 'Sync halted due to credential or quota failure.' }
          ],
        };
      }

      // Event-specific error, log and continue
      failedCount++;
      failures.push({
        eventId: event.id,
        title: event.title,
        reason: apiError.message || 'Unknown API mutation error.',
      });
    }
  }

  try {
    await writeAuditLog({
      actorId: auth.user!.id,
      action: 'calendar_google_sync.completed',
      entityType: 'calendar_event',
      afterData: {
        schoolYearId,
        insertedCount,
        updatedCount,
        failedCount,
        failuresCount: failures.length,
      },
    });
  } catch (auditError) {
    console.error('Failed to log sync completion audit:', auditError);
  }

  revalidatePath('/admin/calendar');
  revalidatePath('/admin/import-export');
  revalidatePath('/calendar');

  return {
    success: true,
    error: null,
    insertedCount,
    updatedCount,
    failedCount,
    failures,
  };
}

export async function syncSingleCalendarEventAction(
  eventId: string
): Promise<CalendarActionResult> {
  const auth = await checkAdminAuth();
  if (auth.error) {
    return { success: false, error: auth.error };
  }

  try {
    assertGoogleCalendarSyncConfigured();
  } catch (cfgError) {
    const error = cfgError as Error;
    return { success: false, error: error.message || 'Sync not configured.' };
  }

  const supabase = await createClient();
  const { data: event, error: fetchError } = await supabase
    .from('calendar_events')
    .select('id, title, description, starts_at, ends_at, is_all_day, visibility, location, google_calendar_event_id')
    .eq('id', eventId)
    .maybeSingle();

  if (fetchError || !event) {
    console.error('Failed to fetch event for single sync:', fetchError);
    return { success: false, error: 'admin.calendar.errorNotFound' };
  }

  if (!event.title || !event.starts_at || !event.ends_at || new Date(event.ends_at) <= new Date(event.starts_at)) {
    return { success: false, error: 'admin.calendar.errorInvalidDateTime' };
  }

  const calendar = getGoogleCalendarClient();
  const calendarId = serverEnv.GOOGLE_CALENDAR_ID!;
  const googleEvent = mapLocalToGoogleEvent({
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    isAllDay: event.is_all_day,
    location: event.location,
  });

  try {
    if (!event.google_calendar_event_id) {
      const res = await calendar.events.insert({
        calendarId,
        requestBody: googleEvent,
      });

      const googleEventId = res.data.id;
      if (!googleEventId) {
        throw new Error('Google Calendar API did not return an event ID.');
      }

      const { error: dbUpdateError } = await supabase
        .from('calendar_events')
        .update({ google_calendar_event_id: googleEventId })
        .eq('id', event.id);

      if (dbUpdateError) {
        console.error('Local db failed to save Google Event ID:', dbUpdateError);
        return { success: false, error: 'Failed to record Google event link locally.' };
      }

      try {
        await writeAuditLog({
          actorId: auth.user!.id,
          action: 'calendar_google_event.inserted',
          entityType: 'calendar_event',
          entityId: event.id,
          afterData: { eventId: event.id, googleEventId },
        });
      } catch (auditError) {
        console.error('Failed to log event insertion audit:', auditError);
      }
    } else {
      try {
        await calendar.events.update({
          calendarId,
          eventId: event.google_calendar_event_id,
          requestBody: googleEvent,
        });

        try {
          await writeAuditLog({
            actorId: auth.user!.id,
            action: 'calendar_google_event.updated',
            entityType: 'calendar_event',
            entityId: event.id,
            afterData: { eventId: event.id, googleEventId: event.google_calendar_event_id },
          });
        } catch (auditError) {
          console.error('Failed to log event update audit:', auditError);
        }
      } catch (updateApiError) {
        const apiError = updateApiError as { status?: number };
        if (apiError.status === 404) {
          // If deleted remotely, recreate it
          const res = await calendar.events.insert({
            calendarId,
            requestBody: googleEvent,
          });

          const googleEventId = res.data.id;
          if (!googleEventId) {
            throw new Error('Google Calendar API did not return an event ID.');
          }

          const { error: dbUpdateError } = await supabase
            .from('calendar_events')
            .update({ google_calendar_event_id: googleEventId })
            .eq('id', event.id);

          if (dbUpdateError) {
            return { success: false, error: 'Failed to record Google event link locally.' };
          }

          try {
            await writeAuditLog({
              actorId: auth.user!.id,
              action: 'calendar_google_event.recreated',
              entityType: 'calendar_event',
              entityId: event.id,
              afterData: {
                eventId: event.id,
                googleEventId,
                previousGoogleEventId: event.google_calendar_event_id,
              },
            });
          } catch (auditError) {
            console.error('Failed to log event recreation audit:', auditError);
          }
        } else {
          throw updateApiError;
        }
      }
    }

    revalidatePath('/admin/calendar');
    revalidatePath('/calendar');
    return { success: true, error: null };
  } catch (err) {
    console.error('Single calendar event sync failed:', err);
    const error = err as Error;
    return { success: false, error: error.message || 'Google API sync execution failed.' };
  }
}
