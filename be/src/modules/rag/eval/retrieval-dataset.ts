// F-SEARCH-01 · Mở rộng MVP 2 – E1: bộ câu hỏi đo truy xuất trên dữ liệu seed demo
// Đáp án tính bằng SQL: ứng viên có đoạn CV chứa một trong các `terms` (không dấu, không phân biệt hoa thường)

export interface RetrievalCase {
  id: string;
  kind: 'keyword' | 'meaning';
  question: string;
  terms: string[];
}

const keyword = (id: string, question: string, ...terms: string[]): RetrievalCase => ({
  id,
  kind: 'keyword',
  question,
  terms,
});

const meaning = (id: string, question: string, ...terms: string[]): RetrievalCase => ({
  id,
  kind: 'meaning',
  question,
  terms,
});

export const RETRIEVAL_CASES: RetrievalCase[] = [
  keyword('k01', 'Ai có kinh nghiệm Playwright?', 'playwright'),
  keyword('k02', 'Ứng viên nào dùng PySpark?', 'pyspark'),
  keyword('k03', 'Tìm người biết dbt', 'dbt'),
  keyword('k04', 'Ai từng làm với BigQuery?', 'bigquery'),
  keyword('k05', 'Ai dùng Helm để triển khai?', 'helm'),
  keyword('k06', 'Ứng viên nào biết Prometheus?', 'prometheus'),
  keyword('k07', 'Ai từng dùng Fastlane?', 'fastlane'),
  keyword('k08', 'Ai quản lý test case bằng TestRail?', 'testrail'),
  keyword('k09', 'Ai biết phần mềm kế toán MISA?', 'misa'),
  keyword('k10', 'Ai có kinh nghiệm Salesforce?', 'salesforce'),
  keyword('k11', 'Ai từng làm RabbitMQ?', 'rabbitmq'),
  keyword('k12', 'Ai biết Spring Boot?', 'spring boot'),
  keyword('k13', 'Ứng viên nào code Flutter?', 'flutter'),
  keyword('k14', 'Ai có chứng chỉ IELTS?', 'ielts'),
  keyword('k15', 'Ai biết Redis?', 'redis'),
  keyword('k16', 'Ai có kinh nghiệm Kafka?', 'kafka'),
  meaning('m01', 'Ai làm được ứng dụng di động?', 'flutter', 'kotlin', 'swift', 'react native'),
  meaning(
    'm02',
    'Ai có kinh nghiệm vận hành hạ tầng đám mây và container?',
    'kubernetes',
    'helm',
    'aws',
    'terraform',
  ),
  meaning(
    'm03',
    'Ai làm phân tích dữ liệu và dựng báo cáo?',
    'power bi',
    'looker',
    'bigquery',
    'pandas',
  ),
  meaning('m04', 'Ai từng chạy quảng cáo trực tuyến?', 'facebook ads', 'google ads', 'tiktok ads'),
  meaning('m05', 'Ai thiết kế được trải nghiệm người dùng?', 'figma', 'figjam'),
  meaning('m06', 'Ai có kinh nghiệm kiểm thử phần mềm?', 'selenium', 'playwright', 'testrail'),
  meaning('m07', 'Ai làm bán hàng cho khách doanh nghiệp?', 'b2b'),
];
