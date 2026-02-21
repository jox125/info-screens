export const STATUS = Object.freeze({
    PLANNED: "planned",
    IN_PROGRESS: "in progress",
    NEXT: "next",
    UPCOMING: "upcoming",
    FINISHED: "finished",
    CLOSED: "closed"
});

// Used by front desk so only planned sessions are visible and can be edited
export const IMMUTABLE_STATUSES = new Set([
    STATUS.IN_PROGRESS,
    STATUS.FINISHED,
    STATUS.NEXT,
    STATUS.UPCOMING,
    STATUS.CLOSED
]);