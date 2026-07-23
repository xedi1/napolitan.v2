import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CryptoService } from './crypto.service';
import { ApiKeyPermission } from '@prisma/client';

export interface CreateApiKeyParams {
  name: string;
  permissions?: ApiKeyPermission;
  expiresAt?: Date;
  createdById?: string;
}

export interface ApiKeyResult {
  apiKey: {
    id: string;
    name: string;
    keyPrefix: string;
    permissions: ApiKeyPermission;
    isActive: boolean;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  };
  fullKey: string;
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async create(params: CreateApiKeyParams): Promise<ApiKeyResult> {
    const { fullKey, prefix, hashed } = this.cryptoService.generateApiKey();

    const apiKey = await this.prisma.apiKey.create({
      data: {
        name: params.name,
        key: hashed,
        keyPrefix: prefix,
        permissions: params.permissions || ApiKeyPermission.READ,
        expiresAt: params.expiresAt,
        createdById: params.createdById,
      },
    });

    this.logger.log(`Created API key: ${apiKey.id} - ${apiKey.name}`);

    return {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      fullKey,
    };
  }

  async findById(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
      include: { webhooks: true },
    });

    if (!apiKey) {
      throw new NotFoundException(`API Key not found: ${id}`);
    }

    return apiKey;
  }

  async findAll() {
    return this.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        webhooks: {
          select: { id: true },
        },
      },
    });
  }

  async revoke(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({ where: { id } });

    if (!apiKey) {
      throw new NotFoundException(`API Key not found: ${id}`);
    }

    // Deactivate instead of hard delete
    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Revoked API key: ${id}`);
  }

  async validateKey(key: string): Promise<{ valid: boolean; apiKey?: any }> {
    // Find by prefix first
    const prefix = key.substring(0, 12);
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { keyPrefix: prefix },
    });

    if (!apiKey) {
      return { valid: false };
    }

    if (!apiKey.isActive) {
      return { valid: false };
    }

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return { valid: false };
    }

    // Verify the key
    const isValid = this.cryptoService.verifyKey(key, apiKey.key);
    if (!isValid) {
      return { valid: false };
    }

    // Update last used
    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return { valid: true, apiKey };
  }

  async updateLastUsed(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}
