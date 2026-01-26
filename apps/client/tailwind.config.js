import { breakpoints } from '@codegouvfr/react-dsfr/fr/breakpoints';

/**
 * @type {import("@codegouvfr/react-dsfr/fr/breakpoints").BreakpointsValues}
 */
const breakpointsPx = breakpoints.getPxValues();

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'light-orange': '#D2BC8966',
        'light-blue': '#E8EDFF',
        'light-green': '#B8E6B566',
        'dark-blue': '#0063CB',
        'blue-france-sun-113': '#000091',
        'fr-gray-bg': '#f6f6f6'
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: false
  },
  screens: {
    sm: `${breakpointsPx.sm}px`,
    md: `${breakpointsPx.md}px`,
    lg: `${breakpointsPx.lg}px`,
    xl: `${breakpointsPx.xl}px`
  }
};
