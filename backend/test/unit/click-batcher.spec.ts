import { ClickBatcher } from '../../src/modules/clicks/click-batcher';

describe('ClickBatcher', () => {
  afterEach(() => jest.useRealTimers());

  it('flushes immediately when the buffer reaches BATCH_SIZE', async () => {
    const batches: number[][] = [];
    const batcher = new ClickBatcher<number>(2, 10_000, (batch) => {
      batches.push(batch);
      return Promise.resolve();
    });
    await batcher.add(1);
    expect(batches).toHaveLength(0);
    await batcher.add(2);
    expect(batches).toEqual([[1, 2]]);
    expect(batcher.size()).toBe(0);
  });

  it('flushes after BATCH_INTERVAL_MS when below the size threshold', async () => {
    jest.useFakeTimers();
    const batches: number[][] = [];
    const batcher = new ClickBatcher<number>(100, 1_000, (batch) => {
      batches.push(batch);
      return Promise.resolve();
    });
    await batcher.add(7);
    expect(batches).toHaveLength(0);
    await jest.advanceTimersByTimeAsync(1_000);
    expect(batches).toEqual([[7]]);
  });

  it('manual flush is a no-op on an empty buffer', async () => {
    let calls = 0;
    const batcher = new ClickBatcher<number>(10, 1_000, () => {
      calls += 1;
      return Promise.resolve();
    });
    await batcher.flush();
    expect(calls).toBe(0);
  });

  it('manual flush drains the buffer and cancels the pending timer', async () => {
    jest.useFakeTimers();
    const batches: number[][] = [];
    const batcher = new ClickBatcher<number>(100, 1_000, (batch) => {
      batches.push(batch);
      return Promise.resolve();
    });
    await batcher.add(1);
    await batcher.flush();
    expect(batches).toEqual([[1]]);
    await jest.advanceTimersByTimeAsync(2_000);
    expect(batches).toHaveLength(1); // timer did not fire a second, empty flush
  });

  it('does not propagate a handler rejection from the timer callback', async () => {
    jest.useFakeTimers();
    const batcher = new ClickBatcher<number>(100, 500, () => {
      return Promise.reject(new Error('db down'));
    });
    await batcher.add(1);
    await expect(jest.advanceTimersByTimeAsync(500)).resolves.not.toThrow();
  });
});
