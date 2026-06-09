import { Router } from 'express'
import tokensRouter from './tokens'
import templatesRouter from './templates'

const router = Router()

router.use('/tokens', tokensRouter)
router.use('/', templatesRouter)

export default router
