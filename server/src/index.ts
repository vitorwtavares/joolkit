import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initSupabase } from './middleware/auth'
import healthRouter from './routes/health'

initSupabase()

const app = express()
const PORT = Number.parseInt(process.env.PORT || '3001', 10)
if (Number.isNaN(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT ?? '(unset)'}`)
}

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  server.close(() => process.exit(0))
})
