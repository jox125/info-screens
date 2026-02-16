import { ERROR_CODES, SUCCESS_CODES } from "/shared/constants/codes.js";

export const ERROR_MESSAGES = {
    [ERROR_CODES.FORBIDDEN]: "Forbidden",
    [ERROR_CODES.SESSION_NOT_FOUND]: "Session not found",
    [ERROR_CODES.SESSION_NAME_REQUIRED]: "Sesssion name is required",
    [ERROR_CODES.SESSION_FULL]: "Session is full",
    [ERROR_CODES.SESSION_LOCKED]: "Session cannot be modified because session is \${status}",
    [ERROR_CODES.SESSION_DRIVERS_REQUIRED]: "At least 2 drivers required to confirm",
    [ERROR_CODES.DRIVER_NOT_FOUND]: "Driver not found",
    [ERROR_CODES.DRIVER_NAME_REQUIRED]: "Driver name is required",
    [ERROR_CODES.DRIVER_EXISTS]: "Driver \${name} already exists",
    [ERROR_CODES.DRIVER_LOCKED]: "Driver cannot be modified because session is \${status}",
    [ERROR_CODES.CAR_EXISTS]: "Car with number \${carNum} exists",
    [ERROR_CODES.CAR_OUT_OF_RANGE]: "Car number must be between 0 and 999",
    [ERROR_CODES.NO_NEXT_RACE]: "<p>No next race coming</p><p>Add races from /front-desk</p>",
    [ERROR_CODES.AT_LEAST_ONE_FIELD_REQUIRED]: "At least one field must be provided"
}

export const SUCCESS_MESSAGES = {
    [SUCCESS_CODES.SESSION_ADDED]: "Session added successfully",
    [SUCCESS_CODES.SESSION_UPDATED]: "Session updated successfully",
    [SUCCESS_CODES.SESSION_DELETED]: "Session deleted successfully",
    [SUCCESS_CODES.SESSION_CONFIRMED]: "Session confirmed successfully",
    [SUCCESS_CODES.DRIVER_ADDED]: "Driver added successfully",
    [SUCCESS_CODES.DRIVER_UPDATED]: "Driver updated successfully",
    [SUCCESS_CODES.DRIVER_DELETED]: "Driver deleted successfully"
}