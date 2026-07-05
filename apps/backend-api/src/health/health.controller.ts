import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      details: {
        memory: {
          heapUsed: this.formatBytes(memory.heapUsed),
          heapTotal: this.formatBytes(memory.heapTotal),
          rss: this.formatBytes(memory.rss),
        },
        uptime: this.formatUptime(uptime),
      },
    };
  }

  private formatBytes(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }
}
