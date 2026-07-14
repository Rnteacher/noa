export type MessageBadge = {
  label: string;
  variant: 'caution' | 'critical';
};

export type MessageFeedItem = {
  id: string;
  kind: 'announcement' | 'update';
  title: string;
  subtitle: string;
  date: string;
  pinned: boolean;
  unread: boolean;
  badge: MessageBadge | null;
  href: string | null;
};

export type MessageFeedData = {
  items: MessageFeedItem[];
  error: string | null;
};
