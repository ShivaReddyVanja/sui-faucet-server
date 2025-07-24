import { Schema, model, Document } from 'mongoose';

interface ITransaction extends Document {
  walletAddress: string;
  ipAddress: string;
  txHash: string;
  amount: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  status: 'success' | 'failed';
}

const transactionSchema = new Schema<ITransaction>({
  walletAddress: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid Sui wallet address']
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true,
  },
  txHash: {
    type: String,
    required: true,
    unique: true, // This creates a unique index automatically
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  }
}, {
  timestamps: true
});

// Keep only the composite index
transactionSchema.index({ walletAddress: 1, timestamp: -1 });

export const Transaction = model<ITransaction>('Transaction', transactionSchema);