// Where our users sit. The footprint spans UTC-10 to UTC+12: the four negative ones read the
// day before on anything anchored to UTC midnight. Marquesas lands on a half hour and Miquelon
// is the only overseas territory observing DST
export const FRENCH_TIME_ZONES = [
  'Pacific/Tahiti',
  'Pacific/Marquesas',
  'America/Cayenne',
  'America/Miquelon',
  'Europe/Paris',
  'Indian/Reunion',
  'Pacific/Wallis',
];
