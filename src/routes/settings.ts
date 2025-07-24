import express, { NextFunction, Request, Response } from 'express';
import { Settings } from '../models/settings';
import { Wallet } from '../models/wallets';
import logger from '../logger';

const router = express.Router();

// Middleware to validate request body (placeholder for authentication)
const validateSettings = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Add authentication (e.g., admin token check)
  next();
};

// Create or update settings
router.post('/settings', validateSettings, async (req: Request, res: Response) => {
  try {
    const { amountToSend, rateLimitWindow, currentWallet } = req.body;

    if (!amountToSend || !rateLimitWindow || !currentWallet) {
      return res.status(400).json({ error: 'amountToSend, rateLimitWindow, and currentWallet are required' });
    }

    // Validate amountToSend and rateLimitWindow
    if (amountToSend < 0) {
      return res.status(400).json({ error: 'amountToSend must be non-negative' });
    }
    if (rateLimitWindow <= 0) {
      return res.status(400).json({ error: 'rateLimitWindow must be positive' });
    }

    // Validate currentWallet exists
    const wallet = await Wallet.findById(currentWallet);
    if (!wallet) {
      return res.status(400).json({ error: 'Invalid currentWallet ID' });
    }

    // Upsert (update or insert) settings
    const settings = await Settings.findOneAndUpdate(
      {},
      { amountToSend, rateLimitWindow, currentWallet: wallet._id },
      { upsert: true, new: true, runValidators: true }
    );

    logger.info(`Settings updated: ${JSON.stringify(settings)}`);
    res.status(200).json({ message: 'Settings saved successfully', settings });
  } catch (error: any) {
    logger.error(`Error saving settings: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current settings
router.get('/settings', validateSettings, async (req: Request, res: Response) => {
  try {
    const settings = await Settings.findOne().populate('currentWallet');
    if (!settings) {
      return res.status(404).json({ error: 'No settings found' });
    }
    res.status(200).json({ settings });
  } catch (error: any) {
    logger.error(`Error retrieving settings: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete settings (reset to default or remove)
router.delete('/settings', validateSettings, async (req: Request, res: Response) => {
  try {
    const result = await Settings.deleteOne({});
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'No settings found to delete' });
    }
    logger.info('Settings deleted');
    res.status(200).json({ message: 'Settings deleted successfully' });
  } catch (error: any) {
    logger.error(`Error deleting settings: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;