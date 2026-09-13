import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Code2,
  ExternalLink,
  Mail,
  Menu,
  Palette,
  Rocket,
  ShieldCheck,
  X,
} from "lucide-react";
import { DATA } from "./data";

const ICONS = { github: Code2, linkedin: ExternalLink, email: Mail };
const SOCIAL_LABELS = { fanpage: "F", youtube: "YT", tiktok: "TT", github: "GH" };

function Reveal({ children, delay = 0, className = "", id }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay }}
      className={className}
      id={id}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ eyebrow, title, description, eyebrowEn, titleEn, descriptionEn, icon: Icon, language }) {
  const isEnglish = language === "en";
  return (
    <div className="section-heading">
      <div className="section-icon" aria-hidden="true"><Icon size={22} /></div>
      <p className="eyebrow">{isEnglish ? eyebrowEn : eyebrow}</p>
      <h2>{isEnglish ? titleEn : title}</h2>
      <p>{isEnglish ? descriptionEn : description}</p>
    </div>
  );
}

function SocialLinks() {
  return (
    <div className="social-links">
      {DATA.socials.map((social) => {
        const Icon = ICONS[social.id] || ExternalLink;
        return (
          <a key={social.id} href={social.link} aria-label={social.label} title={social.label} target={social.id === "email" ? undefined : "_blank"} rel={social.id === "email" ? undefined : "noreferrer"}>
            <Icon size={18} aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}

function FooterSocials() {
  return (
    <nav className="footer-socials" aria-label="Mạng xã hội">
      {DATA.footerSocials.map((social) => (
        <a key={social.id} href={social.link} target="_blank" rel="noreferrer" aria-label={social.label} title={social.label}>
          <span aria-hidden="true">{SOCIAL_LABELS[social.id]}</span>
          <span>{social.label}</span>
        </a>
      ))}
    </nav>
  );
}

function ContactForm({ language }) {
  const [status, setStatus] = useState("idle");
  const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;
  const isEnglish = language === "en";

  async function handleSubmit(event) {
    event.preventDefault();
    if (!endpoint) {
      setStatus("missing-endpoint");
      return;
    }

    setStatus("sending");
    const form = event.currentTarget;
    const response = await fetch(endpoint, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      form.reset();
      setStatus("success");
    } else {
      setStatus("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label> {isEnglish ? "Name" : "Họ và tên"} <input name="name" type="text" required placeholder={isEnglish ? "Your name" : "Tên của bạn"} /> </label>
        <label> Email <input name="email" type="email" required placeholder="you@example.com" /> </label>
      </div>
      <label> {isEnglish ? "Project brief" : "Nội dung trao đổi"} <textarea name="message" required rows="5" placeholder={isEnglish ? "What would you like to build or improve?" : "Bạn đang muốn xây dựng hoặc cải thiện điều gì?"} /> </label>
      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={status === "sending"}>
          {status === "sending" ? (isEnglish ? "Sending..." : "Đang gửi...") : (isEnglish ? "Send inquiry" : "Gửi yêu cầu")} <ArrowUpRight size={17} aria-hidden="true" />
        </button>
        <p className={`form-status ${status}`} role="status">
          {status === "success" && (isEnglish ? "Thank you. I will be in touch soon." : "Cảm ơn bạn. Tôi sẽ phản hồi sớm.")}
          {status === "missing-endpoint" && (isEnglish ? "The form is not configured yet. You can email directly instead." : "Form chưa được cấu hình. Bạn có thể gửi email trực tiếp.")}
          {status === "error" && (isEnglish ? "The form could not be sent. Please try again or email directly." : "Chưa gửi được form. Vui lòng thử lại hoặc gửi email trực tiếp.")}
        </p>
      </div>
    </form>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState("vi");
  const isEnglish = language === "en";
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);
  const navigation = [["Giới thiệu", "#top"], ["Sáng tạo", "#creative"], ["Dự án", "#engineering"], ["Blog", "#blog"], ["Liên hệ", "#contact"]];
  const navigationEn = [["About", "#top"], ["Creative", "#creative"], ["Projects", "#engineering"], ["Journal", "#blog"], ["Contact", "#contact"]];

  return (
    <div className="site-shell">
      <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Trang chủ Tamdev"><span className="brand-mark">T</span><span>Tamdev</span></a>
        <button className="menu-toggle" type="button" aria-label={isEnglish ? "Open navigation" : "Mở điều hướng"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        <button className={menuOpen ? "nav-backdrop is-open" : "nav-backdrop"} type="button" aria-label={isEnglish ? "Close navigation" : "Đóng điều hướng"} onClick={() => setMenuOpen(false)} />
        <nav id="mobile-navigation" className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label={isEnglish ? "Main navigation" : "Điều hướng chính"}>
          <div className="mobile-nav-brand"><span className="brand-mark">T</span><strong>Tamdev</strong><button type="button" className="mobile-nav-close" aria-label={isEnglish ? "Close navigation" : "Đóng điều hướng"} onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
          {(isEnglish ? navigationEn : navigation).map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a className="nav-contact" href={`mailto:${DATA.email}`}>{isEnglish ? "Start a conversation" : "Bắt đầu trao đổi"} <ArrowUpRight size={15} /></a>
          <button className="language-toggle" type="button" onClick={() => setLanguage(isEnglish ? "vi" : "en")} aria-label={isEnglish ? "Chuyển sang tiếng Việt" : "Switch to English"}><span className={!isEnglish ? "active" : ""}>VI</span><span className={isEnglish ? "active" : ""}>EN</span></button>
        </nav>
      </header>

      <main id="top">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <Reveal><p className="availability"><span /> {isEnglish ? "Available for selected partnerships" : "Sẵn sàng cho những hợp tác phù hợp"}</p></Reveal>
            <Reveal delay={0.08}><h1>{isEnglish ? "Build something " : "Xây dựng điều gì đó "}<span>{isEnglish ? "worth returning to." : "đáng để quay lại."}</span></h1></Reveal>
            <Reveal delay={0.16}><p className="hero-description">{isEnglish ? DATA.descriptionEn : DATA.description}</p></Reveal>
            <Reveal delay={0.24} className="hero-actions"><a className="button button-primary" href="#engineering">{isEnglish ? "Explore capabilities" : "Xem năng lực"} <ArrowUpRight size={17} /></a><a className="text-link" href="#contact">{isEnglish ? "Start a conversation" : "Bắt đầu một cuộc trò chuyện"} <ArrowUpRight size={16} /></a></Reveal>
          </div>
          <Reveal delay={0.2} className="hero-note"><p className="note-number">01</p><p>{isEnglish ? "Ideas are common." : "Ý tưởng rất phổ biến."}<br /><strong>{isEnglish ? "Execution is the signal." : "Khả năng thực thi mới tạo khác biệt."}</strong></p><span className="note-line" /><p className="english-copy">{isEnglish ? "A small studio for ambitious digital work." : "Một studio nhỏ cho những sản phẩm số có tham vọng."}</p></Reveal>
        </section>

        <section id="engineering" className="section-wrap content-grid">
          <Reveal className="feature-panel engineering-panel"><SectionHeading {...DATA.engineering} language={language} icon={Code2} /><div className="contribution-list">{DATA.engineering.contributions.map((item) => <article className="contribution" key={item.title}><div><span className="status">{isEnglish ? item.statusEn : item.status}</span><h3>{isEnglish ? item.titleEn : item.title}</h3><p>{isEnglish ? item.detailEn : item.detail}</p></div><span className="contribution-company">{isEnglish ? item.companyEn : item.company}</span></article>)}</div><div className="stack-list" aria-label={isEnglish ? "Technology stack" : "Công nghệ sử dụng"}>{DATA.engineering.stack.map((item) => <span key={item}>{item}</span>)}</div></Reveal>
          <Reveal delay={0.08} className="profile-panel"><div className="profile-orbit" aria-hidden="true"><span>T</span></div><p className="eyebrow">{isEnglish ? "Studio" : "Studio"}</p><h2>{DATA.name}</h2><p>{isEnglish ? DATA.roleEn : DATA.role}</p><SocialLinks /></Reveal>
        </section>

        <section className="section-wrap three-column">
          <Reveal id="strategy" className="small-panel strategy-panel"><SectionHeading {...DATA.strategy} language={language} icon={Rocket} /><ul className="offering-list">{DATA.strategy.offerings.map((item) => <li key={item.title}><CheckCircle2 size={18} /><span><strong>{isEnglish ? item.titleEn : item.title}</strong>{isEnglish ? item.detailEn : item.detail}</span></li>)}</ul></Reveal>
          <Reveal id="creative" delay={0.08} className="small-panel creative-panel"><SectionHeading {...DATA.creative} language={language} icon={Palette} /><div className="work-grid">{DATA.creative.works.map((work) => <article className={`work-card ${work.tone}`} key={work.title}><span>{isEnglish ? work.categoryEn : work.category}</span><strong>{isEnglish ? work.titleEn : work.title}</strong><ArrowUpRight size={18} /></article>)}</div></Reveal>
          <Reveal delay={0.16} className="small-panel security-panel"><SectionHeading {...DATA.security} language={language} icon={ShieldCheck} /><div className="service-list">{DATA.security.services.map((service) => <div key={service.name}><span>{isEnglish ? service.nameEn : service.name}</span><strong>{isEnglish ? service.levelEn : service.level}</strong></div>)}</div></Reveal>
        </section>

        <section id="blog" className="section-wrap blog-section">
          <Reveal className="blog-heading"><p className="eyebrow">06 / {isEnglish ? "Journal" : "Blog"}</p><h2>{isEnglish ? "Notes from the build room." : "Những ghi chú từ phòng làm việc."}</h2><p>{isEnglish ? "Short, practical thoughts on products, systems and the decisions behind them." : "Những ghi chú ngắn và thực tế về sản phẩm, hệ thống cùng các quyết định phía sau."}</p></Reveal>
          <div className="blog-list">
            {(isEnglish ? [
              ["01", "The quiet power of a clear brief", "Strategy / 5 min"],
              ["02", "Designing systems people can trust", "Product / 7 min"],
              ["03", "When performance becomes a product feature", "Engineering / 4 min"],
            ] : [
              ["01", "Sức mạnh thầm lặng của một brief rõ ràng", "Chiến lược / 5 phút"],
              ["02", "Thiết kế hệ thống tạo được niềm tin", "Sản phẩm / 7 phút"],
              ["03", "Khi hiệu năng trở thành một tính năng", "Kỹ thuật / 4 phút"],
            ]).map(([number, title, meta]) => <a className="blog-item" href="#contact" key={number}><span className="blog-number">{number}</span><strong>{title}</strong><span className="blog-meta">{meta}</span><ArrowUpRight size={18} /></a>)}
          </div>
        </section>

        <section id="contact" className="section-wrap contact-section"><Reveal className="contact-intro"><p className="eyebrow">{isEnglish ? "07 / Contact" : "07 / Liên hệ"}</p><h2>{isEnglish ? DATA.contact.titleEn : DATA.contact.title}</h2><p>{isEnglish ? DATA.contact.descriptionEn : DATA.contact.description}</p></Reveal><Reveal delay={0.1} className="contact-card"><ContactForm language={language} /><p className="direct-email">{isEnglish ? "Prefer email?" : "Bạn thích gửi email?"} <a href={`mailto:${DATA.email}`}>{DATA.email}</a></p></Reveal></section>
      </main>

      <footer className="site-footer"><span>© 2026 {DATA.name}</span><FooterSocials /><span>{isEnglish ? "Made with intent / Built for the long run" : "Được tạo nên có chủ đích / Bền vững theo thời gian"}</span><a href="#top">{isEnglish ? "Back to top ↑" : "Về đầu trang ↑"}</a></footer>
    </div>
  );
}
