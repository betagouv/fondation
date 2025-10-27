import * as drizzle from 'src/modules/framework/drizzle/drizzle';

export const getDrizzleInstance = drizzle.getDrizzleInstance;
export type DrizzleDb = ReturnType<typeof getDrizzleInstance>;
