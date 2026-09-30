export type RegistrationChannel = 'email' | 'phone';

export interface RegistrationRequest {
  fullName: string;
  channel: RegistrationChannel;
  contact: string;
  password: string;
  referralCode?: string;
  acceptedTerms: true;
}

export interface RegistrationChallenge {
  challengeId: string;
  channel: RegistrationChannel;
  maskedDestination: string;
  expiresAt: string;
}

export interface RegistrationChallengeState extends RegistrationChallenge {
  purpose: 'register';
}
