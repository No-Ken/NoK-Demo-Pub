import { RateLimiter } from 'limiter';

/**
 * Create a token bucket rate limiter
 * @param options Options for the rate limiter
 * @returns Rate limiter instance
 */
export function createRateLimiter(options: {
  tokensPerInterval: number;
  interval: number;
  fireImmediately?: boolean;
}): RateLimiter {
  return new RateLimiter({
    tokensPerInterval: options.tokensPerInterval,
    interval: options.interval,
    fireImmediately: options.fireImmediately !== undefined 
      ? options.fireImmediately 
      : true
  });
}

/**
 * Wrapper function that applies rate limiting to any async function
 * @param fn The function to rate limit
 * @param limiter The rate limiter to use
 * @param tokens Number of tokens to consume (default: 1)
 * @returns Rate limited function
 */
export function rateLimitedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  limiter: RateLimiter,
  tokens: number = 1
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Wait for tokens to be available
    await limiter.removeTokens(tokens);
    
    // Execute the function
    return await fn(...args);
  };
}

/**
 * Create a distributed rate limiter using Firestore
 * @param collectionPath Firestore collection path
 * @param limit Rate limit value
 * @param windowSeconds Time window in seconds
 * @returns Rate limiting function
 */
export function createDistributedRateLimiter(
  collectionPath: string,
  limit: number,
  windowSeconds: number
): (key: string) => Promise<boolean> {
  return async (key: string): Promise<boolean> => {
    // Import Firebase Admin here to avoid circular dependencies
    const { db, runTransaction } = await import('../adapters/firestore');
    
    // Current time
    const now = Date.now();
    
    // Window start time
    const windowStart = now - windowSeconds * 1000;
    
    // Document reference
    const docRef = db.collection(collectionPath).doc(key);
    
    // Run in a transaction to ensure atomicity
    return runTransaction(async (transaction) => {
      // Get the document
      const doc = await transaction.get(docRef);
      const data = doc.exists ? doc.data() : { timestamps: [] };
      
      // Filter out old timestamps
      const timestamps = (data?.timestamps || []).filter(
        (timestamp: number) => timestamp > windowStart
      );
      
      // Check if we're over the limit
      if (timestamps.length >= limit) {
        return false;
      }
      
      // Add the new timestamp
      timestamps.push(now);
      
      // Update the document
      transaction.set(docRef, { timestamps });
      
      return true;
    });
  };
}
