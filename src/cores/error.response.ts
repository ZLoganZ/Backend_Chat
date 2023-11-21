import { statusCodes } from 'utils/statusCodes';
import { reasonPhrases } from 'utils/reasonPhrases';

class ErrorResponse extends Error {
  public code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

export class BadRequest extends ErrorResponse {
  constructor(message: string) {
    super(statusCodes.BAD_REQUEST, message || reasonPhrases.BAD_REQUEST);
  }
}

export class Unauthorized extends ErrorResponse {
  constructor(message: string) {
    super(statusCodes.UNAUTHORIZED, message || reasonPhrases.UNAUTHORIZED);
  }
}

export class Forbidden extends ErrorResponse {
  constructor(message: string) {
    super(statusCodes.FORBIDDEN, message || reasonPhrases.FORBIDDEN);
  }
}

export class NotFound extends ErrorResponse {
  constructor(message: string) {
    super(statusCodes.NOT_FOUND, message || reasonPhrases.NOT_FOUND);
  }
}

export class Conflict extends ErrorResponse {
  constructor(message: string) {
    super(statusCodes.CONFLICT, message || reasonPhrases.CONFLICT);
  }
}

export class InternalServerError extends ErrorResponse {
  constructor(message: string) {
    super(statusCodes.INTERNAL_SERVER_ERROR, message || reasonPhrases.INTERNAL_SERVER_ERROR);
  }
}
