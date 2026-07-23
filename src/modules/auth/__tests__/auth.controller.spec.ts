import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRole } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockTokens = {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    expiresIn: 900,
  };

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      authService.register.mockResolvedValue({
        tokens: mockTokens,
        user: mockUser,
      });

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual({
        tokens: mockTokens,
        user: mockUser,
      });
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.login.mockResolvedValue({
        tokens: mockTokens,
        user: mockUser,
      });

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({
        tokens: mockTokens,
        user: mockUser,
      });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const refreshDto = {
        refreshToken: 'refresh_token',
      };

      authService.refreshToken.mockResolvedValue({
        tokens: mockTokens,
        user: mockUser,
      });

      const result = await controller.refresh(refreshDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshDto.refreshToken);
      expect(result).toEqual({
        tokens: mockTokens,
        user: mockUser,
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const user = { id: 'user_id', email: 'test@example.com' };

      await expect(controller.logout(user)).resolves.toBeUndefined();
    });
  });
});
