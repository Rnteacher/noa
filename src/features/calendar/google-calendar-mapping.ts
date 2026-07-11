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

const JERUSALEM_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jerusalem',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function getLocalDateString(dateTimeStr: string): string {
  return JERUSALEM_DATE_FORMATTER.format(new Date(dateTimeStr));
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
