import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3001',
    'http://localhost:5173',
  ];

  use(req: Request, res: Response, next: NextFunction): void {
    const origin = req.headers.origin;
    
    if (origin && this.isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    if (req.method === 'OPTIONS') {
      res.status(HttpStatus.NO_CONTENT).send();
      return;
    }

    next();
  }

  private isOriginAllowed(origin: string): boolean {
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    return this.ALLOWED_ORIGINS.some(allowed => {
      if (allowed === origin) return true;
      if (allowed.startsWith('https://') && allowed.includes('.')) {
        try {
          const allowedHost = new URL(allowed).hostname;
          const requestHost = new URL(origin).hostname;
          return requestHost.endsWith(allowedHost);
        } catch {
          return false;
        }
      }
      return false;
    });
  }
}

@Injectable()
export class InputSanitizationMiddleware implements NestMiddleware {
  private readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
    /data\s*:/gi,
  ];

  use(req: Request, res: Response, next: NextFunction): void {
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizeObject(req.query) as any;
    }

    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key of Object.keys(obj)) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    let sanitized = str;

    for (const pattern of this.DANGEROUS_PATTERNS) {
      sanitized = sanitized.replace(pattern, '');
    }

    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    return sanitized.trim();
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId = crypto.randomUUID();
    
    res.setHeader('X-Request-Id', requestId);
    (req as any).requestId = requestId;

    next();
  }
}
