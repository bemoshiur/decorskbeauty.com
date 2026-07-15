// Load env for integration tests. .env.local (real secrets, gitignored) takes precedence.
import { config } from 'dotenv'

config({ path: ['.env.local', '.env'] })
