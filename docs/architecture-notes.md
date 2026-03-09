# Architecture Notes

## Summary

This proof of concept prioritizes simplicity, fast setup, and straightforward reasoning.

## Request flow

1. Client sends an event to `POST /events`
2. API validates the payload with Zod
3. In-memory store updates the session snapshot
4. Query endpoints return the latest computed state

## Session state model

- `start`, `heartbeat`, `resume`, `seek`, `quality_change` => `active`
- `pause` => `paused`
- `buffer_start` => `buffering`
- `buffer_end` => `active`
- `end` => `ended`

## Active session logic

A session counts as active when:

- it belongs to the requested stream event
- it is not in the `ended` state
- the last `receivedAt` timestamp is within the last 45 seconds

This supports the stated goal of being close to real-time while remaining easy to explain.

## Trade-offs

### What this version does well

- Easy to run locally
- Low code volume
- Clear session lifecycle behavior

### What this version does not solve yet

- Durable storage during restarts
- Horizontal scaling across multiple instances
- Backpressure / buffering during heavy spikes
- Replay / reprocessing of lost events

## Production direction

For production, I would likely move toward:

- a durable ingestion layer
- a shared low-latency state store
- better observability and metrics
- TTL-based cleanup for stale sessions
