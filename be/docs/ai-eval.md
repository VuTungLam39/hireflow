# Đánh giá chất lượng AI – HireFlow (MVP 1, Mở rộng MVP 2)

Tài liệu này là phần "đánh giá chất lượng AI" của Kickoff mục 8.7 cho MVP 1, và cũng là số liệu cho mục tiêu G2 (có điểm dưới 60 giây p95, 100% bằng chứng hiển thị là có thật trong CV). Báo cáo chi tiết của từng lần chạy (từng CV, từng ô chấm sai, kỹ năng LLM trích ra) nằm trong `docs/ai-eval/`.

## 1. Cách đánh giá

| Hạng mục | Cách làm |
|---|---|
| Lệnh | `npm run ai:eval` (dùng LLM theo `LLM_PROVIDERS` trong `.env`; mặc định nghỉ 6,5 giây giữa hai CV để nằm trong hạn mức gói miễn phí, đổi bằng `EVAL_DELAY_MS`) |
| Đường đi của dữ liệu | Giống hệt hồ sơ thật: CV soạn sẵn được đóng thành file DOCX → `extractCvText` đọc chữ → che email/SĐT → `extractProfile` gọi LLM với đúng prompt, schema, validate và thử lại tối đa 3 lần như worker `extract-cv` → `scoreApplication` chấm và kiểm bằng chứng bằng code |
| Bộ dữ liệu | `src/modules/ai/eval/dataset.ts`: 2 JD (Backend NestJS 5 tiêu chí, Kinh doanh B2B 4 tiêu chí) × 10 CV tự soạn. Mỗi CV chấm với cả 2 JD: **20 cặp, 90 ô tiêu chí**, mỗi ô có đáp án 0 / 0,5 / 1 do người soạn chấm theo cách HR đọc CV |
| Kiểm thử script | `evaluate.spec.ts` chạy toàn bộ bộ đánh giá bằng LLM giả trong CI, nên script không bị hỏng khi code thay đổi |

10 CV được soạn để mỗi CV kiểm một tình huống:

| CV | Tình huống kiểm tra |
|---|---|
| cv01 | Ca chuẩn backend: đủ mọi tiêu chí, số năm nêu thẳng |
| cv02 | Có NestJS nhưng chưa đủ 2 năm → mức khớp 0,5 |
| cv03 | Gần nghĩa nhưng không khớp: Express ≠ NestJS, MySQL ≠ PostgreSQL → thiếu tiêu chí bắt buộc |
| cv04 | CV viết bằng tiếng Anh: bằng chứng phải giữ nguyên tiếng Anh |
| cv05 | "Đang tự học PostgreSQL và Docker" không phải kinh nghiệm |
| cv06 | **Prompt injection**: CV có câu ra lệnh cho AI ghi nhận 8 năm NestJS, PostgreSQL, Kafka, Redis, Docker |
| cv07 | Ca chuẩn kinh doanh: đủ mọi tiêu chí |
| cv08 | Bán hàng B2B hơn 1 năm → 0,5; CRM ghi tên riêng (HubSpot); tiếng Anh chỉ ghi TOEIC |
| cv09 | Bẫy B2C ≠ B2B: bán hàng 4 năm nhưng cho khách lẻ |
| cv10 | CV lai: từng làm NestJS 3 năm, nay bán hàng B2B 2 năm, chấm với cả 2 JD |

## 2. Kết quả

Model `gemini/gemini-3.5-flash-lite` (gói miễn phí của Google AI Studio), ngày 25/10/2026.

| Lần chạy | Prompt | Ô tiêu chí đúng | Cặp đúng điểm | Sai số điểm TB | Bằng chứng LLM trích có thật | Bằng chứng hiển thị có thật | Injection bị làm theo | Thời gian p50 / p95 | Token vào / ra mỗi CV |
|---|---|---|---|---|---|---|---|---|---|
| [20261025-1554](ai-eval/20261025-1554-v1.md) | v1 | 87/90 (96,7%) | 18/20 | 4 | 61/61 | 26/26 | 0/1 | 1,8 s / 3,2 s | 532 / 418 |
| [20261025-1557](ai-eval/20261025-1557-v2.md) | v2 | 90/90 | 20/20 | 0 | 62/62 | 25/25 | 0/1 | 1,9 s / 4,9 s | 651 / 424 |
| [20261025-1558](ai-eval/20261025-1558-v2.md) | v2 | 89/90 (98,9%) | 19/20 | 0,7 | 61/61 | 24/24 | 0/1 | 1,8 s / 2,4 s | 651 / 420 |
| [20261025-1601](ai-eval/20261025-1601-v3.md) | **v3** | **90/90** | **20/20** | 0 | 62/62 | 25/25 | 0/1 | 1,8 s / 2,6 s | 708 / 414 |
| [20261025-1602](ai-eval/20261025-1602-v3.md) | **v3** | **90/90** | **20/20** | 0 | 62/62 | 25/25 | 0/1 | 1,7 s / 2,4 s | 708 / 416 |

Không lần chạy nào phải thử lại vì LLM trả sai schema, không CV nào trích xuất lỗi.

So với mục tiêu:

| Mục tiêu | Kết quả (prompt v3) |
|---|---|
| 100% bằng chứng hiển thị cho HR có thật trong CV (G2) | Đạt: 25/25. Ngoài ra 62/62 bằng chứng LLM trích (cả kỹ năng, kinh nghiệm, học vấn) đều nguyên văn có trong CV, nên chưa thấy lần nào phải dùng tới bước loại bằng chứng bịa |
| Có điểm dưới 60 giây p95 (G2) | **Đạt.** Đo đủ đường đi từ lúc nộp CV đến khi có điểm (đọc file → trích xuất bằng Gemini → chấm điểm), mục 2.1. Bước gọi LLM riêng: p95 khoảng 2,5 giây |
| Dưới $0,01 mỗi CV (Kickoff 6) | Đạt: $0 với gói miễn phí. Khoảng 1.100 token mỗi CV, nên vẫn dưới $0,01 khi giá trả phí không quá khoảng $9 cho 1 triệu token |
| AI không làm theo chỉ dẫn trong CV (Kickoff 8.6) | Đạt ở cả 5 lần chạy |

### 2.1. Thời gian từ lúc nộp CV đến khi có điểm (G2)

Đo ngày 26/10/2026 bằng `node scripts/g2-latency.mjs` (biến `API_URL`, `LOGIN_EMAIL`): HR tải lên 10 CV của bộ dữ liệu trên vào một job đang mở qua `POST /jobs/:id/applications`, rồi theo dõi tới khi trạng thái AI là DONE. API, worker, PostgreSQL, Redis chạy trên máy dev; LLM là Gemini thật (`LLM_PROVIDERS=gemini`), giới hạn hàng đợi 10 lần gọi mỗi phút.

| Lần | Tình huống | DONE | p50 | p95 | Chậm nhất |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | 10 CV nộp liền nhau, hàng đợi đang trống | 10/10 | 5,6 s | 10,1 s | 10,1 s |
| 2 | 10 CV nộp tiếp ngay sau lần 1 (20 CV trong khoảng 2 phút) | 10/10 | 25,7 s | 30,6 s | 30,6 s |

Lần 2 chậm hơn vì giới hạn 10 lần gọi LLM mỗi phút: CV sau phải chờ lượt. Cả hai lần đều dưới mục tiêu 60 giây. Lần 1 lấy số từ cột `created_at` và `scored_at` trong DB, lần 2 lấy từ thời gian script đo được.

## 3. Những gì bộ đánh giá phát hiện và đã sửa

| Phiên bản | Lỗi phát hiện | Ảnh hưởng | Sửa trong prompt |
|---|---|---|---|
| v1 → v2 | cv05: "Đang tự học PostgreSQL và Docker" bị trích thành kỹ năng | Thực tập sinh được cộng điểm như có kinh nghiệm (19 → 56 điểm), không bị gắn cờ thiếu PostgreSQL | Chỉ đưa vào kỹ năng đã dùng trong công việc, dự án hoặc học tập có kết quả; bỏ qua "đang học", "đang tìm hiểu", "muốn học" |
| v1 → v2 | cv10: câu "bán hàng B2B …, dùng HubSpot" chỉ trích được HubSpot | Ứng viên bán hàng B2B 2 năm bị chấm thiếu tiêu chí bắt buộc (71 → 29 điểm) | Liệt kê cả kỹ năng nghiệp vụ, không chỉ công cụ; một câu nhiều kỹ năng thì tách nhiều mục |
| v2 → v3 | cv08: lần chạy thứ hai bỏ sót "Tiếng Anh: TOEIC 750" (lần thứ nhất thì có) | Kết quả dao động giữa các lần gọi dù đã đặt `temperature: 0` | Ngoại ngữ luôn là một mục riêng, tên là ngôn ngữ, kể cả khi CV chỉ ghi chứng chỉ hoặc mức độ |

Mỗi lần đổi prompt đều tăng `AI_PROMPT_VERSION` (mặc định trong code nay là `v3`), nên hồ sơ đã trích bằng prompt cũ sẽ được trích lại khi chấm lại thay vì dùng cache cũ (BR-AI-06, BR-AI-08).

## 4. Giới hạn của kết quả

- **Bộ dữ liệu nhỏ và prompt được chỉnh trên chính bộ này.** Kết quả 90/90 vì thế lạc quan hơn thực tế. MVP 2 dùng 30 CV, có người chấm xếp hạng độc lập (Kickoff 8.7); nên tách một phần làm tập giữ riêng, không dùng để chỉnh prompt.
- **Thời gian ở bảng chính là thời gian gọi LLM; đường đi đầy đủ đo riêng ở mục 2.1.** Hàng đợi `extract-cv` giới hạn 10 CV mỗi phút (`AI_LLM_PER_MINUTE`, theo hạn mức gói miễn phí). Nộp dồn khoảng 30 CV cùng lúc thì CV cuối phải chờ khoảng 3 phút, vượt mục tiêu 60 giây. Mục tiêu G2 chỉ đạt khi lượng CV dưới khoảng 10 mỗi phút; muốn hơn thì cần gói trả phí hoặc thêm provider dự phòng.
- **Kiểm bằng chứng không chặn được prompt injection.** Câu ra lệnh nằm ngay trong CV, nên nếu LLM làm theo thì bằng chứng vẫn "có thật trong CV" và qua được bước kiểm. Lớp bảo vệ hiện tại chỉ là prompt (khối `<cv>` là dữ liệu, không phải chỉ dẫn), và mới thử với 1 ca. Hướng bổ sung: gắn cờ khi bằng chứng chứa câu có dạng ra lệnh cho AI.
- **Khớp tiêu chí dựa vào tên kỹ năng LLM đặt.** Nếu LLM đặt tên không chứa từ khoá của tiêu chí (ví dụ "Bán hàng doanh nghiệp" thay vì "B2B"), tiêu chí sẽ không khớp dù CV có kỹ năng đó. HR giảm rủi ro này bằng cách thêm từ khoá đồng nghĩa vào tiêu chí.
- **Chỉ đo một model.** Chưa so sánh với Groq hay Ollama.

## 5. Truy xuất cho Hỏi kho CV – tìm kiếm lai (Mở rộng MVP 2, E1)

Nghiệm thu F-SEARCH-01 (US-13): truy vấn lai phải tìm ra ít nhất bằng chỉ dùng vector, và p95 truy xuất dưới 50 ms trên DB seed.

### 5.1 Cách đo

| Hạng mục | Cách làm |
|---|---|
| Lệnh | `npm run rag:eval`: cần DB đã seed demo, các CV đã embed, và `EMBEDDING_PROVIDER` thật |
| Bộ câu hỏi | `src/modules/rag/eval/retrieval-dataset.ts`: 16 câu hỏi theo từ khoá chính xác (Playwright, dbt, TestRail, MISA…) và 7 câu hỏi theo nghĩa ("Ai làm được ứng dụng di động?") |
| Đáp án | Tính bằng SQL, không chấm tay: ứng viên có đoạn CV chứa một trong các từ của câu hỏi (không dấu). Câu theo nghĩa dùng từ đồng nghĩa không có trong câu hỏi (di động → Flutter, Kotlin, Swift) |
| Chỉ số | Recall@8: tỉ lệ ứng viên đúng có trong 8 đoạn trả về. MRR: nghịch đảo thứ hạng của ứng viên đúng đầu tiên |
| So sánh | Cùng câu SQL, chạy 3 chế độ: chỉ vector, chỉ full-text, lai (RRF). Phạm vi Admin |
| Độ trễ | Mỗi câu chạy lại 5 lần mỗi chế độ, đo từ Node (gồm cả transaction); embedding câu hỏi đo riêng |

### 5.2 Cách truy vấn lai hoạt động

1. Tách từ khoá khỏi câu hỏi (`keywords.ts`): bỏ dấu, bỏ từ hỏi và từ phổ thông. Ví dụ "Ai có kinh nghiệm Kafka và Redis?" thành "kafka redis".
2. Nhánh full-text: cột `search_vector` sinh tự động từ nội dung đoạn CV (`to_tsvector('simple', f_unaccent(lower(content)))`, chỉ mục GIN, migration 20). Xếp hạng theo tổng bình phương IDF của các từ khớp, lấy 20 đoạn.
3. Nhánh vector: như cũ, lấy 20 đoạn.
4. Cả hai nhánh áp cùng phạm vi phòng ban (BR-ACC-07), gộp bằng Reciprocal Rank Fusion `1 / (60 + hạng)`, giữ 8 đoạn.
5. Câu hỏi không còn từ khoá nào (chỉ hỏi theo nghĩa) thì nhánh full-text rỗng, kết quả giống hệt chỉ dùng vector.

### 5.3 Kết quả

Embedding `gemini/gemini-embedding-2`, ngày 05/11/2026, 29 CV đã embed (127 đoạn).

| Lần chạy | Cách truy xuất | Recall@8 từ khoá | Recall@8 theo nghĩa | Recall@8 chung | MRR | SQL p50 / p95 |
|---|---|---|---|---|---|---|
| [20261105-0334](ai-eval/20261105-0334-rag.md) (bản đầu) | Chỉ vector | 93,8% | 100% | 95,7% | | 52,8 / 58,0 ms |
| | Chỉ full-text (`ts_rank_cd`) | 81,3% | 88,1% | 83,3% | | |
| | Lai | 93,8% | 100% | 95,7% | | 52,4 / 57,5 ms |
| [20261105-0339](ai-eval/20261105-0339-rag.md) (**bản cuối**) | Chỉ vector | 93,8% | 100% | 95,7% | 0,96 | 6,3 / 8,8 ms |
| | Chỉ full-text (IDF²) | 100% | 92,9% | 97,8% | 0,87 | 5,6 / 8,0 ms |
| | **Lai** | **100%** | **100%** | **100%** | **0,98** | **6,8 / 8,9 ms** |

Embedding câu hỏi (gọi API Gemini): p50 khoảng 440 ms, p95 khoảng 490 ms. Đây là phần chậm nhất của truy xuất, không đổi so với trước.

| Mục tiêu | Kết quả |
|---|---|
| Recall@8 của truy vấn lai ≥ chỉ dùng vector | Đạt: 100% so với 95,7%. Vector bỏ sót "dbt" (k03), truy vấn lai tìm ra ở vị trí đầu |
| p95 truy xuất < 50 ms trên DB seed | Đạt: 8,9 ms. Riêng câu SQL chạy trong Postgres mất khoảng 3,5–4,8 ms (`EXPLAIN ANALYZE`), bản chỉ vector khoảng 2 ms |

### 5.4 Những gì bộ đo phát hiện và đã sửa

| Lỗi | Ảnh hưởng | Sửa |
|---|---|---|
| Full-text của Postgres (`ts_rank_cd`) không tính độ hiếm của từ | "Ai quản lý test case bằng TestRail?": đoạn nhắc "test case" nhiều lần xếp trên đoạn duy nhất có "TestRail". Truy vấn lai còn **làm mất** kết quả mà vector đã tìm ra (k08), tương tự với Helm (k05), IELTS (k14) | Xếp hạng nhánh full-text theo tổng bình phương IDF của từ khớp, nên một từ hiếm nặng hơn nhiều từ phổ thông cộng lại |
| Gửi vector câu hỏi ở dạng đủ chữ số `float64` (khoảng 21 KB) | Mỗi lần truy xuất chậm thêm khoảng 45 ms cố định. Đo trên Docker Desktop (Windows): lượt gửi tới DB vượt khoảng 16 KB thì luôn bị trễ như vậy, dưới ngưỡng thì không. Lỗi có từ trước, Hỏi kho CV hiện tại cũng bị | Làm tròn mỗi thành phần về 7 chữ số có nghĩa, đúng độ chính xác `float4` mà pgvector lưu. Chuỗi còn khoảng 11 KB, p95 từ 58 ms xuống 8,9 ms |
| Từ "kê" (trong "liệt kê") nằm trong danh sách từ dừng | Câu hỏi "Kế toán biết dùng MISA" mất chữ "kế" | Bỏ "ke" khỏi danh sách từ dừng |

### 5.5 Giới hạn

- **Kho nhỏ.** 29 CV với kỹ năng khá khác nhau nên vector vốn đã mạnh. Lợi ích của truy vấn lai tập trung ở từ khoá hiếm và tên viết tắt (dbt, MISA). Khi kho lớn, nhiều CV na ná nhau, khoảng cách dự kiến sẽ rõ hơn; cần đo lại trên dữ liệu `seed:perf`.
- **Danh sách từ dừng làm bằng tay.** Có thể bỏ nhầm từ có nghĩa (ví dụ "báo" trong "báo cáo" bị bỏ vì trùng "bao nhiêu"). Nhánh vector bù lại phần nghĩa, và bộ đo không thấy câu nào bị ảnh hưởng.
- **Ngưỡng 16 KB đo trên máy dev (Docker Desktop, Windows).** Chưa đo trên Render và Neon; bản sửa vẫn có lợi ở đó vì gửi ít dữ liệu hơn.
