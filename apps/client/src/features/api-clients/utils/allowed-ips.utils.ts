/** One IP a line, blank lines left out: the API checks each IP */
export function allowedIpsOf(text: string): { ip: string }[] {
  return text
    .split('\n')
    .map((ip) => ip.trim())
    .filter(Boolean)
    .map((ip) => ({ ip }));
}
