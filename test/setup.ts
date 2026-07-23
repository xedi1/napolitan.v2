// Jest setup file
import { EventEmitter } from 'events';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/napolitan_test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock Redis
jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  BullModule: {
    registerQueue: () => () => ({}),
    forRoot: () => ({}),
  },
}));

// Silence logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
