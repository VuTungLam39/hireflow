export const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: VN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD */
export const vnToday = (now: Date = new Date()) => dayFormat.format(now);

/** BR-JOB-10: điều kiện SQL "chưa quá hạn nộp" cho bảng có alias `alias` */
export const notExpiredSql = (alias: string) =>
  `(${alias}.deadline IS NULL OR ${alias}.deadline >= (now() AT TIME ZONE '${VN_TIME_ZONE}')::date)`;
