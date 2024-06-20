import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite';
import { loadViewsModule } from './views/loader';
import { loadComponentsModule } from './components/loader';
import { loadFeaturesModule } from './features/loader';

export type Options = {
  local: string;
  vendor: string;
}

const defaults: Options = {
  local: 'resources/js/web/src',
  vendor: 'vendor/procommerce/framework/packages/storefront/src',
};

export default function storefront(props?: Partial<Options>): Plugin {
  let options: Options = { ...defaults, ...props };
  let config: ResolvedConfig;

  function refreshDeclarations(config: ResolvedConfig, options: Options, server: ViteDevServer) {
    loadComponentsModule(config, options, false);
    loadViewsModule(config, options, false);

    const componentsModule = server.moduleGraph.getModuleById('\0$components');
    const viewsModule = server.moduleGraph.getModuleById('\0$views');


    if (componentsModule) {
      server.reloadModule(componentsModule);
    }

    if (viewsModule) {
      server.reloadModule(viewsModule);
    }
  }

  return {
    name: 'storefront',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    resolveId(id) {
      if (id === '$components') return '\0$components';
      if (id === '$views') return '\0$views';
      if (id === '$features') return '\0$features';
    },

    load(id) {
      if (id === '\0$components') return loadComponentsModule(config, options);
      if (id === '\0$views') return loadViewsModule(config, options);
      if (id === '\0$features') return loadFeaturesModule(config, options);
    },

    configureServer(server) {
      const handler = (path: string) => {
        if (path.endsWith('.vue')) {
          refreshDeclarations(config, options, server);
        }
      };

      server.watcher.on('add', handler);
      server.watcher.on('unlink', handler);
      server.watcher.on('addDir', handler);
      server.watcher.on('unlinkDir', handler);

      server.watcher.on('change', (path: string) => {
        if (path.endsWith('Features.php')) {
          loadFeaturesModule(config, options, false);

          const featuresModule = server.moduleGraph.getModuleById('\0$features');

          if (featuresModule) {
            server.reloadModule(featuresModule);
          }
        }
      });
    },
  };
}






