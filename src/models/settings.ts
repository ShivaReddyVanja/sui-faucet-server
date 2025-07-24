import { Schema, model, Document, Types } from 'mongoose';

interface ISettings extends Document {
  amountToSend: number;
  rateLimitWindow: number;
  currentWallet: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
  amountToSend: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive'],
    default: 1000000000 // 1 SUI in mist
  },
  rateLimitWindow: {
    type: Number,
    required: true,
    min: [0, 'Rate limit window must be positive'],
    default: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  },
  currentWallet: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  }
}, {
  timestamps: true
});

settingsSchema.pre('save', async function(next) {
  try {
    const wallet = await model('Wallet').findById(this.currentWallet);
    if (!wallet) {
      throw new Error('Invalid wallet reference');
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

export const Settings = model<ISettings>('Settings', settingsSchema);