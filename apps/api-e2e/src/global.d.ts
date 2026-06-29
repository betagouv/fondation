import type { BodyInit as UndiciBodyInit } from 'undici-types';

declare global {
  type BodyInit = UndiciBodyInit;
}

export {};
