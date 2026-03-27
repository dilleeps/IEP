export function runAsync(label: string, fn: () => Promise<void>) {
  void fn().catch((err) => {
    console.error(`[async:${label}]`, err);
  });
}