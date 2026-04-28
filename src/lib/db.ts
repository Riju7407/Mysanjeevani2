import mongoose from 'mongoose';

// Import all models to ensure they are registered
import { User } from './models/User';
import { Order } from './models/Order';
import { Product } from './models/Product';
import { Vendor } from './models/Vendor';
import { LabTestBooking } from './models/LabTestBooking';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((m) => {
        console.log('✅ MongoDB Connected');
        return m;
      })
      .catch((error) => {
        console.error('❌ MongoDB Connection Error:', error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error('DB Connection Failed:', e.message);
    throw new Error(`Failed to connect to MongoDB: ${e.message}`);
  }

  return cached.conn;
}
