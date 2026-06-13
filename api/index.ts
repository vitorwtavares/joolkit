import { initSupabase } from '../server/dist/middleware/auth'
import app from '../server/dist/app'

initSupabase()

export default app
