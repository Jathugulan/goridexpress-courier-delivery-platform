import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import {
  WalletTransactionStatus,
  WalletTransactionType,
} from '../../common/enums';

export type WalletDocument = HydratedDocument<Wallet>;

/** Demo wallet. `balance` is a simulated figure, never real funds. */
@Schema({ collection: 'wallets', timestamps: true })
export class Wallet {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 0, min: 0 })
  balance: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true, immutable: true })
  isDemo: true;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;

/** Immutable ledger entry. `balanceAfter` allows statements without re-summing. */
@Schema({ collection: 'wallet_transactions', timestamps: { createdAt: true, updatedAt: false } })
export class WalletTransaction {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Wallet', required: true, index: true })
  walletId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(WalletTransactionType), index: true })
  type: WalletTransactionType;

  /** Positive credits, negative debits. */
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true })
  description: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Order', default: null })
  orderId?: Types.ObjectId | null;

  @Prop({ required: true, enum: Object.values(WalletTransactionStatus), default: WalletTransactionStatus.COMPLETED })
  status: WalletTransactionStatus;

  @Prop({ default: true, immutable: true })
  isDemo: true;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);

WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });
WalletTransactionSchema.index({ type: 1, createdAt: -1 });
