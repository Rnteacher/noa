import 'server-only';
import webPush from 'web-push';
import { createServiceRoleClient } from '@/lib/auth/admin';
import { serverEnv } from '@/lib/env.server';

export type StudentChangePushInput = {
  actorId: string;
  studentId: string;
  eventType:
    | 'student_message.created'
    | 'project.status_updated'
    | 'student_emotional_status.updated'
    | 'student_goal.created'
    | 'student_goal.updated'
    | 'student_goal.deleted'
    | 'student_photo.updated';
};

type PushTemplate = {
  title: string;
  body: string;
};

const PUSH_TEMPLATES: Record<StudentChangePushInput['eventType'], PushTemplate> = {
  'student_message.created': {
    title: 'New student card update',
    body: 'A student you follow has a new update.',
  },
  'project.status_updated': {
    title: 'Project status updated',
    body: 'A student you follow has a project update.',
  },
  'student_emotional_status.updated': {
    title: 'Student status updated',
    body: 'A student you follow has a status update.',
  },
  'student_goal.created': {
    title: 'Goal added',
    body: 'A student you follow has a goal update.',
  },
  'student_goal.updated': {
    title: 'Goal updated',
    body: 'A student you follow has a goal update.',
  },
  'student_goal.deleted': {
    title: 'Goal removed',
    body: 'A student you follow has a goal update.',
  },
  'student_photo.updated': {
    title: 'Student photo updated',
    body: 'A student you follow has a profile update.',
  },
};

function isPushConfigured() {
  return Boolean(
    serverEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      serverEnv.VAPID_PRIVATE_KEY &&
      serverEnv.VAPID_SUBJECT
  );
}

function getStatusCode(error: unknown): number | null {
  if (
    error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }

  return null;
}

export async function sendStudentChangePush(input: StudentChangePushInput) {
  if (!isPushConfigured()) {
    return;
  }

  webPush.setVapidDetails(
    serverEnv.VAPID_SUBJECT!,
    serverEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    serverEnv.VAPID_PRIVATE_KEY!
  );

  const admin = createServiceRoleClient();
  const { data: follows, error: followsError } = await admin
    .from('followed_students')
    .select('profile_id, profiles!inner(is_active)')
    .eq('student_id', input.studentId)
    .neq('profile_id', input.actorId)
    .neq('notification_level', 'muted');

  if (followsError || !follows?.length) {
    if (followsError) {
      console.error('Failed to resolve push recipients:', followsError);
    }
    return;
  }

  const recipientIds = follows
    .filter((follow) => {
      const profile = Array.isArray(follow.profiles)
        ? follow.profiles[0]
        : follow.profiles;
      return profile?.is_active === true;
    })
    .map((follow) => follow.profile_id);

  if (recipientIds.length === 0) {
    return;
  }

  const { data: subscriptions, error: subscriptionsError } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh_key, auth_key')
    .in('profile_id', recipientIds)
    .eq('is_active', true);

  if (subscriptionsError || !subscriptions?.length) {
    if (subscriptionsError) {
      console.error('Failed to load push subscriptions:', subscriptionsError);
    }
    return;
  }

  const template = PUSH_TEMPLATES[input.eventType];
  const payload = JSON.stringify({
    title: template.title,
    body: template.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    url: `/students/${input.studentId}`,
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key,
            },
          },
          payload
        );

        await admin
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', subscription.id);
      } catch (error) {
        const statusCode = getStatusCode(error);

        if (statusCode === 404 || statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', subscription.id);
          return;
        }

        console.error('Failed to send push notification:', error);
      }
    })
  );
}
