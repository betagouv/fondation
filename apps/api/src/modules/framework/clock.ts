import { Injectable, Module, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class Clock {
  now(): Date {
    return new Date();
  }
}

@Module({ providers: [Clock], exports: [Clock] })
export class ClockModule implements OnApplicationBootstrap {
  onApplicationBootstrap() {
    if (process.env.TZ !== 'Etc/UTC' || this.timeZoneName !== 'UTC') {
      throw new Error('The current time zone is not UTC\n  Please override the TZ envvar to "Etc/UTC"\n\n');
    }
  }

  private get timeZoneName(): string | undefined {
    return new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
      .formatToParts(new Date())
      .find(({ type }) => type === 'timeZoneName')?.value;
  }
}
