// same rule as the client: only ten-digit numbers are grouped, anything else is shown as is
export function formatPhoneNumber(input: string): string {
  const digits = input.replace(/[\s.-]/g, '');
  return /^\d{10}$/.test(digits) ? digits.replace(/(\d{2})(?=\d)/g, '$1 ') : input;
}
