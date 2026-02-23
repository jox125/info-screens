export const STATUS = Object.freeze({
  UPCOMING: "upcoming",
  IN_PROGRESS: "in progress",
  NEXT: "next",
  CONFIRMED: "confirmed",
  FINISHED: "finished",
  CLOSED: "closed",
});

// Used by front desk so only upcoming sessions are visible and can be edited
export const IMMUTABLE_STATUSES = new Set([
  STATUS.IN_PROGRESS,
  STATUS.FINISHED,
  STATUS.NEXT,
  STATUS.CONFIRMED,
  STATUS.CLOSED,
]);
