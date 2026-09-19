import { SignJWT, jwtVerify } from "jose";
import "dotenv/config";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

type Payload = {
  userId: number;
  email: string;
  userName: string;
  name: string;
  role: string;
};
export const generateToken = async (payload: Payload) => {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);
};

export const verifyToken = async (token: string) => {
  return await jwtVerify(token, secret);
};
