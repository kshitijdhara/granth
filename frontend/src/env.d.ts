interface ImportMeta {
  readonly env: {
    readonly API_BASE_URL?: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
  };
}
