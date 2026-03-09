import express, { Request, Response } from 'express';
import { ZodError } from 'zod';
import { viewerEventSchema } from './schema';
import { WatchSessionStore } from './store';

export function createApp(store = new WatchSessionStore()) {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/events', (req: Request, res: Response) => {
    try {
      const event = viewerEventSchema.parse(req.body);
      const result = store.ingest(event);
      res.status(result.accepted ? 202 : 200).json({
        accepted: result.accepted,
        reason: result.reason,
        sessionId: result.session.sessionId,
        state: result.session.currentState,
        eventCount: result.session.eventCount
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: 'Invalid event payload.',
          issues: error.issues
        });
      }

      return res.status(500).json({ message: 'Unexpected error while processing event.' });
    }
  });

  app.get('/events/:eventId/active-sessions', (req: Request, res: Response) => {
    const activeSessionCount = store.getActiveSessionCount(req.params.eventId);
    res.json({
      eventId: req.params.eventId,
      activeSessionCount,
      activeWindowSeconds: 45
    });
  });

  app.get('/sessions/:sessionId', (req: Request, res: Response) => {
    const session = store.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    return res.json({
      sessionId: session.sessionId,
      userId: session.userId,
      eventId: session.streamEventId,
      state: session.currentState,
      startedAt: session.startedAt,
      lastEventTimestamp: session.lastEventTimestamp,
      lastReceivedAt: session.lastReceivedAt,
      endedAt: session.endedAt ?? null,
      durationSoFarSeconds: session.durationSoFarSeconds,
      currentQuality: session.currentQuality ?? null,
      lastKnownPosition: session.lastKnownPosition ?? null,
      eventsReceived: session.eventsReceived
    });
  });

  return app;
}
