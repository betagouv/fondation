export function capitalize(input: string): string {
  let output = '';
  let shouldCapitalize = true;
  for (const char of input) {
    if (shouldCapitalize) {
      output += char.toUpperCase();
      shouldCapitalize = false;
      continue;
    }

    shouldCapitalize = /\W/.test(char);
    output += char;
  }

  return output;
}
