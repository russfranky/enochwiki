// The editorial review state machine: the single named definition.
//
// Every item that passes the editorial gate (evidence, public articles,
// topic pages, sources) lives in one of REVIEW_STATES and moves only via
// REVIEW_ACTIONS, per ALLOWED_FROM. Before this module, the states and the
// transition table were re-typed as raw string literals in 14 files
// (schema comments, five API routes, two components, six scripts); the
// table below is copied verbatim from src/app/api/review/route.ts, which
// was the only place it existed. Behavior is unchanged: same states, same
// actions, same allowed transitions, same target states.
//
// The database columns stay plain strings (no migration). This module is
// the type-level and runtime source of truth at the API edge.

export const REVIEW_STATES = [
  'draft',
  'auto-corroborated',
  'in-review',
  'approved',
  'rejected',
  'needs-revision',
  'archived',
] as const
export type ReviewState = (typeof REVIEW_STATES)[number]

export const REVIEW_ITEM_TYPES = ['evidence', 'public-article', 'topic-page', 'source'] as const
export type ReviewItemType = (typeof REVIEW_ITEM_TYPES)[number]

export const REVIEW_ACTIONS = [
  'submit-review',
  'approve',
  'reject',
  'request-revision',
  'archive',
] as const
export type ReviewAction = (typeof REVIEW_ACTIONS)[number]

// Map action → new state (verbatim from the review route).
export const ACTION_TARGET_STATE: Record<ReviewAction, ReviewState> = {
  'submit-review': 'in-review',
  'approve': 'approved',
  'reject': 'rejected',
  'request-revision': 'needs-revision',
  'archive': 'archived',
}

// An action is only valid from certain current states. Without this, any
// item could be approved straight from draft or a rejected item
// re-approved, bypassing the gate (verbatim from the review route).
export const ALLOWED_FROM: Record<ReviewAction, readonly ReviewState[]> = {
  'submit-review': ['draft', 'auto-corroborated', 'needs-revision'],
  'approve': ['in-review', 'auto-corroborated'],
  'reject': ['in-review', 'auto-corroborated', 'needs-revision'],
  'request-revision': ['in-review', 'auto-corroborated'],
  'archive': ['draft', 'auto-corroborated', 'in-review', 'approved', 'rejected', 'needs-revision'],
}

export function isReviewState(value: string): value is ReviewState {
  return (REVIEW_STATES as readonly string[]).includes(value)
}

export function isReviewItemType(value: string): value is ReviewItemType {
  return (REVIEW_ITEM_TYPES as readonly string[]).includes(value)
}

// Target state for an action string, or undefined when the action is not
// part of the machine (the route answers 400 in that case, as before).
export function targetStateFor(action: string): ReviewState | undefined {
  return (ACTION_TARGET_STATE as Record<string, ReviewState>)[action]
}

// True when `action` may run from `current`. Unknown actions and unknown
// current states are never allowed, matching the route's includes() check.
export function canTransition(action: string, current: string): boolean {
  const allowed = (ALLOWED_FROM as Record<string, readonly string[]>)[action]
  return allowed ? allowed.includes(current) : false
}
