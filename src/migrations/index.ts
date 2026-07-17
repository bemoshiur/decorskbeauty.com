import * as migration_20260715_220439_initial from './20260715_220439_initial';
import * as migration_20260717_004450_content_models from './20260717_004450_content_models';

export const migrations = [
  {
    up: migration_20260715_220439_initial.up,
    down: migration_20260715_220439_initial.down,
    name: '20260715_220439_initial',
  },
  {
    up: migration_20260717_004450_content_models.up,
    down: migration_20260717_004450_content_models.down,
    name: '20260717_004450_content_models'
  },
];
