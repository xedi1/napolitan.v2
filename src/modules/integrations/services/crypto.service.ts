import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly ALGORITHM = 'sha256';
  private readonly KEY_LENGTH = 32;

  /**
   * Generate a random API key
   */
  generateApiKey(): { fullKey: string; prefix: string; hashed: string } {
    const buffer = crypto.randomBytes(this.KEY_LENGTH);
    const fullKey = `nk_${buffer.toString('base64url')}`;
    const prefix = fullKey.substring(0, 12); // nk_ + 4 chars
    const hashed = this.hashKey(fullKey);

    return { fullKey, prefix, hashed };
  }

  /**
   * Generate a random webhook secret
   */
  generateWebhookSecret(): { secret: string; hashed: string } {
    const buffer = crypto.randomBytes(32);
    const secret = `whsec_${buffer.toString('base64url')}`;
    const hashed = this.hashKey(secret);

    return { secret, hashed };
  }

  /**
   * Hash a key using SHA-256
   */
  hashKey(key: string): string {
    return crypto.createHash(this.ALGORITHM).update(key).digest('hex');
  }

  /**
   * Verify a key against its hash
   */
  verifyKey(key: string, hashed: string): boolean {
    const keyHash = this.hashKey(key);
    return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(hashed));
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  generateWebhookSignature(payload: string, secret: string, timestamp: number): string {
    const signaturePayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac(this.ALGORITHM, secret)
      .update(signaturePayload)
      .digest('hex');

    return signature;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp: number,
    toleranceSeconds = 300,
  ): boolean {
    // Check timestamp is within tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false;
    }

    // Compute expected signature
    const expectedSignature = this.generateWebhookSignature(payload, secret, timestamp);

    // Constant-time comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  /**
   * Parse webhook signature header
   * Format: t=timestamp,v1=signature
   */
  parseSignatureHeader(header: string): { timestamp: number; signature: string } | null {
    const parts = header.split(',');
    let timestamp: number | null = null;
    let signature: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signature = value;
      }
    }

    if (timestamp === null || signature === null) {
      return null;
    }

    return { timestamp, signature };
  }

  /**
   * Build webhook signature header
   */
  buildSignatureHeader(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateWebhookSignature(payload, secret, timestamp);
    return `t=${timestamp},v1=${signature}`;
  }
}
