import { z } from 'zod';
import { EVENT_TYPES } from './types';

export const viewerEventSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  eventType: z.enum(EVENT_TYPES),
  eventId: z.string().min(1),
  eventTimestamp: z.string().datetime({ offset: true }),
  receivedAt: z.string().datetime({ offset: true }),
  payload: z.object({
    eventId: z.string().min(1),
    position: z.number().nonnegative().optional(),
    quality: z.string().min(1).optional()
  })
});

export type ViewerEventInput = z.infer<typeof viewerEventSchema>;
