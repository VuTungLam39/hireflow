import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const HOOK_TIMEOUT_MS = 10_000;

// F-PUB-04
@Injectable()
export class PrerenderHookService implements OnModuleDestroy {
  private readonly logger = new Logger(PrerenderHookService.name);
  private timer?: NodeJS.Timeout;
  private reasons = new Set<string>();

  constructor(private readonly config: ConfigService) {}

  schedule(reason: string): void {
    const url = this.config.get<string>('app.prerender.deployHookUrl');
    if (!url) return;
    this.reasons.add(reason);
    if (this.timer) return;
    this.timer = setTimeout(
      () => {
        this.timer = undefined;
        const reasons = [...this.reasons];
        this.reasons.clear();
        void this.trigger(url, reasons);
      },
      this.config.get<number>('app.prerender.debounceMs', 30_000),
    );
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearTimeout(this.timer);
  }

  private async trigger(url: string, reasons: string[]): Promise<void> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(HOOK_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.logger.log(`Rebuild public pages requested (${reasons.join(', ')})`);
    } catch (error) {
      this.logger.warn(`Rebuild public pages failed: ${(error as Error).message}`);
    }
  }
}
