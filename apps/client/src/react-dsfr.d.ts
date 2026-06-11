export {};

declare module '@codegouvfr/react-dsfr/link' {
  interface RegisterLink {
    Link: (typeof import('react-router'))['Link'];
  }
}
