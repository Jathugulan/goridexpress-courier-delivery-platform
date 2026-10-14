import 'mongoose';

/**
 * Mongoose adds `createdAt` / `updatedAt` at runtime for schemas declared with
 * `timestamps: true`, but the generated TypeScript types do not know about them.
 *
 * Every schema in this application uses `timestamps`, so augmenting the base
 * `Document` interface is the accurate, single-place fix — far better than
 * sprinkling `as unknown as { createdAt: Date }` casts through the services.
 */
declare module 'mongoose' {
  interface Document {
    createdAt?: Date;
    updatedAt?: Date;
  }
}

export {};
