import { Router } from 'express'
import { uploader } from '@/utils/upload'
import { uploadHandler } from '@/controllers/upload.controller'

const router = Router()

// POST /api/upload/image
router.post('/image', uploader.single('certifyImages'), uploadHandler)

export default router
