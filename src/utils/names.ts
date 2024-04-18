import { normalizePath } from 'vite';
import { toSnakeCase, toPascalCase } from './strings';
import path from 'node:path';

export function asLaravel(path: string, absolute: string) {
  absolute = normalizePath(absolute);
  path = normalizePath(path);

  return absolute.replace(path, '').replace(/^\//, '').replace('.vue', '').split('/').map(toSnakeCase).join('.');
}

export function asComponent(path: string, absolute: string) {
  absolute = normalizePath(absolute);
  path = normalizePath(path);

  return absolute.replace(path, '').replace(/^\//, '').replace('.vue', '').split('/').map(toPascalCase).join('');
}

export function asGlobalComponent(absolute: string) {
  absolute = normalizePath(absolute);

  let basename = path.basename(absolute);
  let parsed = path.parse(basename);

  return toPascalCase(parsed.name);
}
