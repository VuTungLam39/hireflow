import {
  CompanySize,
  type CompanyBenefit,
  type CompanyMilestone,
  type CompanyOffice,
  type CompanySocials,
} from '../../../modules/company/entities/company-profile.entity.js';

// F-ORG-01 · Seed hồ sơ công ty mẫu cho trang /careers

export const COMPANY = {
  name: 'Công ty Cổ phần HireFlow',
  tagline: 'Đọc kỹ từng hồ sơ, tuyển đúng người cho từng đội',
  about: [
    'HireFlow xây dựng phần mềm quản lý tuyển dụng cho doanh nghiệp Việt Nam, với AI hỗ trợ đọc CV và luôn kèm bằng chứng cho từng nhận định.',
    'Đội ngũ hơn 200 người làm việc tại Hà Nội và TP. Hồ Chí Minh, chia thành các nhóm sản phẩm nhỏ tự chủ. Chúng tôi coi trọng sự rõ ràng: mỗi quyết định tuyển dụng đều có lý do, mỗi ứng viên đều được phản hồi.',
    'Nếu bạn thích làm sản phẩm có người dùng thật, được góp ý thẳng thắn và học từ đồng nghiệp giỏi, chúng tôi muốn gặp bạn.',
  ].join('\n\n'),
  sizeRange: CompanySize.M,
  industries: ['Phần mềm', 'Nhân sự', 'Trí tuệ nhân tạo'],
  foundedYear: 2016,
  website: 'https://hireflow.example.com',
  socials: {} satisfies CompanySocials,
  benefits: [
    {
      title: 'Lương tháng 13 và thưởng theo kết quả',
      description: 'Xét tăng lương hai lần mỗi năm, vào tháng 4 và tháng 10.',
    },
    {
      title: 'Bảo hiểm sức khoẻ cho cả gia đình',
      description: 'Gói bảo hiểm cao cấp cho nhân viên, vợ hoặc chồng và con.',
    },
    {
      title: 'Làm việc linh hoạt',
      description: 'Hai ngày làm từ xa mỗi tuần, giờ vào làm linh hoạt từ 8:00 đến 10:00.',
    },
    {
      title: '15 ngày phép mỗi năm',
      description: 'Thêm một ngày phép sau mỗi năm gắn bó, tối đa 20 ngày.',
    },
    {
      title: 'Ngân sách học tập 10 triệu/năm',
      description: 'Dùng cho khoá học, sách, hội thảo hoặc chứng chỉ chuyên môn.',
    },
    {
      title: 'Thiết bị làm việc',
      description: 'Laptop cấu hình cao và màn hình rời, chọn theo nhu cầu công việc.',
    },
  ] satisfies CompanyBenefit[],
  offices: [
    {
      name: 'Văn phòng Hà Nội',
      address: 'Tầng 12, 18 Duy Tân, Cầu Giấy, Hà Nội',
      mapUrl: 'https://maps.google.com/?q=18+Duy+Tân+Cầu+Giấy+Hà+Nội',
    },
    {
      name: 'Văn phòng TP. Hồ Chí Minh',
      address: 'Tầng 8, 76 Lê Lai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      mapUrl: 'https://maps.google.com/?q=76+Lê+Lai+Quận+1',
    },
  ] satisfies CompanyOffice[],
  milestones: [
    {
      year: 2016,
      title: 'Thành lập tại Hà Nội',
      description: 'Năm người sáng lập bắt đầu với công cụ quản lý CV cho các công ty khởi nghiệp.',
    },
    {
      year: 2019,
      title: 'Mở văn phòng TP. Hồ Chí Minh',
      description: 'Đội ngũ đạt 80 người, phục vụ hơn 300 doanh nghiệp.',
    },
    {
      year: 2022,
      title: 'Ra mắt chấm CV bằng AI',
      description: 'Mỗi điểm số đều kèm trích dẫn từ CV để người tuyển dụng tự kiểm.',
    },
    {
      year: 2025,
      title: 'Vượt 200 nhân sự',
      description: 'Thêm nhóm Dữ liệu và nhóm AI, đầu tư vào tìm kiếm hồ sơ theo kỹ năng.',
    },
  ] satisfies CompanyMilestone[],
};
