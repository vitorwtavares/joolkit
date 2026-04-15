import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth'
import healthRouter from './routes/health'
import profileRouter from './routes/profile'
import coverLettersRouter from './routes/coverLetters'
import exportRouter from './routes/export'

const app = express()
app.set('etag', false)

app.use(cors())
app.use(express.json())
app.use(authMiddleware)

app.use('/api/health', healthRouter)
app.use('/api/profile', profileRouter)
app.use('/api/cover-letters', coverLettersRouter)
app.use('/api/export', exportRouter)

export default app
