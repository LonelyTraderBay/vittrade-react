import { z } from 'zod';
import type { RegistrationChallengeState } from '../model/registration-types';

const registrationRouteStateSchema = z.object({
  purpose: z.literal('register'),
  challengeId: z.string().trim().min(1),
  channel: z.enum(['email', 'phone']),
  maskedDestination: z.string().trim().min(1),
  expiresAt: z.string().datetime({ offset: true }),
});

export function parseRegistrationChallengeState(value: unknown): RegistrationChallengeState | null {
  const parsed = registrationRouteStateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
