export const STATUS = {
    IN_PROGRESS: "in progress",
    NEXT: "next",
    UPCOMING: "upcoming",
    FINISHED: "finished"
};

// Used by front desk so only upcoming sessions can be edited
export const IMMUTABLE_STATUSES = new Set([
    STATUS.IN_PROGRESS,
    STATUS.FINISHED,
    STATUS.NEXT
]);