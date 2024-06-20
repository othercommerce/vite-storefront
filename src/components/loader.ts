import { ResolvedConfig, normalizePath } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import { scan } from '../utils/scanner';
import { asGlobalComponent } from '../utils/names';
import { Options } from '../vite-storefront';

type ResolvedComponent = {
  name: string;
  path: string;
  vendor: boolean;
}

type ComponentsMap = Map<string, ResolvedComponent>;

export function loadComponentsModule(config: ResolvedConfig, options: Options, compile: boolean = true) {
  const { vendors, views } = collectComponents(config, options);

  const resolvedVendor = path.resolve(config.root, options.vendor);
  const resolvedLocal = path.resolve(config.root, options.local);

  buildComponentsDeclarations(resolvedVendor, vendors);
  buildComponentsDeclarations(resolvedLocal, views);

  buildVueDeclarations(resolvedVendor, vendors);
  buildVueDeclarations(resolvedLocal, views);

  if (compile) {
    return buildComponentsModule(views);
  }

  return null;
}

function collectComponents(config: ResolvedConfig, options: Options) {
  const vendors = new Map<string, ResolvedComponent>();
  const views = new Map<string, ResolvedComponent>();

  resolveComponents(config, options, views, vendors, 'Components');
  resolveComponents(config, options, views, vendors, 'Shop');
  resolveComponents(config, options, views, vendors, 'Layout');
  resolveComponents(config, options, views, vendors, 'Sections');

  return { vendors, views };
}

function resolveComponents(config: ResolvedConfig, options: Options, views: ComponentsMap, vendors: ComponentsMap, subdirectory: string) {
  let local = path.resolve(config.root, options.local, subdirectory);
  let vendor = path.resolve(config.root, options.vendor, subdirectory);

  if (fs.existsSync(vendor)) {
    scan(vendor).forEach((path) => {
      let name = asGlobalComponent(path);

      path = normalizePath(path);

      views.set(name, { name, path, vendor: true });
      vendors.set(name, { name, path, vendor: true });
    });
  }

  if (fs.existsSync(local)) {
    scan(local).forEach((path) => {
      let name = asGlobalComponent(path);

      path = normalizePath(path);

      views.set(name, { name, path, vendor: false });
    });
  }
}

function buildComponentsModule(views: ComponentsMap) {
  let lines = [];

  views.forEach((resolved) => lines.push(`import ${resolved.name} from '${resolved.path}';`));
  lines.push(`import { Features } from '$features';`);
  lines.push(``);
  lines.push(`export {`);
  views.forEach((resolved) => lines.push(`  ${resolved.name},`));
  lines.push(`};`);
  lines.push(``);
  lines.push(`export const Storefront = {`);
  lines.push(`  install(app) {`);
  views.forEach((resolved) => lines.push(`    app.component('${resolved.name}', ${resolved.name});`));
  lines.push(``);
  lines.push(`    app.config.globalProperties.$features = Features;`);
  lines.push(`  },`);
  lines.push(`};`);

  return lines.join('\n');
}

function buildComponentsDeclarations(target: string, views: ComponentsMap) {
  let directory = path.resolve(target, 'Types');
  let declarations = path.resolve(directory, 'components.d.ts');
  let lines = [];

  lines.push(`// THIS FILE IS AUTOGENERATED!`);
  lines.push(`// DO NOT EDIT!`);
  lines.push(`declare module '$components' {`);
  lines.push(`  import { Plugin } from 'vue';`);
  lines.push(`  export const Storefront: Plugin;`);
  lines.push(``);
  views.forEach((resolved) => lines.push(`  export { default as ${resolved.name} } from '${normalizePath(path.relative(directory, resolved.path))}';`));
  lines.push(`}`);
  lines.push(``);
  lines.push(`export {};`);

  fs.writeFileSync(declarations, lines.join('\n'));
}

function buildVueDeclarations(target: string, views: ComponentsMap) {
  let directory = path.resolve(target, 'Types');
  let declarations = path.resolve(directory, 'vue.d.ts');
  let lines = [];

  lines.push(`// THIS FILE IS AUTOGENERATED!`);
  lines.push(`// DO NOT EDIT!`);
  lines.push(`declare module '@vue/runtime-core' {`);
  lines.push(`  export interface GlobalComponents {`);
  views.forEach((resolved) => lines.push(`    ${resolved.name}: typeof import('${normalizePath(path.relative(directory, resolved.path))}')['default'],`));
  lines.push(`  }`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export {}`);

  fs.writeFileSync(declarations, lines.join('\n'));
}
