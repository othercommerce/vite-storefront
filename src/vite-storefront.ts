import type { Plugin, ResolvedConfig, UpdatePayload, ViteDevServer } from 'vite';
import { loadViewsModule } from './views/loader';
import { loadComponentsModule } from './components/loader';

export type Options = {
  local: string;
  vendor: string;
}

const defaults: Options = {
  local: 'resources/js/web/src',
  vendor: 'vendor/procommerce/framework/packages/storefront/src',
};

export default function storefront(props: Partial<Options>): Plugin {
  let options: Options = { ...defaults, ...props };
  let config: ResolvedConfig;

  return {
    name: 'storefront',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    resolveId(id) {
      if (id === '$components') {
        return '$components';
      }

      if (id === '$views') {
        return '$views';
      }
    },

    load(id) {
      if (id === '$components') {
        return loadComponentsModule(config, options);
      }

      if (id === '$views') {
        return loadViewsModule(config, options);
      }
    },

    configureServer(server) {
      server.watcher.on('add', (path) => refreshDeclarations(config, options, server, path));
      server.watcher.on('unlink', (path) => refreshDeclarations(config, options, server, path));
    },
  };
}

function refreshDeclarations(config: ResolvedConfig, options: Options, server: ViteDevServer, path: string) {
  loadComponentsModule(config, options, false);
  loadViewsModule(config, options, false);

  const timestamp = +new Date();

  const payload: UpdatePayload = {
    type: 'update',
    updates: [
      { acceptedPath: path, path: path, timestamp, type: 'js-update' },
    ],
  };

  server.hot.send(payload);
}






