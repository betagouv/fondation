import { z } from 'zod';
import { DomainRegistry } from './domain-registry';
import { addDays } from 'date-fns';

export class UserSession {
  private _createdAt: Date;
  private _expiresAt: Date;
  private _sessionId: string;
  private _userId: string;

  constructor(
    createdAt: Date,
    expiresAt: Date,
    sessionId: string,
    userId: string,
  ) {
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.sessionId = sessionId;
    this.userId = userId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
  private set createdAt(value: Date) {
    this._createdAt = value;
  }

  public get expiresAt(): Date {
    return this._expiresAt;
  }
  private set expiresAt(value: Date) {
    this._expiresAt = value;
  }

  public get sessionId(): string {
    return this._sessionId;
  }
  private set sessionId(value: string) {
    this._sessionId = value;
  }

  public get userId(): string {
    return this._userId;
  }
  private set userId(value: string) {
    this._userId = value;
  }

  static create(
    expiresInDays: number,
    sessionId: string,
    userId: string,
  ): UserSession {
    const createdAt = DomainRegistry.dateTimeProvider().now();
    const expiresAt = this.asExpiryDate(createdAt, expiresInDays);
    return new UserSession(createdAt, expiresAt, sessionId, userId);
  }

  private static asExpiryDate(createdAt: Date, expiresInDays: number): Date {
    const expiresInDaysParsed = z.number().min(1).max(365).parse(expiresInDays);
    return addDays(createdAt, expiresInDaysParsed);
  }
}
