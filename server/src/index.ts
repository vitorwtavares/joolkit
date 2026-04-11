import 'dotenv/config'
import { initSupabase } from './middleware/auth'
import app from './app'

initSupabase()

const PORT = Number.parseInt(process.env.PORT || '3001', 10)
if (Number.isNaN(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT ?? '(unset)'}`)
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  server.close(() => process.exit(0))
})
