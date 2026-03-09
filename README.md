# Watch Session Tracker (Zod, Express and Supertest) version

A small TypeScript + Node.js proof of concept real-time watch-session service prompt.

## Why this design

This implementation stays intentionally simple:

- **Express REST API** for low-friction event ingestion and querying
- **In-memory session store** because the PRD explicitly allows it for a long-running v1 service and emphasizes simplicity over production hardening
- **45-second activity window** to interpret "currently active" using 30-second heartbeats with a small grace period
- **Event ID deduplication** to reduce double-counting when clients retry requests

For a production version, I would likely separate ingestion from querying with a durable queue and a backing store such as Redis or DynamoDB, but I did not add that complexity here.

## API surface

### `POST /events`
Accepts viewer events such as:

- `start`
- `heartbeat`
- `pause`
- `resume`
- `seek`
- `quality_change`
- `buffer_start`
- `buffer_end`
- `end`

### `GET /events/:eventId/active-sessions`
Returns the current active session count for a stream event.

### `GET /sessions/:sessionId`
Returns session details including:

- duration so far
- current state
- events received

## Run the service

```bash
npm install
npm start
```

## Run tests

```bash
npm test
```

## Example request

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc-123",
    "userId": "user-456",
    "eventType": "heartbeat",
    "eventId": "evt-789",
    "eventTimestamp": "2026-02-10T19:32:15.123Z",
    "receivedAt": "2026-02-10T19:32:15.450Z",
    "payload": {
      "eventId": "event-2026-wrestling-finals",
      "position": 1832.5,
      "quality": "1080p"
    }
  }'
```

## Example query responses

### Active sessions

```json
{
  "eventId": "event-2026-wrestling-finals",
  "activeSessionCount": 1,
  "activeWindowSeconds": 45
}
```

### Session details

```json
{
  "sessionId": "abc-123",
  "userId": "user-456",
  "eventId": "event-2026-wrestling-finals",
  "state": "active",
  "startedAt": "2026-02-10T19:32:15.123Z",
  "lastEventTimestamp": "2026-02-10T19:32:45.123Z",
  "lastReceivedAt": "2026-02-10T19:32:45.200Z",
  "endedAt": null,
  "durationSoFarSeconds": 30,
  "currentQuality": "1080p",
  "lastKnownPosition": 30,
  "eventsReceived": []
}
```

## What I chose to test

I focused the tests on the behavior most important to the prompt:

- accepting valid ingestion payloads
- rejecting invalid payloads
- deduplicating duplicate event IDs
- computing near-real-time active session counts
- returning useful session detail snapshots

## Assumptions

- The `payload.eventId` identifies the sporting event / stream being watched.
- A session is considered active if it is not ended and an event was received within the last 45 seconds.
- Session duration is measured from the first event timestamp to the latest event timestamp, or the `end` event if present.
- `receivedAt` is used for activity freshness because it reflects when the service actually saw the event.
