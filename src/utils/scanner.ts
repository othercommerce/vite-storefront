import fs from 'node:fs';
import path from 'node:path';

export function scan(dir: string, extensions: string[] = ['.vue'], list: string[] = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const resolved = path.join(dir, file);
    const stats = fs.statSync(resolved);

    if (stats.isDirectory()) {
      list = scan(resolved, extensions, list);
    } else {
      extensions.forEach((extension) => {
        if (resolved.endsWith(extension)) {
          list.push(resolved);
        }
      });
    }
  });

  return list;
}
