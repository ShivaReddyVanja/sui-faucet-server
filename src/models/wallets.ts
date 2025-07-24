import { Schema, model, Document, Types } from 'mongoose';

interface IWallet extends Document {
  privateKey: string;
  publicAddress: string;
  isActive: boolean;
  addedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>({
  privateKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    select: false
  },
  publicAddress: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^0x[a-fA-F0-9]{64}$/, 'Invalid Sui wallet address']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

walletSchema.pre('save', function(next) {
  if (!this.privateKey.startsWith('0x') || this.privateKey.length !== 66) {
    return next(new Error('Invalid private key format'));
  }
  next();
});

walletSchema.index({ publicAddress: 1 });

export const Wallet = model<IWallet>('Wallet', walletSchema);