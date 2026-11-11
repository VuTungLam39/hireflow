// Kiểm phụ thuộc tính tiền theo giao dịch (B2): giữ kết quả một lúc thay vì gọi mỗi lần health bị hỏi.
// Lỗi giữ ngắn hơn để hồi phục được thấy sớm; các lần gọi đồng thời dùng chung một request.
export function cachedCheck(okMs: number, failMs: number, now: () => number = Date.now) {
  let checkedAt = Number.NEGATIVE_INFINITY;
  let error: unknown = null;
  let inflight: Promise<void> | null = null;

  return async (run: () => Promise<void>): Promise<void> => {
    const ttl = error ? failMs : okMs;
    if (now() - checkedAt >= ttl) {
      inflight ??= run()
        .then(
          () => {
            error = null;
          },
          (e: unknown) => {
            error = e;
          },
        )
        .finally(() => {
          checkedAt = now();
          inflight = null;
        });
      await inflight;
    }
    if (error) throw error;
  };
}
