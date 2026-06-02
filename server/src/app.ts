import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth'
import { createRateLimitMiddleware } from './middleware/rateLimit'
import healthRouter from './routes/health'
import accountRouter from './routes/account'
import profileRouter from './routes/profile'
import coverLettersRouter from './routes/coverLetters'
import exportRouter from './routes/export'
import answersRouter from './routes/answers'
import applicationsRouter from './routes/applications'
import skillsRouter from './routes/skills'
import locationsRouter from './routes/locations'
import trackerViewsRouter from './routes/trackerViews'

const app = express()
app.set('etag', false)
app.set('trust proxy', 1)

app.use(cors())
app.use(express.json())

const generalLimiter = createRateLimitMiddleware({
  keyPrefix: 'general',
  windowMs: 15 * 60 * 1000,
  limit: 200,
  message: 'Too many requests. Try again later.',
  keyGenerator: (req) => req.ip ?? 'unknown',
})

app.use('/api/health', healthRouter)
app.use(generalLimiter)
app.use(authMiddleware)
app.use('/api/account', accountRouter)
app.use('/api/profile', profileRouter)
app.use('/api/cover-letters', coverLettersRouter)
app.use('/api/export', exportRouter)
app.use('/api/answers', answersRouter)
app.use('/api/applications', applicationsRouter)
app.use('/api/skills', skillsRouter)
app.use('/api/locations', locationsRouter)
app.use('/api/tracker/views', trackerViewsRouter)

export default app
