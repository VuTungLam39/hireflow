# 01 — Chiến lược kiểm thử (master plan §08.2)

| Lớp | Công cụ, vị trí | Lệnh | Chạy trong CI |
|---|---|---|---|
| Unit BE | vitest, `be/src/**/*.spec.ts` | `npm test` | Có |
| E2E API (nghiệp vụ, phân quyền, cô lập công ty) | `be/test/` trên Postgres + Redis thật | `npm run test:e2e` | Có |
| Component + integration FE | vitest + testing-library + msw, `fe/src` | `npm test` | Có |
| E2E trình duyệt | Playwright Test, `fe/e2e/` | `npm run e2e` | **Không** — cần stack local đầy đủ |
| Ảnh baseline (D-11) | `toHaveScreenshot`, ảnh ở `visual-baseline/` | `npm run e2e` (cập nhật: `npm run e2e:update`) | Không |
| Accessibility | axe-core + bàn phím (8c) | — | Không |
| Hiệu năng | Lighthouse, kích thước bundle, T1–T3 (8d) | — | Chỉ `check:bundle` |
| Security re-check (D-02) | hồ sơ `security-gate/` (8e) | — | Phần e2e BE có |

## Chạy E2E trình duyệt
1. `docker start hireflow-postgres hireflow-redis hireflow-storage hireflow-mailpit`
2. `be`: `npm run migration:run` và seed demo (gồm `platform@example.com`).
3. `fe`: `npx playwright install chromium firefox webkit` (lần đầu), `npm run e2e`. Config tự bật BE và FE nếu chưa chạy. Mật khẩu seed khác mặc định: đặt `E2E_PASSWORD`.

## Giới hạn
- Chỉ chạm local; không có bước nào ghi lên production.
- E2E trình duyệt hiện phủ **tải trang** (1 h1, không tràn ngang, lỗi JS, ảnh). Luồng thao tác theo vai được kiểm ở 8c; nghiệp vụ ghi dữ liệu đã có ở E2E API.
- Screen reader: chưa có người nghe thật → ghi "chưa kiểm".
