import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import jwtConstants from 'src/app/utils/jwt.constants';

@Injectable()
export class ChangePasswordGuard extends AuthGuard('jwt') {
  // Inject JwtService to manually verify JWT tokens
  constructor(private jwtService: JwtService) {
    super();
  }

  // Override canActivate to manually verify JWT tokens
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the JWT token from the request
    const request = context.switchToHttp().getRequest();

    // Extract the token from the request
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify the JWT using the application secret, This checks signature, expiration, and validity
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      // Check if this is a temporary token for password change
      if (!payload.passwordChangeRequired) {
        throw new UnauthorizedException('Invalid token for password change');
      }

      // Store both the token and userId in request.user
      request.user = {
        userId: payload.userId,
        role: payload.role,
        // Pass the actual token string
        tempToken: token,
        passwordChangeRequired: payload.passwordChangeRequired,
      };
      return true;
    } catch (error) {
      console.error('ChangePasswordGuard error:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // Helper function to extract JWT from Authorization header
  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
