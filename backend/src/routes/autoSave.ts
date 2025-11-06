import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { DatabaseService } from '../config/database';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

// Save form data for a specific page
router.post('/save', [
  isAuthenticated,
  body('pagePath').trim().notEmpty().withMessage('Page path is required'),
  body('formData').isObject().withMessage('Form data must be an object'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const user = req.user as any;
  const { pagePath, formData } = req.body;

  try {
    // Upsert auto-save data
    await DatabaseService.query(
      `INSERT INTO auto_saves (user_id, page_path, form_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, page_path)
       DO UPDATE SET form_data = $3, updated_at = CURRENT_TIMESTAMP`,
      [user.id, pagePath, JSON.stringify(formData)]
    );

    return res.json({
      success: true,
      message: 'Data saved successfully',
    });
  } catch (error) {
    console.error('Auto-save error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save data',
    });
  }
});

// Get saved form data for a specific page
router.get('/load/:pagePath', isAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as any;
  const { pagePath } = req.params;

  try {
    const result = await DatabaseService.query(
      `SELECT form_data, updated_at FROM auto_saves
       WHERE user_id = $1 AND page_path = $2`,
      [user.id, pagePath]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
      });
    }

    return res.json({
      success: true,
      data: {
        formData: result.rows[0].form_data,
        savedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error('Auto-load error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load saved data',
    });
  }
});

// Delete saved form data for a specific page
router.delete('/delete/:pagePath', isAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as any;
  const { pagePath } = req.params;

  try {
    await DatabaseService.query(
      `DELETE FROM auto_saves WHERE user_id = $1 AND page_path = $2`,
      [user.id, pagePath]
    );

    return res.json({
      success: true,
      message: 'Saved data deleted',
    });
  } catch (error) {
    console.error('Auto-save delete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete saved data',
    });
  }
});

// Get all saved pages for current user
router.get('/list', isAuthenticated, async (req: Request, res: Response) => {
  const user = req.user as any;

  try {
    const result = await DatabaseService.query(
      `SELECT page_path, updated_at FROM auto_saves
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [user.id]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Auto-save list error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list saved data',
    });
  }
});

export default router;
