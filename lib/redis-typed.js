/**
 * Type-safe Redis wrapper for KINN Lab
 *
 * Same API as KINN's redis-typed.js, but all keys are automatically
 * prefixed with "lab:" to avoid collisions in the shared Upstash DB.
 */

import { Redis } from '@upstash/redis';
import logger from './logger.js';

const KEY_PREFIX = 'lab:';

// Initialize Redis client
const redis = new Redis({
  url: process.env.KINNST_KV_REST_API_URL,
  token: process.env.KINNST_KV_REST_API_TOKEN
});

/**
 * Prefix a key with "lab:" for namespace isolation
 */
function prefixKey(key) {
  if (key.startsWith(KEY_PREFIX)) return key;
  return `${KEY_PREFIX}${key}`;
}

/**
 * Convert Redis string values to proper JavaScript types
 */
function convertRedisValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value === 'true') return true;
  if (value === 'false') return false;

  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    const num = parseInt(value, 10);
    if (!isNaN(num)) return num;
  }

  if (typeof value === 'string' && /^-?\d+\.\d+$/.test(value)) {
    const num = parseFloat(value);
    if (!isNaN(num)) return num;
  }

  return value;
}

/**
 * Recursively convert all values in an object
 */
function convertRedisObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return convertRedisValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertRedisObject(item));
  }

  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    converted[key] = convertRedisObject(value);
  }
  return converted;
}

/**
 * Type-safe Redis wrapper class with lab: prefix
 */
export class TypedRedis {
  constructor() {
    this.redis = redis;
  }

  async get(key) {
    try {
      const value = await this.redis.get(prefixKey(key));
      return convertRedisValue(value);
    } catch (error) {
      logger.error('TypedRedis get error:', error);
      throw error;
    }
  }

  async hgetall(key) {
    try {
      const hash = await this.redis.hgetall(prefixKey(key));
      if (!hash) return null;
      return convertRedisObject(hash);
    } catch (error) {
      logger.error('TypedRedis hgetall error:', error);
      throw error;
    }
  }

  async hget(key, field) {
    try {
      const value = await this.redis.hget(prefixKey(key), field);
      return convertRedisValue(value);
    } catch (error) {
      logger.error('TypedRedis hget error:', error);
      throw error;
    }
  }

  async hset(key, data) {
    try {
      return await this.redis.hset(prefixKey(key), data);
    } catch (error) {
      logger.error('TypedRedis hset error:', error);
      throw error;
    }
  }

  async hdel(key, ...fields) {
    try {
      return await this.redis.hdel(prefixKey(key), ...fields);
    } catch (error) {
      logger.error('TypedRedis hdel error:', error);
      throw error;
    }
  }

  async smembers(key) {
    try {
      return await this.redis.smembers(prefixKey(key));
    } catch (error) {
      logger.error('TypedRedis smembers error:', error);
      throw error;
    }
  }

  async sadd(key, ...members) {
    try {
      return await this.redis.sadd(prefixKey(key), ...members);
    } catch (error) {
      logger.error('TypedRedis sadd error:', error);
      throw error;
    }
  }

  async srem(key, ...members) {
    try {
      return await this.redis.srem(prefixKey(key), ...members);
    } catch (error) {
      logger.error('TypedRedis srem error:', error);
      throw error;
    }
  }

  async sismember(key, member) {
    try {
      const result = await this.redis.sismember(prefixKey(key), member);
      return result === 1 || result === true;
    } catch (error) {
      logger.error('TypedRedis sismember error:', error);
      throw error;
    }
  }

  async mget(...keys) {
    try {
      const values = await this.redis.mget(...keys.map(prefixKey));
      return values.map(v => convertRedisValue(v));
    } catch (error) {
      logger.error('TypedRedis mget error:', error);
      throw error;
    }
  }

  async del(...keys) {
    try {
      return await this.redis.del(...keys.map(prefixKey));
    } catch (error) {
      logger.error('TypedRedis del error:', error);
      throw error;
    }
  }

  async exists(key) {
    try {
      const result = await this.redis.exists(prefixKey(key));
      return result === 1 || result === true;
    } catch (error) {
      logger.error('TypedRedis exists error:', error);
      throw error;
    }
  }

  async set(key, value, options) {
    try {
      return await this.redis.set(prefixKey(key), value, options);
    } catch (error) {
      logger.error('TypedRedis set error:', error);
      throw error;
    }
  }

  async expire(key, seconds) {
    try {
      return await this.redis.expire(prefixKey(key), seconds);
    } catch (error) {
      logger.error('TypedRedis expire error:', error);
      throw error;
    }
  }

  async keys(pattern) {
    try {
      return await this.redis.keys(prefixKey(pattern));
    } catch (error) {
      logger.error('TypedRedis keys error:', error);
      throw error;
    }
  }

  /**
   * Raw Redis accessor without lab: prefix.
   * For kinn:event:* keys that live outside the lab namespace.
   */
  raw() {
    const r = this.redis;
    return {
      get: (key) => r.get(key),
      set: (key, value, options) => r.set(key, value, options),
      hset: (key, data) => r.hset(key, data),
      hgetall: (key) => r.hgetall(key).then(h => h ? convertRedisObject(h) : null),
      hget: (key, field) => r.hget(key, field).then(v => convertRedisValue(v)),
      hdel: (key, ...fields) => r.hdel(key, ...fields),
      del: (...keys) => r.del(...keys),
      mget: (...keys) => r.mget(...keys),
      exists: (key) => r.exists(key),
      keys: (pattern) => r.keys(pattern),
      zadd: (key, ...args) => r.zadd(key, ...args),
      zrange: (key, min, max, opts) => r.zrange(key, min, max, opts),
      zrem: (key, ...members) => r.zrem(key, ...members),
      zcard: (key) => r.zcard(key),
    };
  }
}

// Export a singleton instance
export const kv = new TypedRedis();

// Also export the conversion functions for testing or direct use
export { convertRedisValue, convertRedisObject, prefixKey };

// Export default instance for backward compatibility
export default kv;
