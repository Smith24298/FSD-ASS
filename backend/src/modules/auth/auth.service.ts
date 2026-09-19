import { userRepository } from "../user/user.repository";
import argon2 from "argon2";
import { generateToken } from "../../infrastructure/auth/jwt";
import { RegisterBody, LoginBody } from "./auth.schema";
import { SafeUser, RegisterResponse, LoginResponse } from "./auth.types";

export class AuthService {
  async register(data: RegisterBody): Promise<RegisterResponse> {
    const { role, user, profile } = data;
    const { password, ...userData } = user;
    const organization = await userRepository.findDefaultOrganization();
    if (!organization) throw new Error("DEFAULT_ORGANIZATION_NOT_FOUND");

    const passwordHash = await argon2.hash(password);

    const result = await userRepository.createWithProfile(
      {
        ...userData,
        passwordHash,
        role,
        organizationId: organization.id,
      },
      profile,
    );

    const { passwordHash: _, ...safeUser } = result.user;
    return {
      user: safeUser,
      profile: result.profile,
    };
  }

  async login(data: LoginBody): Promise<LoginResponse> {
    const { email, password } = data;

    const user = await userRepository.findByEmailWithPassword(email);

    if (!user || !user.isActive || !user.organization?.isActive) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const isValid = await argon2.verify(user.passwordHash, password);

    if (!isValid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const payload = {
      userId: user.id,
      email: user.email,
      userName: user.userName,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
    };

    const token = await generateToken(payload);

    const { passwordHash: _, ...safeUser } = user;

    return {
      token,
      email: user.email,
      user: safeUser,
    };
  }
}

export const authService = new AuthService();
