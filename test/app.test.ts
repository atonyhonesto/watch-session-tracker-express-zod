import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { WatchSessionStore } from '../src/store';

const baseEvent = {
  sessionId: 'abc-123',
  userId: 'user-456',
  eventType: 'start',
  eventId: 'evt-001',
  eventTimestamp: '2026-02-10T19:32:15.123Z',
  receivedAt: '2026-02-10T19:32:15.450Z',
  payload: {
    eventId: 'event-2026-wrestling-finals',
    position: 0,
    quality: '1080p'
  }
};

describe('Watch session tracker API', () => {
  const store = new WatchSessionStore();
  const app = createApp(store);

  beforeEach(() => {
    store.reset();
    vi.useRealTimers();
  });

  it('accepts an incoming event', async () => {
    const response = await request(app).post('/events').send(baseEvent);

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({
      accepted: true,
      sessionId: 'abc-123',
      state: 'active',
      eventCount: 1
    });
  });

  it('deduplicates duplicate event IDs', async () => {
    await request(app).post('/events').send(baseEvent);
    const duplicate = await request(app).post('/events').send(baseEvent);

    expect(duplicate.status).toBe(200);
    expect(duplicate.body.accepted).toBe(false);
    expect(duplicate.body.reason).toBe('duplicate_event_id');
  });

  it('returns active session count close to real time', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10T19:32:20.000Z'));

    await request(app).post('/events').send(baseEvent);

    const countResponse = await request(app)
      .get('/events/event-2026-wrestling-finals/active-sessions');

    expect(countResponse.status).toBe(200);
    expect(countResponse.body.activeSessionCount).toBe(1);

    vi.setSystemTime(new Date('2026-02-10T19:33:10.000Z'));

    const expired = await request(app)
      .get('/events/event-2026-wrestling-finals/active-sessions');

    expect(expired.body.activeSessionCount).toBe(0);
  });

  it('returns session details with duration and events received', async () => {
    await request(app).post('/events').send(baseEvent);
    await request(app).post('/events').send({
      ...baseEvent,
      eventType: 'heartbeat',
      eventId: 'evt-002',
      eventTimestamp: '2026-02-10T19:32:45.123Z',
      receivedAt: '2026-02-10T19:32:45.200Z',
      payload: {
        ...baseEvent.payload,
        position: 30
      }
    });

    const response = await request(app).get('/sessions/abc-123');

    expect(response.status).toBe(200);
    expect(response.body.durationSoFarSeconds).toBe(30);
    expect(response.body.eventsReceived).toHaveLength(2);
    expect(response.body.lastKnownPosition).toBe(30);
  });

  it('validates malformed payloads', async () => {
    const response = await request(app).post('/events').send({ foo: 'bar' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid event payload.');
  });
});
