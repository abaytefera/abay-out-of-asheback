import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { AuthRepository } from "./auth.repository";
import { AppError } from "../../utils/AppError";
import { signAccessToken, signRefreshToken, verifyToken } from "../../utils/jwt";
import { LoginDto, RegisterDto, Verify2FADto } from "./auth.dto";

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async register(dto: RegisterDto) {
    const existing = await this.repository.findUniqueByEmail(dto.email);
    if (existing) throw new AppError("Email already registered", 409);

    const passwordHash = await bcrypt.hash(dto.password, 12);
    
    return this.repository.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash,
      role: dto.role,
      phone: dto.phone,
      jobTitle: dto.jobTitle,
      department: dto.department,
      // 🟢 Automatically apply the default avatar profile picture metadata here
      avatarUrl: "/uploads/DeafultProfile/undraw_young-man-avatar_wgbd_1_mmwgvi.svg",
      avatarPublicId: "undraw_young-man-avatar_wgbd_1_mmwgvi.svg" 
    });
  } // 🔄 Removed the trailing brace that was prematurely killing the class block here!

  async login(dto: LoginDto) {
    const user = await this.repository.findUniqueByEmail(dto.email);
    if (!user || !user.isActive) throw new AppError("Invalid credentials", 401);

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new AppError("Invalid credentials", 401);

    if (user.twoFactorEnabled) {
      return { requiresTwoFactor: true, userId: user.id };
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    return {
      requiresTwoFactor: false,
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl // Included to ensure immediate frontend caching if needed
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyToken(refreshToken);
    } catch {
      throw new AppError("Invalid refresh token", 401);
    }
    const user = await this.repository.findUniqueById(payload.id);
    if (!user || !user.isActive) throw new AppError("User not found", 401);

    const newPayload = { id: user.id, email: user.email, role: user.role };
    return { accessToken: signAccessToken(newPayload) };
  }

  async setup2FA(userId: string) {
    const secret = authenticator.generateSecret();
    await this.repository.updateUserSettings(userId, { twoFactorSecret: secret });
    
    const user = await this.repository.findUniqueByIdOrThrow(userId);
    const otpAuthUrl = authenticator.keyuri(user.email, "ChildMgmtSystem", secret);
    return { secret, otpAuthUrl };
  }

  async verify2FA(userId: string, token: string) {
    console.log("int ia");
    console.log(userId);
    const user = await this.repository.findUniqueByIdOrThrow(userId);
    if (!user.twoFactorSecret) throw new AppError("2FA not set up", 400);

    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!isValid) throw new AppError("Invalid OTP code", 401);
   

    if (!user.twoFactorEnabled) {
      await this.repository.updateUserSettings(userId, { twoFactorEnabled: true });
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user.id, firstName: user.firstName, email: user.email, role: user.role },
    };
  }

  // 💡 NEW: Added core verification logic to handle frontend 2FA teardowns safely
  async disable2FA(userId: string, token: string) {
    const user = await this.repository.findUniqueByIdOrThrow(userId);
    if (!user.twoFactorSecret || !user.twoFactorEnabled) {
      throw new AppError("2FA is not currently active on this account", 400);
    }

    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!isValid) throw new AppError("Invalid OTP code verification failed", 401);

    await this.repository.updateUserSettings(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return { success: true, message: "Two-factor authentication disabled" };
  }

  async me(userId: string) {
    return this.repository.selectMeProfile(userId);
  }
}