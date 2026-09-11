/**
 * Ambient declarations for Vite asset URL imports, such as
 * `import appCss from "./styles.css?url"`.
 *
 * Projects that reference `vite/client` (for example the Vite app) receive
 * these from Vite itself. Package type programs can still include app files
 * transitively (for example through a generated route tree), so the
 * declarations are provided here for every project that extends this config.
 */
declare module "*.css?url" {
  const url: string;
  export default url;
}
