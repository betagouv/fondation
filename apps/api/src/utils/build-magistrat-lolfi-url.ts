export function buildMagistratLolfiUrl(id: number | string): string {
  const url = new URL(
    `http://lolfi.dsj.intranet.justice.gouv.fr/lolf/lolf_fic_fonc.asp?affiche=fic`,
  );
  url.searchParams.set(
    'num_fonc',
    typeof id === 'string' ? id : id.toString(10),
  );

  return url.toString();
}
