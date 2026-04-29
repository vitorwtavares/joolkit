import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth'
import healthRouter from './routes/health'
import profileRouter from './routes/profile'
import coverLettersRouter from './routes/coverLetters'
import exportRouter from './routes/export'
import answersRouter from './routes/answers'
import applicationsRouter from './routes/applications'
import skillsRouter from './routes/skills'
import locationsRouter from './routes/locations'
import trackerSettingsRouter from './routes/trackerSettings'

const app = express()
app.set('etag', false)

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)

app.use(authMiddleware)
app.use('/api/profile', profileRouter)
app.use('/api/cover-letters', coverLettersRouter)
app.use('/api/export', exportRouter)
app.use('/api/answers', answersRouter)
app.use('/api/applications', applicationsRouter)
app.use('/api/skills', skillsRouter)
app.use('/api/locations', locationsRouter)
app.use('/api/tracker/settings', trackerSettingsRouter)

export default app
