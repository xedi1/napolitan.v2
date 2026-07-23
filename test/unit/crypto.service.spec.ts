import { CryptoService } from '../../src/modules/integrations/services/crypto.service';

describe('CryptoService', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    cryptoService = new CryptoService();
  });

  describe('generateApiKey', () => {
    it('should generate a valid API key with correct prefix', () => {
      const result = cryptoService.generateApiKey();

      expect(result.fullKey).toMatch(/^nk_/);
      expect(result.prefix).toMatch(/^nk_/);
      expect(result.hashed).toBeDefined();
      expect(result.hashed).toHaveLength(64); // SHA-256 hex length
    });

    it('should generate unique keys each time', () => {
      const result1 = cryptoService.generateApiKey();
      const result2 = cryptoService.generateApiKey();

      expect(result1.fullKey).not.toBe(result2.fullKey);
      expect(result1.hashed).not.toBe(result2.hashed);
    });

    it('should generate key with correct prefix length', () => {
      const result = cryptoService.generateApiKey();

      expect(result.prefix).toHaveLength(12);
    });
  });

  describe('generateWebhookSecret', () => {
    it('should generate a valid webhook secret with correct prefix', () => {
      const result = cryptoService.generateWebhookSecret();

      expect(result.secret).toMatch(/^whsec_/);
      expect(result.hashed).toBeDefined();
      expect(result.hashed).toHaveLength(64);
    });

    it('should generate unique secrets each time', () => {
      const result1 = cryptoService.generateWebhookSecret();
      const result2 = cryptoService.generateWebhookSecret();

      expect(result1.secret).not.toBe(result2.secret);
      expect(result1.hashed).not.toBe(result2.hashed);
    });
  });

  describe('hashKey', () => {
    it('should generate consistent hash for same input', () => {
      const key = 'test-key-123';
      const hash1 = cryptoService.hashKey(key);
      const hash2 = cryptoService.hashKey(key);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = cryptoService.hashKey('key-1');
      const hash2 = cryptoService.hashKey('key-2');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate SHA-256 length hash', () => {
      const hash = cryptoService.hashKey('any-key');

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/); // hex format
    });
  });

  describe('verifyKey', () => {
    it('should verify correct key', () => {
      const key = 'test-key-123';
      const hashed = cryptoService.hashKey(key);

      expect(cryptoService.verifyKey(key, hashed)).toBe(true);
    });

    it('should reject incorrect key', () => {
      const key = 'test-key-123';
      const hashed = cryptoService.hashKey(key);

      expect(cryptoService.verifyKey('wrong-key', hashed)).toBe(false);
    });

    it('should reject empty key', () => {
      const hashed = cryptoService.hashKey('test-key');

      expect(cryptoService.verifyKey('', hashed)).toBe(false);
    });
  });

  describe('generateWebhookSignature', () => {
    it('should generate signature with timestamp', () => {
      const payload = '{"event":"order.created"}';
      const secret = 'test-secret';
      const timestamp = 1700000000;

      const signature = cryptoService.generateWebhookSignature(payload, secret, timestamp);

      expect(signature).toBeDefined();
      expect(signature).toHaveLength(64);
    });

    it('should generate consistent signature for same inputs', () => {
      const payload = '{"event":"test"}';
      const secret = 'secret';
      const timestamp = 1700000000;

      const sig1 = cryptoService.generateWebhookSignature(payload, secret, timestamp);
      const sig2 = cryptoService.generateWebhookSignature(payload, secret, timestamp);

      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different timestamps', () => {
      const payload = '{"event":"test"}';
      const secret = 'secret';

      const sig1 = cryptoService.generateWebhookSignature(payload, secret, 1700000000);
      const sig2 = cryptoService.generateWebhookSignature(payload, secret, 1700000001);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature within tolerance', () => {
      const payload = '{"event":"test"}';
      const secret = 'whsec_testsecret';
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = cryptoService.generateWebhookSignature(payload, secret, timestamp);

      expect(cryptoService.verifyWebhookSignature(payload, signature, secret, timestamp)).toBe(true);
    });

    it('should reject expired timestamp', () => {
      const payload = '{"event":"test"}';
      const secret = 'whsec_testsecret';
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago

      const signature = cryptoService.generateWebhookSignature(payload, secret, oldTimestamp);

      expect(cryptoService.verifyWebhookSignature(payload, signature, secret, oldTimestamp, 300)).toBe(false);
    });

    it('should reject invalid signature', () => {
      const payload = '{"event":"test"}';
      const secret = 'whsec_testsecret';
      const timestamp = Math.floor(Date.now() / 1000);

      expect(cryptoService.verifyWebhookSignature(payload, 'invalid-signature', secret, timestamp)).toBe(false);
    });
  });

  describe('parseSignatureHeader', () => {
    it('should parse valid signature header', () => {
      const header = 't=1700000000,v1=abc123signature';
      const result = cryptoService.parseSignatureHeader(header);

      expect(result).toBeDefined();
      expect(result?.timestamp).toBe(1700000000);
      expect(result?.signature).toBe('abc123signature');
    });

    it('should return null for invalid header', () => {
      expect(cryptoService.parseSignatureHeader('invalid')).toBeNull();
    });

    it('should return null for missing timestamp', () => {
      expect(cryptoService.parseSignatureHeader('v1=abc123')).toBeNull();
    });

    it('should return null for missing signature', () => {
      expect(cryptoService.parseSignatureHeader('t=1700000000')).toBeNull();
    });
  });

  describe('buildSignatureHeader', () => {
    it('should build valid signature header', () => {
      const payload = '{"event":"test"}';
      const secret = 'whsec_testsecret';

      const header = cryptoService.buildSignatureHeader(payload, secret);

      expect(header).toMatch(/^t=\d+,v1=[a-f0-9]+$/);
    });

    it('should include current timestamp', () => {
      const payload = '{"event":"test"}';
      const secret = 'whsec_testsecret';

      const header = cryptoService.buildSignatureHeader(payload, secret);
      const parsed = cryptoService.parseSignatureHeader(header);
      const now = Math.floor(Date.now() / 1000);

      expect(parsed?.timestamp).toBeGreaterThanOrEqual(now - 1);
      expect(parsed?.timestamp).toBeLessThanOrEqual(now + 1);
    });
  });
});
