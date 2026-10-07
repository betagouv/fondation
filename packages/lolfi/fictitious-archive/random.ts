import { type Faker } from '@faker-js/faker';

/** The values observed at the 10th, 50th and 90th percentiles */
export type Deciles = readonly [number, number, number];

export class Random {
  constructor(private readonly faker: Faker) {}

  chance(probability: number): boolean {
    return this.faker.number.float() < probability;
  }

  int(min: number, max: number): number {
    return this.faker.number.int({ max, min });
  }

  pick<T>(items: readonly T[]): T {
    return this.faker.helpers.arrayElement(items);
  }

  pickWeighted<T>(weights: ReadonlyMap<T, number>): T {
    return this.faker.helpers.weightedArrayElement(
      [...weights].map(([value, weight]) => ({ value, weight })),
    );
  }

  followingDeciles([p10, p50, p90]: Deciles): number {
    const p = this.faker.number.float();
    if (p < 0.1) return p10 - 1 + p * 10;
    if (p < 0.5) return p10 + ((p - 0.1) / 0.4) * (p50 - p10);
    if (p < 0.9) return p50 + ((p - 0.5) / 0.4) * (p90 - p50);
    return p90 + (p - 0.9) * 10;
  }
}
