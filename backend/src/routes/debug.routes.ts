import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'

const router = Router()

router.get('/schema', async (req: Request, res: Response) => {
  try {
    // Try to select the new column from a random row
    const { data, error } = await supabaseAdmin
      .from('saved_contents')
      .select('carousel_media')
      .limit(1)

    if (error) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Column likely missing or DB error', 
        details: error 
      })
    }

    res.json({ 
      status: 'success', 
      message: 'Column carousel_media exists!',
      data 
    })
  } catch (error) {
    res.status(500).json({ error })
  }
})

export default router
