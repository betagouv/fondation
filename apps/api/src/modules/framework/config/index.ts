import { ApiConfig, ConfigSchema } from './config.schema';

let configSingleton: ApiConfig | undefined = undefined;
export async function loadConfig(): Promise<ApiConfig> {
  return (configSingleton ||= await ConfigSchema.parseAsync({}));
}

export { API_CONFIG_TOKEN } from './config.constants';
export * from './config.module';
export { ApiConfig };
