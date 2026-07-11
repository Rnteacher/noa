import { calendar_v3 } from 'googleapis';

type LocalEventInput = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  location: string | null;
};

export function getLocalDateString(dateTimeStr: string): string {
  const d = new Date(dateTimeStr);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const date = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function mapLocalToGoogleEvent(event: LocalEventInput): calendar_v3.Schema$Event {
  const resource: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    extendedProperties: {
      private: {
        chamama_event_id: event.id,
        chamama_source: 'staff_app',
      },
    },
  };

  if (event.isAllDay) {
    resource.start = {
      date: getLocalDateString(event.startsAt),
    };
    resource.end = {
      date: getLocalDateString(event.endsAt),
    };
  } else {
    resource.start = {
      dateTime: event.startsAt,
      timeZone: 'Asia/Jerusalem',
    };
    resource.end = {
      dateTime: event.endsAt,
      timeZone: 'Asia/Jerusalem',
    };
  }

  return resource;
}
