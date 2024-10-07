/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_TAG_ID: string | undefined;
  readonly VITE_DOMAIN_NAME: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
