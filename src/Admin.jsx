import { useState } from "react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";

const stats = [
  { label: "Lượt xem tháng này", value: "12.840", change: "+18,4%", icon: BarChart3 },
  { label: "Dự án đang hiển thị", value: "08", change: "+2 dự án", icon: FolderKanban },
  { label: "Bài viết đã xuất bản", value: "14", change: "+3 bài viết", icon: PenLine },
  { label: "Tin nhắn mới", value: "06", change: "Cần xử lý", icon: MessageSquare },
];

const projects = [
  ["Tamdev Portfolio", "Website", "Đang hiển thị", "12/09/2026"],
  ["Northstar Product", "UI/UX", "Bản nháp", "09/09/2026"],
  ["Signal Identity", "Nhận diện", "Đang hiển thị", "04/09/2026"],
];

const messages = [
  ["Minh Anh", "Tư vấn sản phẩm số", "10 phút trước", "MA"],
  ["Hoàng Nam", "Thiết kế lại website", "2 giờ trước", "HN"],
  ["Linh Studio", "Hợp tác nội dung", "Hôm qua", "LS"],
];

export default function Admin() {
  const [activeView, setActiveView] = useState("Tổng quan");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const navigation = [
    ["Tổng quan", LayoutDashboard],
    ["Dự án", FolderKanban],
    ["Bài viết", PenLine],
    ["Tin nhắn", MessageSquare],
    ["Khách hàng", Users],
  ];

  function handleAction(label) {
    setNotice(`${label} sẽ sẵn sàng trong phiên bản kết nối dữ liệu.`);
    window.setTimeout(() => setNotice(""), 3200);
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/" aria-label="Quay lại website Tamdev">
          <span className="brand-mark">T</span>
          <span>Tamdev <em>Admin</em></span>
        </a>
        <div className="admin-workspace"><span className="workspace-avatar">T</span><span><strong>Tamdev</strong><small>Không gian cá nhân</small></span><ChevronDown size={15} /></div>
        <nav className="admin-nav" aria-label="Điều hướng quản trị">
          <p className="admin-label">Không gian làm việc</p>
          {navigation.map(([label, Icon]) => <button key={label} className={activeView === label ? "active" : ""} onClick={() => setActiveView(label)}><Icon size={18} /><span>{label}</span>{label === "Tin nhắn" && <b>6</b>}</button>)}
          <p className="admin-label admin-label-spaced">Hệ thống</p>
          <button className={activeView === "Cài đặt" ? "active" : ""} onClick={() => setActiveView("Cài đặt")}><Settings size={18} /><span>Cài đặt</span></button>
        </nav>
        <div className="admin-sidebar-bottom"><a href="/"><LogOut size={17} />Về website</a><div className="admin-user"><span className="workspace-avatar">TV</span><span><strong>Tamdev</strong><small>Quản trị viên</small></span><MoreHorizontal size={17} /></div></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar"><div className="admin-breadcrumb"><span>Quản trị</span><strong>/ {activeView}</strong></div><div className="admin-top-actions"><button className="admin-icon-button" aria-label="Tìm kiếm" onClick={() => setSearchOpen(!searchOpen)}><Search size={18} /></button><button className="admin-icon-button notification-button" aria-label="Thông báo"><Bell size={18} /><i /></button><button className="admin-profile"><span className="workspace-avatar">TV</span><span>Tamdev</span><ChevronDown size={15} /></button></div></header>
        {searchOpen && <div className="admin-search"><Search size={17} /><input autoFocus placeholder="Tìm kiếm dự án, bài viết..." /><button onClick={() => setSearchOpen(false)}>Đóng</button></div>}

        <div className="admin-content">
          <section className="admin-welcome"><div><p className="admin-kicker">Thứ Hai, 14 tháng 9, 2026</p><h1>Chào buổi sáng, Tamdev.</h1><p>Theo dõi hoạt động và cập nhật không gian nội dung của bạn.</p></div><button className="admin-primary-button" onClick={() => handleAction("Tạo mới")}><Plus size={17} /> Tạo nội dung</button></section>
          {notice && <div className="admin-notice" role="status">{notice}</div>}
          <section className="admin-stats">{stats.map(({ label, value, change, icon: Icon }) => <article className="admin-stat" key={label}><div className="admin-stat-icon"><Icon size={19} /></div><p>{label}</p><strong>{value}</strong><span>{change}</span></article>)}</section>

          <section className="admin-grid-main"><article className="admin-panel chart-panel"><div className="admin-panel-heading"><div><p className="admin-kicker">Hiệu suất</p><h2>Lượt xem website</h2></div><button className="admin-select">30 ngày <ChevronDown size={14} /></button></div><div className="fake-chart"><div className="chart-y"><span>4k</span><span>3k</span><span>2k</span><span>1k</span><span>0</span></div><div className="chart-area"><div className="chart-grid-lines" /><div className="chart-line" /><div className="chart-labels"><span>17/8</span><span>24/8</span><span>31/8</span><span>7/9</span><span>14/9</span></div></div></div></article><article className="admin-panel activity-panel"><div className="admin-panel-heading"><div><p className="admin-kicker">Hoạt động</p><h2>Mới nhất</h2></div><button className="admin-more" aria-label="Xem thêm"><MoreHorizontal size={19} /></button></div><div className="activity-list"><div><span className="activity-dot green" /><p><strong>Portfolio</strong> đã được cập nhật<small>12 phút trước</small></p></div><div><span className="activity-dot blue" /><p><strong>Northstar Product</strong> chuyển sang bản nháp<small>2 giờ trước</small></p></div><div><span className="activity-dot purple" /><p><strong>3 bài viết</strong> được lên lịch<small>Hôm qua</small></p></div></div></article></section>

          <section className="admin-grid-main lower-grid"><article className="admin-panel table-panel"><div className="admin-panel-heading"><div><p className="admin-kicker">Nội dung</p><h2>Dự án gần đây</h2></div><button className="admin-text-button" onClick={() => setActiveView("Dự án")}>Xem tất cả <ChevronDown size={14} /></button></div><div className="admin-table"><div className="table-head"><span>Tên dự án</span><span>Loại</span><span>Trạng thái</span><span>Cập nhật</span></div>{projects.map(([name, type, status, date]) => <div className="table-row" key={name}><strong>{name}</strong><span>{type}</span><span className={status === "Đang hiển thị" ? "status-live" : "status-draft"}>{status}</span><span>{date}</span></div>)}</div></article><article className="admin-panel messages-panel"><div className="admin-panel-heading"><div><p className="admin-kicker">Liên hệ</p><h2>Tin nhắn mới</h2></div><button className="admin-text-button" onClick={() => setActiveView("Tin nhắn")}>Xem tất cả</button></div><div className="message-list">{messages.map(([name, subject, time, initials]) => <div className="message-row" key={name}><span className="message-avatar">{initials}</span><p><strong>{name}</strong><span>{subject}</span></p><small>{time}</small></div>)}</div></article></section>
        </div>
      </main>
    </div>
  );
}
