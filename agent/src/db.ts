import { sqlite } from '@flue/runtime/node';

// Persist Flue conversations in a local SQLite file so they survive a process restart.
// See agent/README.md for the current storage layout.
export default sqlite('./data/flue.db');
