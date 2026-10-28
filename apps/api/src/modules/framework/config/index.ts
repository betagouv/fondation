import { ApiConfig, ConfigSchema } from './config.schema';

let configSingleton: ApiConfig | undefined = undefined;
export function loadConfig(): ApiConfig {
  return (configSingleton ||= ConfigSchema.parse({}));
}

export { API_CONFIG_TOKEN } from './config.constants';
export * from './config.module';
export { ApiConfig };
