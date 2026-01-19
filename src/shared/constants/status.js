export const STATUS = {
    IN_PROGRESS: "in progress",
    NEXT: "next",
    UPCOMING: "upcoming",
    FINISHED: "finished"
}

export const IMMUTABLE_STATUSES = new Set([
    STATUS.IN_PROGRESS,
    STATUS.FINISHED
])