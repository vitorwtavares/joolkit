/// <reference types="node" />
/// <reference types="express" />
import { initSupabase } from '../server/src/middleware/auth'
import app from '../server/src/app'

initSupabase()

export default app
