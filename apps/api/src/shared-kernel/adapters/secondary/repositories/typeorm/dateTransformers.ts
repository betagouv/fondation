import { ValueTransformer } from 'typeorm';

export class DateTransformer implements ValueTransformer {
  to(value: Date): Date {
    return value;
  }
  from(value: string): Date {
    return new Date(value);
  }
}
