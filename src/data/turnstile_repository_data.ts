import "server-only";
import {readTurnstileDeployment, readTurnstileSecretKey} from "@/config/contact_server_env";
import {ContactServiceUnconfiguredError} from "@/domain/contact_message";
import {verifyTurnstileToken} from "@/data/turnstile_siteverify";

export default class TurnstileRepositoryData {
  async verifyToken(token: string, remoteIp: string | null): Promise<boolean> {
    const secret = readTurnstileSecretKey();
    if (secret === null) {
      throw new ContactServiceUnconfiguredError();
    }
    return verifyTurnstileToken({
      secret,
      token,
      remoteIp,
      deployment: readTurnstileDeployment(),
    });
  }
}
