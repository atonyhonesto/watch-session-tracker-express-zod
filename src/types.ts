export const EVENT_TYPES = [
  'start',
  'heartbeat',
  'pause',
  'resume',
  'seek',
  'quality_change',
  'buffer_start',
  'buffer_end',
  'end'
] as const;

export type ViewerEventType = (typeof EVENT_TYPES)[number];

export interface ViewerEventPayload {
  eventId: string;
  position?: number;
  quality?: string;
}

export interface ViewerEvent {
  sessionId: string;
  userId: string;
  eventType: ViewerEventType;
  eventId: string;
  eventTimestamp: string;
  receivedAt: string;
  payload: ViewerEventPayload;
}

export type SessionState =
  | 'active'
  | 'paused'
  | 'buffering'
  | 'ended';

export interface SessionRecord {
  sessionId: string;
  userId: string;
  streamEventId: string;
  currentState: SessionState;
  startedAt: string;
  lastEventTimestamp: string;
  lastReceivedAt: string;
  lastKnownPosition?: number;
  currentQuality?: string;
  endedAt?: string;
  eventCount: number;
  durationSoFarSeconds: number;
  eventsReceived: ViewerEvent[];
}
