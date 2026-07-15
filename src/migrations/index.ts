import * as migration_20260715_220439_initial from './20260715_220439_initial';

export const migrations = [
  {
    up: migration_20260715_220439_initial.up,
    down: migration_20260715_220439_initial.down,
    name: '20260715_220439_initial'
  },
];
