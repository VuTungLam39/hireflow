import { foldText } from '../../common/utils/text.js';

// F-SEARCH-01 · Mở rộng MVP 2 – E1: lấy từ khoá kỹ thuật từ câu hỏi tiếng Việt cho full-text

/** Bỏ dấu như f_unaccent trong DB, để so với danh sách từ dừng */
export const fold = foldText;

/** Từ hỏi và từ phổ thông trong câu hỏi về CV: khớp ở mọi CV nên chỉ làm loãng thứ hạng */
const STOPWORDS = new Set(
  `ai ay ban bang bao biet cac can cho chua chuyen co con cua cv da dang danh de den deu duoc dung gan gi gioi hay hien ho hoac hon it kha khi khong kinh ky la lam liet loai minh moi mot nam nang nao nay neu nghiem ngoai nguoi nhan nhat nhieu nhu nhung nua o phai qua ra rat rieng sach sau so su ta tai the theo thi thuc tim toi tot trong tren tu tung uu va van ve vi vien voi xa yeu ung
   a an and any are can candidate candidates cv do does experience experienced for from has have in is know knows of on or the their them to who with year years using used`.split(
    /\s+/,
  ),
);

const MAX_KEYWORDS = 8;

/**
 * "Ai có kinh nghiệm Kafka và Redis?" → "kafka redis". Trả chuỗi rỗng khi câu hỏi chỉ hỏi theo
 * nghĩa (khi đó truy vấn lai chỉ còn phần vector). Dấu . + # giữ lại cho node.js, c#, c++.
 */
export function searchKeywords(question: string): string {
  const seen = new Set<string>();
  for (const raw of fold(question).split(/[^a-z0-9.+#]+/)) {
    const token = raw.replace(/^[.]+|[.]+$/g, '');
    if (!token || STOPWORDS.has(token)) continue;
    if (token.length < 2 && !/[+#]/.test(token)) continue;
    seen.add(token);
    if (seen.size === MAX_KEYWORDS) break;
  }
  return [...seen].join(' ');
}
