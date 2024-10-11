import { DataSource } from 'typeorm';
import { ormConfig } from './orm-config';

export default new DataSource(ormConfig('src'));
