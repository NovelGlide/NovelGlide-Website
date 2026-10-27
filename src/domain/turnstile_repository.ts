import TurnstileRepositoryData from "@/data/turnstile_repository_data";

// Static facade over Cloudflare Turnstile's server-side token check.
export default class TurnstileRepository {
  private static data = new TurnstileRepositoryData();

  static verifyToken(token: string, remoteIp: string | null): Promise<boolean> {
    return this.data.verifyToken(token, remoteIp);
  }
}
