
export type AgentRole = string;

export const SpecialRoles = {
  MASTER_PM: 'Master PM'
} as const;

export type CouncilTone = 'Mentorship' | 'Doc Bar-Raiser' | 'Cruel Critique';
export type DecisionType = 'Type 1 (One-Way)' | 'Type 2 (Two-Way)';

export interface UserSettings {
  lpFocus: string[];
  tone: CouncilTone;
  orgContext: string;
}

export interface RejectedPath {
  path: string;
  reason: string;
}

export interface AgentPerspective {
  role: string;
  content: string;
  vote: 'Approve' | 'Request Changes' | 'Reject';
  reasoning: string;
  score: number; // 1-5 Score for deterministic auditing
}

export interface CouncilSession {
  id: string;
  title: string;
  topic: string;
  messages: Message[];
  perspectives: AgentPerspective[];
  prfaq: string | null;
  councilReport: string | null;
  rejectedPaths: RejectedPath[];
  decisionType: DecisionType | null;
  status: 'draft' | 'discussing' | 'voting' | 'completed';
  facets: {
    customer: boolean;
    problem: boolean;
    benefit: boolean;
    solution: boolean;
  };
  createdAt: number;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
}
