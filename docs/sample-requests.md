# Sample Requests

## Ingest a start event

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-1001",
    "userId": "user-42",
    "eventType": "start",
    "eventId": "evt-1001",
    "eventTimestamp": "2026-02-10T19:32:15.123Z",
    "receivedAt": "2026-02-10T19:32:15.450Z",
    "payload": {
      "eventId": "event-2026-wrestling-finals",
      "position": 0,
      "quality": "1080p"
    }
  }'
```

## Ingest a heartbeat event

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-1001",
    "userId": "user-42",
    "eventType": "heartbeat",
    "eventId": "evt-1002",
    "eventTimestamp": "2026-02-10T19:32:45.123Z",
    "receivedAt": "2026-02-10T19:32:45.200Z",
    "payload": {
      "eventId": "event-2026-wrestling-finals",
      "position": 30,
      "quality": "1080p"
    }
  }'
```

## Query active sessions

```bash
curl http://localhost:3000/events/event-2026-wrestling-finals/active-sessions
```

## Query a session

```bash
curl http://localhost:3000/sessions/session-1001
```
