/**
 * Nguồn dữ liệu liên hệ duy nhất cho toàn site (sticky widget + trang Liên hệ).
 *
 * ⚠️ TODO: thay các giá trị placeholder bên dưới bằng thông tin thật của bạn.
 * Để ẩn một kênh khỏi widget sticky, chỉ cần đặt `href` của kênh đó thành ''.
 */
export const contact = {
  /** Số hiển thị cho người dùng đọc. */
  phoneDisplay: '0900 000 000',
  /** Liên kết gọi điện — nên dùng định dạng quốc tế để hoạt động trên mobile. */
  phoneHref: 'tel:+84900000000',
  /** Link Zalo cá nhân, ví dụ https://zalo.me/0987654321 */
  zaloHref: 'https://zalo.me/0900000000',
  /** Link Messenger, ví dụ https://m.me/tamdev hoặc https://www.facebook.com/tamdev */
  messengerHref: 'https://m.me/tamdev',
} as const;
