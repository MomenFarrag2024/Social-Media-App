import type { ApiFieldIssue } from '../types';

export class ApiError extends Error {
  status?: number;
  issues: ApiFieldIssue[];

  constructor(message: string, status?: number, issues: ApiFieldIssue[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues;
  }
}

export class PostNotFoundError extends Error {
  constructor() {
    super('This post could not be retrieved.');
    this.name = 'PostNotFoundError';
  }
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError) {
    const details = error.issues.map((issue) => issue.message).filter((msg) => !error.message.includes(msg));
    return details.length > 0 ? `${error.message}: ${details.join('; ')}` : error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
