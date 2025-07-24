import mongoose from 'mongoose';
import logger from './logger';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sui-faucet';

async function initializeMongoDB(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('Connected to MongoDB');
  } catch (error: any) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1); // Exit process on failure
  }
}

// Export the initialization function
export { initializeMongoDB };