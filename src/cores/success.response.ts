import { Response } from 'express';

import { statusCodes } from 'libs/response/statusCodes';
import { reasonPhrases } from 'libs/response/reasonPhrases';

class SuccessResponse {
  public code: number;
  public message: string;
  public metadata: Record<string, any>;

  constructor(code: number, message: string, data: Record<string, any>) {
    this.code = code;
    this.message = message;
    this.metadata = data;
  }
  send(res: Response) {
    return res.status(this.code).json(this);
  }
}

export class Ok extends SuccessResponse {
  constructor(message: string, data: Record<string, any> = {}) {
    super(statusCodes.OK, message || reasonPhrases.OK, data);
  }
}

export class Created extends SuccessResponse {
  constructor(message: string, data: Record<string, any> = {}) {
    super(statusCodes.CREATED, message || reasonPhrases.CREATED, data);
  }
}

export class Accepted extends SuccessResponse {
  constructor(message: string, data: Record<string, any> = {}) {
    super(statusCodes.ACCEPTED, message || reasonPhrases.ACCEPTED, data);
  }
}
