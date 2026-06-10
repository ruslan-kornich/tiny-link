export type FlushHandler<Item> = (batch: Item[]) => Promise<void>;

export class ClickBatcher<Item> {
  private buffer: Item[] = [];
  private timer: NodeJS.Timeout | null = null;
  private inFlightFlush: Promise<void> = Promise.resolve();

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

  // The buffer is grabbed synchronously, but handler calls are chained so
  // batches commit in insertion (id) order; the rollup id-cursor assumes
  // committed ids are monotone, which overlapping inserts would break.
  flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.buffer.length === 0) {
      return this.inFlightFlush; // let shutdown callers await an in-flight flush
    }
    const batch = this.buffer;
    this.buffer = [];
    const queuedFlush = this.inFlightFlush.then(() => this.onFlush(batch));
    this.inFlightFlush = queuedFlush.catch(() => undefined);
    return queuedFlush;
  }

  size(): number {
    return this.buffer.length;
  }
}
