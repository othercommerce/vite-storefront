export function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, (match, offset) => (offset !== 0 ? '_' : '') + match.toLowerCase());
}

export function toPascalCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
