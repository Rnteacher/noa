'use server';

import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit/log';
import { revalidatePath } from 'next/cache';
import { CALENDAR_EVENT_VISIBILITIES, type CalendarEventVisibility } from './admin-queries';
import { isGoogleCalendarSyncConfigured, getGoogleCalendarClient } from '@/lib/google/calendar-client';

/**
 * calendar_events' SELECT RLS policy (current_user_can_read_calendar_event) re-queries
 * the table by id. Postgres evaluates that subquery using the same command's snapshot,
 * so it cannot see a row this same INSERT/UPDATE statement just wrote. Requesting
 * `.select()`/RETURNING on these mutations therefore fails RLS even for authorized users.
 * We avoid `.select()` after insert/update on this table and generate the id client-side
 * instead of relying on RETURNING to obtain it.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TITLE_MAX_LENGTH = 160;
const DESCRIPTION_MAX_LENGTH = 2000;
const LOCATION_MAX_LENGTH = 160;

export type CalendarEventInput = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  visibility: CalendarEventVisibility;
  location: string;
  groupIds: string[];
};

export type CalendarActionResult = {
  success: boolean;
  error: string | null;
};

type ValidatedCalendarEventInput = {
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  visibility: CalendarEventVisibility;
  location: string | null;
  groupIds: string[];
};

function validateCalendarEventInput(
  input: CalendarEventInput
): { data: ValidatedCalendarEventInput } | { error: string } {
  const title = input.title.trim();
  if (!title) {
    return { error: 'admin.calendar.errorTitleRequired' };
  }
  if (title.length > TITLE_MAX_LENGTH) {
    return { error: 'admin.calendar.errorTitleTooLong' };
  }

  const description = input.description.trim();
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    return { error: 'admin.calendar.errorDescriptionTooLong' };
  }

  const location = input.location.trim();
  if (location.length > LOCATION_MAX_LENGTH) {
    return { error: 'admin.calendar.errorLocationTooLong' };
  }

  if (!CALENDAR_EVENT_VISIBILITIES.includes(input.visibility)) {
    return { error: 'admin.calendar.errorInvalidVisibility' };
  }

  const startsAtDate = new Date(input.startsAt);
  const endsAtDate = new Date(input.endsAt);

  if (Number.isNaN(startsAtDate.getTime()) || Number.isNaN(endsAtDate.getTime())) {
    return { error: 'admin.calendar.errorInvalidDateTime' };
  }

  if (endsAtDate.getTime() <= startsAtDate.getTime()) {
    return { error: 'admin.calendar.errorEndBeforeStart' };
  }

  const groupIds = Array.from(new Set(input.groupIds));

  if (input.visibility === 'groups') {
    if (groupIds.length === 0) {
      return { error: 'admin.calendar.errorGroupsRequired' };
    }
    if (groupIds.some((groupId) => !UUID_PATTERN.test(groupId))) {
      return { error: 'admin.calendar.errorInvalidGroup' };
    }
  }

  return {
    data: {
      title,
      description: description || null,
      startsAt: startsAtDate.toISOString(),
      endsAt: endsAtDate.toISOString(),
      isAllDay: input.isAllDay,
      visibility: input.visibility,
      location: location || null,
      groupIds: input.visibility === 'groups' ? groupIds : [],
    },
  };
}

export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<CalendarActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return { success: false, error: 'admin.calendar.errorForbidden' };
  }

  const validated = validateCalendarEventInput(input);
  if ('error' in validated) {
    return { success: false, error: validated.error };
  }
  const { data } = validated;

  const { data: schoolYear, error: schoolYearError } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle();

  if (schoolYearError || !schoolYear) {
    return { success: false, error: 'admin.calendar.errorNoCurrentSchoolYear' };
  }

  const eventId = randomUUID();

  const { error: insertError } = await supabase.from('calendar_events').insert({
    id: eventId,
    school_year_id: schoolYear.id,
    title: data.title,
    description: data.description,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
    is_all_day: data.isAllDay,
    visibility: data.visibility,
    location: data.location,
    created_by: user.id,
    updated_by: user.id,
  });

  if (insertError) {
    console.error('Failed to create calendar event:', insertError);
    return { success: false, error: 'admin.calendar.errorCreateFailed' };
  }

  if (data.groupIds.length > 0) {
    const { error: groupsError } = await supabase.from('calendar_event_groups').insert(
      data.groupIds.map((groupId) => ({
        event_id: eventId,
        group_id: groupId,
      }))
    );

    if (groupsError) {
      console.error('Failed to insert calendar event target groups:', groupsError);
      await supabase.from('calendar_events').delete().eq('id', eventId);
      return { success: false, error: 'admin.calendar.errorCreateFailed' };
    }
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'calendar_event.created',
      entityType: 'calendar_event',
      entityId: eventId,
      afterData: {
        id: eventId,
        title: data.title,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        visibility: data.visibility,
        group_ids: data.groupIds,
      },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for calendar event creation:', auditError);
  }

  revalidatePath('/admin/calendar');
  revalidatePath('/calendar');

  return { success: true, error: null };
}

export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput
): Promise<CalendarActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  if (!UUID_PATTERN.test(eventId)) {
    return { success: false, error: 'admin.calendar.errorInvalidId' };
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return { success: false, error: 'admin.calendar.errorForbidden' };
  }

  const validated = validateCalendarEventInput(input);
  if ('error' in validated) {
    return { success: false, error: validated.error };
  }
  const { data } = validated;

  const { data: existingEvent, error: fetchError } = await supabase
    .from('calendar_events')
    .select('id, title, description, starts_at, ends_at, is_all_day, visibility, location, updated_at')
    .eq('id', eventId)
    .maybeSingle();

  if (fetchError || !existingEvent) {
    return { success: false, error: 'admin.calendar.errorNotFound' };
  }

  const { error: updateError } = await supabase
    .from('calendar_events')
    .update({
      title: data.title,
      description: data.description,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      is_all_day: data.isAllDay,
      visibility: data.visibility,
      location: data.location,
      updated_by: user.id,
    })
    .eq('id', eventId);

  if (updateError) {
    console.error('Failed to update calendar event:', updateError);
    return { success: false, error: 'admin.calendar.errorUpdateFailed' };
  }

  const { error: clearGroupsError } = await supabase
    .from('calendar_event_groups')
    .delete()
    .eq('event_id', eventId);

  if (clearGroupsError) {
    console.error('Failed to clear calendar event target groups:', clearGroupsError);
    return { success: false, error: 'admin.calendar.errorUpdateFailed' };
  }

  if (data.groupIds.length > 0) {
    const { error: groupsError } = await supabase.from('calendar_event_groups').insert(
      data.groupIds.map((groupId) => ({
        event_id: eventId,
        group_id: groupId,
      }))
    );

    if (groupsError) {
      console.error('Failed to insert calendar event target groups:', groupsError);
      return { success: false, error: 'admin.calendar.errorUpdateFailed' };
    }
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'calendar_event.updated',
      entityType: 'calendar_event',
      entityId: eventId,
      beforeData: existingEvent,
      afterData: {
        id: eventId,
        title: data.title,
        description: data.description,
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        is_all_day: data.isAllDay,
        visibility: data.visibility,
        location: data.location,
        group_ids: data.groupIds,
      },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for calendar event update:', auditError);
  }

  revalidatePath('/admin/calendar');
  revalidatePath('/calendar');

  return { success: true, error: null };
}

export async function deleteCalendarEvent(eventId: string): Promise<CalendarActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  if (!UUID_PATTERN.test(eventId)) {
    return { success: false, error: 'admin.calendar.errorInvalidId' };
  }

  const { data: existingEvent, error: fetchError } = await supabase
    .from('calendar_events')
    .select('id, title, starts_at, ends_at, visibility, google_calendar_event_id')
    .eq('id', eventId)
    .maybeSingle();

  if (fetchError || !existingEvent) {
    return { success: false, error: 'admin.calendar.errorNotFound' };
  }

  if (isGoogleCalendarSyncConfigured() && existingEvent.google_calendar_event_id) {
    try {
      const calendar = getGoogleCalendarClient();
      await calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID!,
        eventId: existingEvent.google_calendar_event_id,
      });

      try {
        await writeAuditLog({
          actorId: user.id,
          action: 'calendar_google_event.deleted',
          entityType: 'calendar_event',
          entityId: eventId,
          afterData: { eventId, googleEventId: existingEvent.google_calendar_event_id },
        });
      } catch (auditError) {
        console.error('Failed to log Google event deletion audit:', auditError);
      }
    } catch (err) {
      const errorWithStatus = err as { status?: number; message?: string };
      if (errorWithStatus.status !== 404) {
        console.warn(`Failed to delete Google Calendar event for local event: ${eventId}`, err);
        try {
          await writeAuditLog({
            actorId: user.id,
            action: 'calendar_google_event.delete_failed',
            entityType: 'calendar_event',
            entityId: eventId,
            afterData: { eventId, googleEventId: existingEvent.google_calendar_event_id, error: errorWithStatus.message || 'Unknown error' },
          });
        } catch (auditError) {
          console.error('Failed to log Google event delete failure audit:', auditError);
        }
      }
    }
  }

  const { error: deleteError } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);

  if (deleteError) {
    console.error('Failed to delete calendar event:', deleteError);
    return { success: false, error: 'admin.calendar.errorDeleteFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'calendar_event.deleted',
      entityType: 'calendar_event',
      entityId: eventId,
      beforeData: existingEvent,
    });
  } catch (auditError) {
    console.error('Failed to write audit log for calendar event deletion:', auditError);
  }

  revalidatePath('/admin/calendar');
  revalidatePath('/calendar');

  return { success: true, error: null };
}

export async function rescheduleCalendarEvent(
  eventId: string,
  newStartsAt: string
): Promise<CalendarActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  if (!UUID_PATTERN.test(eventId)) {
    return { success: false, error: 'admin.calendar.errorInvalidId' };
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return { success: false, error: 'admin.calendar.errorForbidden' };
  }

  const newStartsAtDate = new Date(newStartsAt);
  if (Number.isNaN(newStartsAtDate.getTime())) {
    return { success: false, error: 'admin.calendar.errorInvalidDateTime' };
  }

  const { data: existingEvent, error: fetchError } = await supabase
    .from('calendar_events')
    .select('id, title, description, starts_at, ends_at, is_all_day, visibility, location, google_calendar_event_id')
    .eq('id', eventId)
    .maybeSingle();

  if (fetchError || !existingEvent) {
    return { success: false, error: 'admin.calendar.errorNotFound' };
  }

  const oldStartsAt = new Date(existingEvent.starts_at);
  const oldEndsAt = new Date(existingEvent.ends_at);
  const durationMs = oldEndsAt.getTime() - oldStartsAt.getTime();

  const newEndsAtDate = new Date(newStartsAtDate.getTime() + durationMs);

  const { error: updateError } = await supabase
    .from('calendar_events')
    .update({
      starts_at: newStartsAtDate.toISOString(),
      ends_at: newEndsAtDate.toISOString(),
      updated_by: user.id,
    })
    .eq('id', eventId);

  if (updateError) {
    console.error('Failed to reschedule calendar event:', updateError);
    return { success: false, error: 'admin.calendar.errorUpdateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: 'calendar_event.rescheduled',
      entityType: 'calendar_event',
      entityId: eventId,
      beforeData: {
        starts_at: existingEvent.starts_at,
        ends_at: existingEvent.ends_at,
      },
      afterData: {
        starts_at: newStartsAtDate.toISOString(),
        ends_at: newEndsAtDate.toISOString(),
      },
    });
  } catch (auditError) {
    console.error('Failed to write audit log for calendar event reschedule:', auditError);
  }

  revalidatePath('/admin/calendar');
  revalidatePath('/calendar');

  return { success: true, error: null };
}

type TimeChangeOptions = {
  newIsAllDay?: boolean;
  auditAction: 'calendar_event.moved' | 'calendar_event.resized';
};

/**
 * Shared persistence for drag-move and drag-resize interactions. Both only
 * ever touch starts_at/ends_at(/is_all_day) — google_calendar_event_id is
 * left untouched, matching rescheduleCalendarEvent's existing update shape.
 */
async function applyCalendarEventTimeChange(
  eventId: string,
  newStartsAtIso: string,
  newEndsAtIso: string,
  options: TimeChangeOptions
): Promise<CalendarActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  if (!UUID_PATTERN.test(eventId)) {
    return { success: false, error: 'admin.calendar.errorInvalidId' };
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return { success: false, error: 'admin.calendar.errorForbidden' };
  }

  const newStartsAtDate = new Date(newStartsAtIso);
  const newEndsAtDate = new Date(newEndsAtIso);

  if (Number.isNaN(newStartsAtDate.getTime()) || Number.isNaN(newEndsAtDate.getTime())) {
    return { success: false, error: 'admin.calendar.errorInvalidDateTime' };
  }

  if (newEndsAtDate.getTime() <= newStartsAtDate.getTime()) {
    return { success: false, error: 'admin.calendar.errorEndBeforeStart' };
  }

  const { data: existingEvent, error: fetchError } = await supabase
    .from('calendar_events')
    .select('id, starts_at, ends_at, is_all_day')
    .eq('id', eventId)
    .maybeSingle();

  if (fetchError || !existingEvent) {
    return { success: false, error: 'admin.calendar.errorNotFound' };
  }

  const updatePayload: {
    starts_at: string;
    ends_at: string;
    updated_by: string;
    is_all_day?: boolean;
  } = {
    starts_at: newStartsAtDate.toISOString(),
    ends_at: newEndsAtDate.toISOString(),
    updated_by: user.id,
  };

  if (typeof options.newIsAllDay === 'boolean') {
    updatePayload.is_all_day = options.newIsAllDay;
  }

  const { error: updateError } = await supabase
    .from('calendar_events')
    .update(updatePayload)
    .eq('id', eventId);

  if (updateError) {
    console.error(`Failed to apply calendar event time change (${options.auditAction}):`, updateError);
    return { success: false, error: 'admin.calendar.errorUpdateFailed' };
  }

  try {
    await writeAuditLog({
      actorId: user.id,
      action: options.auditAction,
      entityType: 'calendar_event',
      entityId: eventId,
      beforeData: {
        starts_at: existingEvent.starts_at,
        ends_at: existingEvent.ends_at,
        is_all_day: existingEvent.is_all_day,
      },
      afterData: {
        starts_at: newStartsAtDate.toISOString(),
        ends_at: newEndsAtDate.toISOString(),
        is_all_day:
          typeof options.newIsAllDay === 'boolean' ? options.newIsAllDay : existingEvent.is_all_day,
      },
    });
  } catch (auditError) {
    console.error(`Failed to write audit log for ${options.auditAction}:`, auditError);
  }

  revalidatePath('/admin/calendar');
  revalidatePath('/calendar');

  return { success: true, error: null };
}

/** Drag-to-move: same duration, new start (and possibly a new all-day/timed state). */
export async function moveCalendarEvent(
  eventId: string,
  newStartsAtIso: string,
  newEndsAtIso: string,
  newIsAllDay: boolean
): Promise<CalendarActionResult> {
  return applyCalendarEventTimeChange(eventId, newStartsAtIso, newEndsAtIso, {
    newIsAllDay,
    auditAction: 'calendar_event.moved',
  });
}

/** Drag-to-resize: start (or end) boundary changes, duration changes, all-day/timed state unchanged. */
export async function resizeCalendarEvent(
  eventId: string,
  newStartsAtIso: string,
  newEndsAtIso: string
): Promise<CalendarActionResult> {
  return applyCalendarEventTimeChange(eventId, newStartsAtIso, newEndsAtIso, {
    auditAction: 'calendar_event.resized',
  });
}

export type ImportedEventItem = {
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  visibility: CalendarEventVisibility;
  location: string | null;
  groupIds: string[];
};

export async function importCalendarEvents(
  events: ImportedEventItem[]
): Promise<CalendarActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'dashboard.error.noSession' };
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return { success: false, error: 'admin.calendar.errorForbidden' };
  }

  const { data: schoolYear, error: schoolYearError } = await supabase
    .from('school_years')
    .select('id')
    .eq('is_current', true)
    .maybeSingle();

  if (schoolYearError || !schoolYear) {
    return { success: false, error: 'admin.calendar.errorNoCurrentSchoolYear' };
  }

  // Server-side validation: pre-validate all rows before writing any data
  const validatedEvents: ValidatedCalendarEventInput[] = [];
  const seenEvents = new Set<string>();

  for (const item of events) {
    const input: CalendarEventInput = {
      title: item.title,
      description: item.description ?? '',
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      isAllDay: item.isAllDay,
      visibility: item.visibility,
      location: item.location ?? '',
      groupIds: item.groupIds,
    };

    const validated = validateCalendarEventInput(input);
    if ('error' in validated) {
      return { success: false, error: validated.error };
    }

    const dupKey = `${validated.data.title}|${validated.data.startsAt}|${validated.data.endsAt}`;
    if (seenEvents.has(dupKey)) {
      return { success: false, error: 'admin.calendar.errorDuplicateRow' };
    }
    seenEvents.add(dupKey);

    validatedEvents.push(validated.data);
  }

  // Best-effort batch insertion
  for (const data of validatedEvents) {
    const eventId = randomUUID();

    const { error: insertError } = await supabase.from('calendar_events').insert({
      id: eventId,
      school_year_id: schoolYear.id,
      title: data.title,
      description: data.description,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      is_all_day: data.isAllDay,
      visibility: data.visibility,
      location: data.location,
      created_by: user.id,
      updated_by: user.id,
    });

    if (insertError) {
      console.error(`Import insertion failed for event: ${data.title}`, insertError);
      return { success: false, error: 'admin.calendar.errorCreateFailed' };
    }

    if (data.groupIds.length > 0) {
      const { error: groupsError } = await supabase.from('calendar_event_groups').insert(
        data.groupIds.map((groupId) => ({
          event_id: eventId,
          group_id: groupId,
        }))
      );

      if (groupsError) {
        console.error(`Import target group association failed for event: ${data.title}`, groupsError);
        await supabase.from('calendar_events').delete().eq('id', eventId);
        return { success: false, error: 'admin.calendar.errorCreateFailed' };
      }
    }

    try {
      await writeAuditLog({
        actorId: user.id,
        action: 'calendar_event.created',
        entityType: 'calendar_event',
        entityId: eventId,
        afterData: {
          id: eventId,
          title: data.title,
          starts_at: data.startsAt,
          ends_at: data.endsAt,
          visibility: data.visibility,
          group_ids: data.groupIds,
          is_imported: true,
        },
      });
    } catch (auditError) {
      console.error('Failed to log imported event creation audit:', auditError);
    }
  }

  revalidatePath('/admin/calendar');
  revalidatePath('/calendar');

  return { success: true, error: null };
}
