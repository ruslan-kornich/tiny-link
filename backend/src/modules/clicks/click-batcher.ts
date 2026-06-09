export type FlushHandler<Item> = (batch: Item[]) => Promise<void>;

export class ClickBatcher<Item> {
  private buffer: Item[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly batchSize: number,
    private readonly intervalMs: number,
    private readonly onFlush: FlushHandler<Item>,
  ) {}

  async add(item: Item): Promise<void> {
    this.buffer.push(item);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
      return;
    }
    if (!this.timer) {
      this.timer = setTimeout(() => {
        // onFlush failures are handled inside the handler; never leave an unhandled rejection.
        void this.flush().catch(() => undefined);
      }, this.intervalMs);
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) {
      return;
    }
    const batch = this.buffer;
    this.buffer = [];
    await this.onFlush(batch);
  }

  size(): number {
    return this.buffer.length;
  }
}
