import crypto from "crypto";
import { HMAC_SECRET } from "../config";

export function generateHmac(
  fileId: string,
  key: string,
  passcode: string
): string {
  const payload = `${fileId}:${key}:${passcode}`;
  return crypto
    .createHmac("sha256", HMAC_SECRET!)
    .update(payload)
    .digest("hex");
}
