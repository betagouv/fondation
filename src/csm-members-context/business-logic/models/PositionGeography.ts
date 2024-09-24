export type POSITION_CITY = 'PARIS' | 'PITRE' | 'BOBIGNY';
export type NO_ASSIGNMENT = 'NO_ASSIGNMENT';
export type SECONDMENT = 'SECONDMENT';
export type Ressort = 'CA_PARIS' | 'CA_BASSE_TERRE';

export class PositionGeography {
  location: POSITION_CITY | NO_ASSIGNMENT | SECONDMENT;

  private readonly cityToOverseas: Record<POSITION_CITY, boolean> = {
    PARIS: false,
    BOBIGNY: false,
    PITRE: true,
  };
  private readonly cityToRessort: Record<POSITION_CITY, Ressort> = {
    PARIS: 'CA_PARIS',
    BOBIGNY: 'CA_PARIS',
    PITRE: 'CA_BASSE_TERRE',
  };

  constructor(position: POSITION_CITY | NO_ASSIGNMENT | SECONDMENT) {
    this.location = position;
  }

  isNotAssigned(): boolean {
    return this.location === 'NO_ASSIGNMENT';
  }
  isSecondment(): boolean {
    return this.location === 'SECONDMENT';
  }
  isCity() {
    return !this.isNotAssigned() && !this.isSecondment();
  }
  isOverseas(): boolean | null {
    if (this.isNotAssigned() || this.isSecondment()) return null;

    return this.cityToOverseas[
      this.location as Exclude<
        PositionGeography['location'],
        'NO_ASSIGNMENT' | 'SECONDMENT'
      >
    ];
  }
  getRessort(): Ressort | null {
    if (this.isCity())
      return this.cityToRessort[this.location as POSITION_CITY];
    return null;
  }
}
