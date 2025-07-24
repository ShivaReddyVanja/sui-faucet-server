import express, { Request, Response, NextFunction } from 'express';
import { Wallet } from '../models/wallets';
import logger from '../logger';
import { Settings } from '../models/settings';

const router = express.Router();

// Middleware to validate request body and admin access (placeholder)
const validateWallet = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Add authentication (e.g., admin token check)
  next();
};

// Create a new wallet
router.post('/wallets', validateWallet, async (req: Request, res: Response) => {
  try {
    const { privateKey, publicAddress, addedBy, isActive } = req.body;

    if (!privateKey || !publicAddress || !addedBy) {
      return res.status(400).json({ error: 'privateKey, publicAddress, and addedBy are required' });
    }

    // Validate private key format (Sui expects 66 chars starting with 0x)
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      return res.status(400).json({ error: 'Invalid private key format' });
    }

    // Validate public address format (Sui addresses are 66 chars starting with 0x)
    if (!publicAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
      return res.status(400).json({ error: 'Invalid public address format' });
    }

    // Check if wallet already exists
    const existingWallet = await Wallet.findOne({ publicAddress });
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet with this public address already exists' });
    }

    const wallet = await Wallet.create({
      privateKey,
      publicAddress,
      addedBy,
      isActive: isActive !== undefined ? isActive : true,
    });

    logger.info(`New wallet created: ${wallet.publicAddress}`);
    res.status(201).json({ message: 'Wallet created successfully', wallet });
  } catch (error: any) {
    logger.error(`Error creating wallet: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all wallets
router.get('/wallets', validateWallet, async (req: Request, res: Response) => {
  try {
    const wallets = await Wallet.find().select('-privateKey'); // Exclude privateKey for security
    res.status(200).json({ wallets });
  } catch (error: any) {
    logger.error(`Error retrieving wallets: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a wallet (e.g., toggle isActive)
router.put('/wallets/:id', validateWallet, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ error: 'isActive is required for update' });
    }

    const wallet = await Wallet.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    logger.info(`Wallet updated: ${wallet.publicAddress}`);
    res.status(200).json({ message: 'Wallet updated successfully', wallet });
  } catch (error: any) {
    logger.error(`Error updating wallet: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// // Delete a wallet
// router.delete('/wallets/:id', validateWallet, async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const wallet = await Wallet.findById(id);

//     if (!wallet) {
//       return res.status(404).json({ error: 'Wallet not found' });
//     }

//     const settings = await Settings.findOne();
//     if (settings && settings.currentWallet?.toString() === id) {
//       // Find another active wallet to replace the current one
//       const newWallet = await Wallet.findOne({ isActive: true, _id: { $ne: id } });
//       if (newWallet && newWallet._id) {
//         settings.currentWallet = newWallet;
//       } else {
//         return res.status(400).json({ error: 'Cannot delete wallet: No other active wallet available to replace currentWallet' });
//       }
//       await settings.save();
//       logger.info('Updated Settings with new currentWallet due to wallet deletion');
//     }

//     await Wallet.findByIdAndDelete(id);
//     logger.info(`Wallet deleted: ${wallet.publicAddress}`);
//     res.status(200).json({ message: 'Wallet deleted successfully' });
//   } catch (error: any) {
//     logger.error(`Error deleting wallet: ${error.message}`);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

export default router;