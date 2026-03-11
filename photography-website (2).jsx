import { useState, useEffect, useRef } from "react";

// ── Palette & fonts injected via <style> ─────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --ink:   #0d0d0d;
      --cream: #f5f0e8;
      --warm:  #e8ddd0;
      --gold:  #c9a84c;
      --gold2: #f0d080;
      --muted: #7a6e62;
      --white: #ffffff;
      --glass: rgba(255,255,255,0.06);
      --border: rgba(201,168,76,0.25);
      --shadow: 0 24px 64px rgba(0,0,0,0.45);
    }

    html { scroll-behavior: smooth; }

    body {
      background: var(--ink);
      color: var(--cream);
      font-family: 'DM Sans', sans-serif;
      font-weight: 300;
      line-height: 1.6;
      overflow-x: hidden;
    }

    h1,h2,h3,h4 { font-family: 'Cormorant Garamond', serif; font-weight: 300; line-height: 1.15; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--ink); }
    ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }

    /* Fade-in animation */
    @keyframes fadeUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes shimmer { 0%,100% { opacity:.6; } 50% { opacity:1; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes scaleIn { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }

    .fade-up  { animation: fadeUp .7s ease both; }
    .fade-in  { animation: fadeIn .5s ease both; }

    /* Noise texture overlay */
    body::after {
      content:''; position:fixed; inset:0; pointer-events:none; z-index:9999;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
      opacity: .4;
    }
  `}</style>
);

// ── Reusable UI components ────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "gold", type = "button", style = {}, disabled }) => {
  const styles = {
    gold: {
      background: "linear-gradient(135deg,#c9a84c,#f0d080,#c9a84c)",
      color: "#0d0d0d", border: "none", fontWeight: 500,
    },
    outline: {
      background: "transparent", color: "var(--gold)",
      border: "1px solid var(--gold)",
    },
    ghost: {
      background: "var(--glass)", color: "var(--cream)",
      border: "1px solid rgba(255,255,255,0.1)",
      backdropFilter: "blur(8px)",
    },
    danger: {
      background: "linear-gradient(135deg,#c0392b,#e74c3c)",
      color: "#fff", border: "none",
    }
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "11px 28px", borderRadius: "2px", cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans', sans-serif", fontSize: "13px", letterSpacing: "1.5px",
        textTransform: "uppercase", transition: "all .25s ease",
        opacity: disabled ? .5 : 1,
        ...styles[variant], ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, required, accept }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <label style={{ display: "block", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>{label}</label>}
    {type === "textarea" ? (
      <textarea value={value} onChange={onChange} placeholder={placeholder} required={required} rows={4}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 2, padding: "12px 14px", color: "var(--cream)", fontFamily: "'DM Sans',sans-serif", fontSize: 14, resize: "vertical", outline: "none" }} />
    ) : type === "select" ? null : (
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} accept={accept}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 2, padding: "12px 14px", color: "var(--cream)", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none" }} />
    )}
  </div>
);

const Select = ({ label, value, onChange, options, required }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <label style={{ display: "block", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>{label}</label>}
    <select value={value} onChange={onChange} required={required}
      style={{ width: "100%", background: "#1a1710", border: "1px solid var(--border)", borderRadius: 2, padding: "12px 14px", color: "var(--cream)", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none" }}>
      <option value="">-- Select --</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)", animation: "fadeIn .3s ease" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#131210", border: "1px solid var(--border)", borderRadius: 4, padding: "36px 40px", maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", animation: "scaleIn .3s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <h3 style={{ fontSize: 26, color: "var(--cream)" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 22 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Toast = ({ msg, type }) => (
  <div style={{
    position: "fixed", bottom: 28, right: 28, zIndex: 2000,
    background: type === "error" ? "#c0392b" : "#1e6b3d",
    color: "#fff", padding: "14px 24px", borderRadius: 3,
    fontFamily: "'DM Sans',sans-serif", fontSize: 14,
    boxShadow: "0 8px 32px rgba(0,0,0,.5)", animation: "fadeUp .4s ease",
    maxWidth: 340,
  }}>{msg}</div>
);

// ── Mock photo data (Unsplash) ────────────────────────────────────────────────
const PHOTOS = {
  portraits: [
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  ],
  weddings: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80",
  ],
  events: [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
    "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
  ],
  products: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80",
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  ],
};

const HERO_BG = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1600&q=85";

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null); // { name, email, isAdmin }
  const [users, setUsers] = useState([
    { name: "Admin", email: "admin@lens.com", password: "admin123", isAdmin: true },
  ]);
  const [bookings, setBookings] = useState([
    { id: 1, user: "demo@lens.com", service: "Wedding Photography", date: "2025-06-15", location: "Garden Venue, NYC", notes: "Outdoor ceremony", status: "confirmed" },
    { id: 2, user: "demo@lens.com", service: "Portrait Session", date: "2025-05-20", location: "Studio", notes: "", status: "pending" },
  ]);
  const [reviews, setReviews] = useState([
    { id: 1, user: "Sarah M.", rating: 5, text: "Absolutely breathtaking photos! Every moment captured perfectly.", service: "Wedding Photography", date: "2025-03-10" },
    { id: 2, user: "James K.", rating: 5, text: "Professional, creative, and delivered beyond expectations.", service: "Portrait Session", date: "2025-02-28" },
    { id: 3, user: "Priya R.", rating: 4, text: "Amazing editing work, the colours are so vibrant!", service: "Photo Editing", date: "2025-01-15" },
  ]);
  const [collabs, setCollabs] = useState([]);
  const [portfolioImages, setPortfolioImages] = useState(PHOTOS);

  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // "login" | "register" | "book" | "booking-detail"
  const [selectedBooking, setSelectedBooking] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const nav = [
    { id: "home", label: "Home" },
    { id: "services", label: "Services" },
    { id: "portfolio", label: "Portfolio" },
    { id: "profile", label: "Photographer" },
    { id: "reviews", label: "Reviews" },
    { id: "collab", label: "Collaborate" },
  ];

  return (
    <>
      <GlobalStyle />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <Nav nav={nav} page={page} setPage={setPage} user={user} setUser={setUser} setModal={setModal} />

      <main>
        {page === "home"     && <HomePage setPage={setPage} setModal={setModal} user={user} />}
        {page === "services" && <ServicesPage setModal={setModal} user={user} />}
        {page === "portfolio"&& <PortfolioPage portfolioImages={portfolioImages} />}
        {page === "profile"  && <ProfilePage />}
        {page === "reviews"  && <ReviewsPage reviews={reviews} setReviews={setReviews} user={user} setModal={setModal} showToast={showToast} />}
        {page === "collab"   && <CollabPage collabs={collabs} setCollabs={setCollabs} user={user} setModal={setModal} showToast={showToast} />}
        {page === "admin"    && user?.isAdmin && <AdminPage bookings={bookings} setBookings={setBookings} reviews={reviews} setReviews={setReviews} collabs={collabs} portfolioImages={portfolioImages} setPortfolioImages={setPortfolioImages} showToast={showToast} />}
        {page === "my-bookings" && user && <MyBookings bookings={bookings.filter(b => b.user === user.email)} />}
      </main>

      {modal === "login"    && <LoginModal users={users} setUser={setUser} onClose={() => setModal(null)} showToast={showToast} />}
      {modal === "register" && <RegisterModal users={users} setUsers={setUsers} setUser={setUser} onClose={() => setModal(null)} showToast={showToast} />}
      {modal === "book"     && <BookModal user={user} bookings={bookings} setBookings={setBookings} onClose={() => setModal(null)} showToast={showToast} />}

      <Footer setPage={setPage} />
    </>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ nav, page, setPage, user, setUser, setModal }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 500,
      background: scrolled ? "rgba(13,13,13,.95)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid var(--border)" : "none",
      transition: "all .35s ease",
      padding: "0 40px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        {/* Logo */}
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16 }}>◉</span>
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "var(--cream)", letterSpacing: 3, fontStyle: "italic" }}>LENSCRAFT</span>
        </button>

        {/* Desktop nav */}
        <nav style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: page === n.id ? "var(--gold)" : "var(--cream)", borderBottom: page === n.id ? "1px solid var(--gold)" : "1px solid transparent", paddingBottom: 2, transition: "color .2s" }}>
              {n.label}
            </button>
          ))}
          {user && (
            <>
              <button onClick={() => setPage("my-bookings")}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: page === "my-bookings" ? "var(--gold)" : "var(--muted)", transition: "color .2s" }}>
                My Bookings
              </button>
              {user.isAdmin && (
                <button onClick={() => setPage("admin")}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: page === "admin" ? "var(--gold)" : "var(--muted)", transition: "color .2s" }}>
                  Admin
                </button>
              )}
            </>
          )}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Hello, {user.name.split(" ")[0]}</span>
              <Btn variant="outline" onClick={() => setUser(null)} style={{ padding: "7px 18px", fontSize: 11 }}>Sign Out</Btn>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setModal("login")} style={{ padding: "7px 18px", fontSize: 11 }}>Sign In</Btn>
              <Btn variant="gold" onClick={() => setModal("register")} style={{ padding: "7px 18px", fontSize: 11 }}>Register</Btn>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
function HomePage({ setPage, setModal, user }) {
  return (
    <div>
      {/* Hero */}
      <section style={{ position: "relative", height: "100vh", minHeight: 600, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <img src={HERO_BG} alt="hero" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(.45)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,13,13,.2) 0%, rgba(13,13,13,.7) 100%)" }} />

        <div style={{ position: "relative", textAlign: "center", padding: "0 24px", animation: "fadeUp .9s ease" }}>
          <p style={{ fontSize: 12, letterSpacing: 6, textTransform: "uppercase", color: "var(--gold)", marginBottom: 20 }}>Award-Winning Photography</p>
          <h1 style={{ fontSize: "clamp(48px,8vw,96px)", color: "var(--cream)", marginBottom: 24, lineHeight: 1.05 }}>
            Every Frame<br /><em style={{ color: "var(--gold2)" }}>Tells a Story</em>
          </h1>
          <p style={{ fontSize: 17, color: "rgba(245,240,232,.75)", maxWidth: 520, margin: "0 auto 44px", lineHeight: 1.7 }}>
            Professional photography, expert editing, and brand collaboration services — crafted to capture moments that last forever.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <Btn onClick={() => user ? setModal("book") : setModal("login")}>Book a Photoshoot</Btn>
            <Btn variant="outline" onClick={() => setPage("services")}>Our Services</Btn>
            <Btn variant="ghost" onClick={() => setPage("portfolio")}>View Portfolio</Btn>
            <Btn variant="ghost" onClick={() => setPage("collab")}>Collaborate</Btn>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: .6 }}>
          <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, var(--gold), transparent)" }} />
        </div>
      </section>

      {/* Intro strip */}
      <section style={{ background: "var(--ink)", padding: "100px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>About the Photographer</p>
            <h2 style={{ fontSize: "clamp(32px,4vw,52px)", color: "var(--cream)", marginBottom: 24 }}>Capturing Life<br />In Its Purest Light</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.85, marginBottom: 20 }}>
              With over 12 years of experience, I specialize in portrait, wedding, event, and product photography. My philosophy is simple: every image should evoke genuine emotion and stand the test of time.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.85, marginBottom: 32 }}>
              From intimate portraits to grand celebrations, I bring technical excellence and artistic vision to every shoot.
            </p>
            <Btn onClick={() => setPage("profile")}>Meet the Photographer</Btn>
          </div>
          <div style={{ position: "relative" }}>
            <img src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=700&q=80" alt="photographer" style={{ width: "100%", height: 480, objectFit: "cover", borderRadius: 2 }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 160, height: 160, background: "var(--gold)", opacity: .08, borderRadius: 2, zIndex: -1 }} />
            <div style={{ position: "absolute", top: 24, right: -16, background: "#131210", border: "1px solid var(--border)", padding: "16px 22px", borderRadius: 2 }}>
              <div style={{ fontSize: 28, fontFamily: "'Cormorant Garamond',serif", color: "var(--gold)" }}>500+</div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase" }}>Sessions Done</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services teaser */}
      <section style={{ background: "#0a0908", padding: "100px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 12, textAlign: "center" }}>What We Offer</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,46px)", textAlign: "center", color: "var(--cream)", marginBottom: 60 }}>Our Services</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 2 }}>
            {[
              { icon: "📷", title: "Photoshoots", desc: "Events, portraits, weddings & product photography" },
              { icon: "✨", title: "Photo Editing", desc: "Professional retouching, color grading & compositing" },
              { icon: "🤝", title: "Collaboration", desc: "Brand partnerships, influencer & creator campaigns" },
              { icon: "📢", title: "Promotion", desc: "Visual content strategy & social media photography" },
            ].map((s, i) => (
              <div key={i} onClick={() => setPage("services")}
                style={{ background: "var(--glass)", border: "1px solid var(--border)", padding: "40px 32px", cursor: "pointer", transition: "all .25s ease", backdropFilter: "blur(4px)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{s.icon}</div>
                <h3 style={{ fontSize: 22, color: "var(--cream)", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery strip */}
      <section style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", height: 380 }}>
          {[...PHOTOS.weddings.slice(0,2), ...PHOTOS.portraits.slice(0,2)].map((src, i) => (
            <div key={i} onClick={() => setPage("portfolio")}
              style={{ flex: 1, overflow: "hidden", cursor: "pointer" }}>
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s ease" }}
                onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
                onMouseLeave={e => e.target.style.transform = "scale(1)"} />
            </div>
          ))}
        </div>
      </section>

      {/* Reviews teaser */}
      <section style={{ background: "var(--ink)", padding: "100px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>Client Words</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", color: "var(--cream)", marginBottom: 52 }}>What People Say</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24 }}>
            {[
              { name: "Sarah M.", text: "Breathtaking photos! Every moment captured perfectly.", stars: 5 },
              { name: "James K.", text: "Professional, creative, and delivered beyond expectations.", stars: 5 },
              { name: "Priya R.", text: "Amazing editing work — the colours are so vibrant!", stars: 4 },
            ].map((r, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", padding: "28px 24px", borderRadius: 2, textAlign: "left" }}>
                <div style={{ color: "var(--gold)", fontSize: 16, marginBottom: 12 }}>{"★".repeat(r.stars)}</div>
                <p style={{ color: "var(--cream)", fontSize: 15, lineHeight: 1.7, marginBottom: 16, fontStyle: "italic" }}>"{r.text}"</p>
                <span style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)" }}>— {r.name}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40 }}>
            <Btn variant="outline" onClick={() => setPage("reviews")}>Read All Reviews</Btn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "linear-gradient(135deg,#1a1200,#0d0d0d)", padding: "100px 40px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "clamp(32px,5vw,60px)", color: "var(--cream)", marginBottom: 20 }}>
          Ready to Create<br /><em style={{ color: "var(--gold2)" }}>Something Beautiful?</em>
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: 40, fontSize: 16 }}>Book your session today and let's craft memories that last a lifetime.</p>
        <Btn onClick={() => user ? setModal("book") : setModal("login")} style={{ fontSize: 14, padding: "14px 40px" }}>
          Book a Session
        </Btn>
      </section>
    </div>
  );
}

// ── Services Page ─────────────────────────────────────────────────────────────
function ServicesPage({ setModal, user }) {
  const services = [
    {
      title: "Wedding Photography",
      icon: "💍", price: "From $1,200",
      desc: "Capture every tender moment of your special day with timeless, editorial-style wedding photography. From the morning preparations to the final dance.",
      img: PHOTOS.weddings[0],
      features: ["Full day coverage", "Edited gallery of 500+ images", "Online delivery", "Print-ready files"],
    },
    {
      title: "Portrait Sessions",
      icon: "🧑‍🎨", price: "From $250",
      desc: "Personal, professional, or creative portraits. Studio or on-location sessions tailored to showcase your authentic self.",
      img: PHOTOS.portraits[0],
      features: ["1–2 hour session", "50+ edited images", "Multiple outfit changes", "Print-ready files"],
    },
    {
      title: "Event Photography",
      icon: "🎉", price: "From $600",
      desc: "Corporate events, galas, launches, and private parties. Discreet, high-quality coverage that tells the story of your event.",
      img: PHOTOS.events[0],
      features: ["Hourly packages available", "Quick turnaround", "Candid & formal shots", "Full resolution files"],
    },
    {
      title: "Product Photography",
      icon: "📦", price: "From $150",
      desc: "Make your products shine with clean, commercial photography optimized for e-commerce, ads, and brand content.",
      img: PHOTOS.products[0],
      features: ["White & lifestyle backgrounds", "RAW + edited files", "Same-day delivery option", "Bulk pricing available"],
    },
    {
      title: "Professional Photo Editing",
      icon: "✨", price: "From $5/image",
      desc: "Expert retouching, color grading, background removal, and compositing. Send your raw files, receive gallery-quality results.",
      img: "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=600&q=80",
      features: ["Color correction & grading", "Skin retouching", "Background replacement", "48h turnaround"],
    },
    {
      title: "Brand Collaboration",
      icon: "🤝", price: "Custom pricing",
      desc: "Partner with a professional photographer to create stunning visual content for your brand, campaign, or social media presence.",
      img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80",
      features: ["Creative direction", "Content strategy", "Multi-platform assets", "Licensing included"],
    },
  ];

  return (
    <div style={{ paddingTop: 72 }}>
      <div style={{ background: "#0a0908", padding: "80px 40px 60px", textAlign: "center" }}>
        <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>What We Offer</p>
        <h1 style={{ fontSize: "clamp(36px,5vw,64px)", color: "var(--cream)" }}>Our Services</h1>
      </div>
      <div style={{ background: "var(--ink)", padding: "60px 40px 100px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 2 }}>
          {services.map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", overflow: "hidden", transition: "border-color .25s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              <div style={{ height: 240, overflow: "hidden", position: "relative" }}>
                <img src={s.img} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }}
                  onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(13,13,13,.8)", backdropFilter: "blur(8px)", border: "1px solid var(--border)", padding: "6px 14px", borderRadius: 2, fontSize: 13, color: "var(--gold)", fontWeight: 500 }}>{s.price}</div>
              </div>
              <div style={{ padding: "28px 28px 32px" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <h3 style={{ fontSize: 24, color: "var(--cream)", marginBottom: 12 }}>{s.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>{s.desc}</p>
                <ul style={{ listStyle: "none", marginBottom: 24 }}>
                  {s.features.map((f, j) => (
                    <li key={j} style={{ fontSize: 13, color: "var(--cream)", display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ color: "var(--gold)", fontSize: 10 }}>◆</span>{f}
                    </li>
                  ))}
                </ul>
                <Btn onClick={() => user ? setModal("book") : setModal("login")}>Book This Service</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Portfolio Page ─────────────────────────────────────────────────────────────
function PortfolioPage({ portfolioImages }) {
  const [activeTab, setActiveTab] = useState("portraits");
  const cats = ["portraits", "weddings", "events", "products"];

  return (
    <div style={{ paddingTop: 72 }}>
      <div style={{ background: "#0a0908", padding: "80px 40px 0", textAlign: "center" }}>
        <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>Our Work</p>
        <h1 style={{ fontSize: "clamp(36px,5vw,64px)", color: "var(--cream)", marginBottom: 40 }}>Portfolio Gallery</h1>
        <div style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
          {cats.map(c => (
            <button key={c} onClick={() => setActiveTab(c)}
              style={{
                background: activeTab === c ? "var(--gold)" : "transparent",
                color: activeTab === c ? "#0d0d0d" : "var(--muted)",
                border: "none", padding: "12px 28px", cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
                transition: "all .2s",
              }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background: "#0a0908", padding: "2px 2px 100px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 2, animation: "fadeIn .4s ease" }}>
          {(portfolioImages[activeTab] || []).map((src, i) => (
            <div key={i} style={{ overflow: "hidden", position: "relative", height: 320 }}>
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s" }}
                onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
                onMouseLeave={e => e.target.style.transform = "scale(1)"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Profile Page ───────────────────────────────────────────────────────────────
function ProfilePage() {
  const skills = ["Portrait Photography", "Wedding & Events", "Commercial & Product", "Photo Retouching", "Color Grading", "Adobe Lightroom", "Adobe Photoshop", "Drone Photography"];
  const achievements = [
    { year: "2024", title: "Best Wedding Photographer — National Photography Awards" },
    { year: "2023", title: "Featured in Vogue Photography Issue" },
    { year: "2022", title: "500+ 5-Star Client Reviews Milestone" },
    { year: "2020", title: "Top 10 Portrait Photographers — Photography Magazine" },
    { year: "2019", title: "Solo Exhibition — The Light Within, New York" },
  ];
  return (
    <div style={{ paddingTop: 72 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a1200,#0d0d0d)", padding: "80px 40px 60px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80" alt="photographer" style={{ width: 180, height: 180, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--gold)" }} />
            <div style={{ position: "absolute", bottom: 8, right: 8, background: "#1e6b3d", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✓</div>
          </div>
          <div>
            <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>Professional Photographer</p>
            <h1 style={{ fontSize: "clamp(32px,4vw,52px)", color: "var(--cream)", marginBottom: 12 }}>Alexandra Reeves</h1>
            <p style={{ color: "var(--muted)", marginBottom: 20, maxWidth: 500, lineHeight: 1.7 }}>Based in New York · 12 Years of Experience · 500+ Happy Clients</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["Instagram", "Behance", "LinkedIn", "500px"].map(s => (
                <span key={s} style={{ background: "var(--glass)", border: "1px solid var(--border)", borderRadius: 2, padding: "6px 14px", fontSize: 12, color: "var(--cream)", backdropFilter: "blur(4px)" }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Details */}
      <div style={{ background: "var(--ink)", padding: "60px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
          <div>
            <h2 style={{ fontSize: 30, color: "var(--cream)", marginBottom: 20 }}>About</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.85, marginBottom: 16 }}>Alexandra is an internationally recognized photographer whose work spans editorial, commercial, and fine-art photography. Her images have appeared in major publications and campaigns worldwide.</p>
            <p style={{ color: "var(--muted)", lineHeight: 1.85 }}>Her approach combines technical mastery with an intuitive sense of light, moment, and emotion — creating images that feel both crafted and utterly authentic.</p>

            <h3 style={{ fontSize: 22, color: "var(--cream)", marginTop: 36, marginBottom: 16 }}>Skills & Expertise</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {skills.map(s => (
                <span key={s} style={{ background: "rgba(201,168,76,.1)", border: "1px solid var(--border)", color: "var(--gold)", fontSize: 12, letterSpacing: 1, padding: "6px 12px", borderRadius: 2 }}>{s}</span>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 30, color: "var(--cream)", marginBottom: 20 }}>Achievements</h2>
            {achievements.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, letterSpacing: 2, color: "var(--gold)", minWidth: 44, marginTop: 2 }}>{a.year}</span>
                <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
                  <p style={{ color: "var(--cream)", fontSize: 14, lineHeight: 1.5 }}>{a.title}</p>
                </div>
              </div>
            ))}

            <h3 style={{ fontSize: 22, color: "var(--cream)", marginTop: 32, marginBottom: 16 }}>Contact</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["📧", "hello@lenscraft.studio"], ["📞", "+1 (212) 555-0192"], ["📍", "New York, NY 10001"]].map(([icon, val]) => (
                <div key={val} style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 14 }}>
                  <span>{icon}</span><span>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reviews Page ──────────────────────────────────────────────────────────────
function ReviewsPage({ reviews, setReviews, user, setModal, showToast }) {
  const [form, setForm] = useState({ rating: 5, text: "", service: "" });
  const [showForm, setShowForm] = useState(false);

  const avg = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);

  const submit = () => {
    if (!form.text.trim() || !form.service) { showToast("Please fill all fields", "error"); return; }
    setReviews(prev => [...prev, { id: Date.now(), user: user.name, rating: form.rating, text: form.text, service: form.service, date: new Date().toISOString().slice(0, 10) }]);
    setForm({ rating: 5, text: "", service: "" });
    setShowForm(false);
    showToast("Review submitted! Thank you.");
  };

  return (
    <div style={{ paddingTop: 72 }}>
      <div style={{ background: "#0a0908", padding: "80px 40px 60px", textAlign: "center" }}>
        <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>Client Feedback</p>
        <h1 style={{ fontSize: "clamp(36px,5vw,64px)", color: "var(--cream)", marginBottom: 16 }}>Reviews & Ratings</h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <span style={{ fontSize: 48, fontFamily: "'Cormorant Garamond',serif", color: "var(--gold)" }}>{avg}</span>
          <div>
            <div style={{ color: "var(--gold)", fontSize: 20 }}>{"★".repeat(5)}</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>{reviews.length} reviews</div>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--ink)", padding: "60px 40px 100px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
            {user ? (
              <Btn onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Write a Review"}</Btn>
            ) : (
              <Btn variant="outline" onClick={() => setModal("login")}>Sign In to Review</Btn>
            )}
          </div>

          {showForm && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", padding: "32px", borderRadius: 2, marginBottom: 36 }}>
              <h3 style={{ fontSize: 22, color: "var(--cream)", marginBottom: 24 }}>Share Your Experience</h3>
              <Select label="Service" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required
                options={["Wedding Photography","Portrait Session","Event Coverage","Product Photography","Photo Editing","Brand Collaboration"].map(s => ({ value: s, label: s }))} />
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>Rating</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setForm({ ...form, rating: n })}
                      style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", color: n <= form.rating ? "var(--gold)" : "var(--border)" }}>★</button>
                  ))}
                </div>
              </div>
              <Input label="Your Review" type="textarea" value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Share your experience..." required />
              <Btn onClick={submit}>Submit Review</Btn>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "24px 28px", borderRadius: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--cream)" }}>{r.user}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 12 }}>· {r.service}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--gold)" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{r.date}</span>
                  </div>
                </div>
                <p style={{ color: "rgba(245,240,232,.8)", fontSize: 14, lineHeight: 1.75, fontStyle: "italic" }}>"{r.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Collaboration Page ─────────────────────────────────────────────────────────
function CollabPage({ collabs, setCollabs, user, setModal, showToast }) {
  const [form, setForm] = useState({ brand: "", type: "", budget: "", details: "", contact: "" });

  const submit = () => {
    if (!form.brand || !form.type || !form.details) { showToast("Please fill required fields", "error"); return; }
    setCollabs(prev => [...prev, { id: Date.now(), ...form, user: user.email, status: "pending", submitted: new Date().toISOString().slice(0, 10) }]);
    setForm({ brand: "", type: "", budget: "", details: "", contact: "" });
    showToast("Collaboration request submitted! We'll be in touch soon.");
  };

  return (
    <div style={{ paddingTop: 72 }}>
      <div style={{ position: "relative", background: "#0a0908", padding: "80px 40px 60px", overflow: "hidden" }}>
        <img src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&q=80" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(.2)", pointerEvents: "none" }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>Work With Us</p>
          <h1 style={{ fontSize: "clamp(36px,5vw,64px)", color: "var(--cream)", marginBottom: 16 }}>Collaborate & Promote</h1>
          <p style={{ color: "var(--muted)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>Are you a brand, creator, or influencer? Let's create something extraordinary together.</p>
        </div>
      </div>

      <div style={{ background: "var(--ink)", padding: "60px 40px 100px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }}>
          <div>
            <h2 style={{ fontSize: 32, color: "var(--cream)", marginBottom: 20 }}>Why Collaborate?</h2>
            {[
              { icon: "📸", title: "Brand Photography", desc: "Elevate your brand identity with studio-quality visuals." },
              { icon: "🎯", title: "Campaign Shoots", desc: "Product launches, seasonal campaigns, and lookbooks." },
              { icon: "📱", title: "Social Content", desc: "Content optimised for Instagram, TikTok, and beyond." },
              { icon: "🌟", title: "Influencer Packages", desc: "Special rates for content creators and micro-influencers." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 24, minWidth: 40 }}>{item.icon}</div>
                <div>
                  <h4 style={{ fontSize: 17, color: "var(--cream)", marginBottom: 4 }}>{item.title}</h4>
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "36px 32px", borderRadius: 2 }}>
            <h3 style={{ fontSize: 26, color: "var(--cream)", marginBottom: 24 }}>Send a Request</h3>
            {user ? (
              <>
                <Input label="Brand / Creator Name *" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Your brand or handle" />
                <Select label="Collaboration Type *" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  options={["Brand Photography","Product Campaign","Social Media Content","Influencer Package","Event Partnership","Other"].map(s => ({ value: s, label: s }))} />
                <Input label="Estimated Budget" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="e.g. $500–$1,000" />
                <Input label="Project Details *" type="textarea" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Tell us about your vision, goals, and timeline..." required />
                <Input label="Contact Email" type="email" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="your@email.com" />
                <Btn onClick={submit} style={{ width: "100%", textAlign: "center" }}>Submit Request</Btn>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <p style={{ color: "var(--muted)", marginBottom: 24 }}>Please sign in to submit a collaboration request.</p>
                <Btn onClick={() => setModal("login")}>Sign In</Btn>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Admin Page ────────────────────────────────────────────────────────────────
function AdminPage({ bookings, setBookings, reviews, setReviews, collabs, portfolioImages, setPortfolioImages, showToast }) {
  const [tab, setTab] = useState("bookings");
  const [newImgUrl, setNewImgUrl] = useState("");
  const [newImgCat, setNewImgCat] = useState("portraits");

  const updateStatus = (id, status) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    showToast("Booking updated.");
  };

  const deleteReview = id => {
    setReviews(prev => prev.filter(r => r.id !== id));
    showToast("Review removed.");
  };

  const addImage = () => {
    if (!newImgUrl.trim()) return;
    setPortfolioImages(prev => ({ ...prev, [newImgCat]: [...(prev[newImgCat] || []), newImgUrl] }));
    setNewImgUrl("");
    showToast("Image added to portfolio.");
  };

  const tabs = ["bookings", "reviews", "collabs", "portfolio"];

  return (
    <div style={{ paddingTop: 72 }}>
      <div style={{ background: "#0a0908", padding: "60px 40px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>Admin Panel</p>
          <h1 style={{ fontSize: "clamp(28px,4vw,48px)", color: "var(--cream)", marginBottom: 32 }}>Manage Your Studio</h1>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 40 }}>
            {[
              { label: "Total Bookings", val: bookings.length, icon: "📅" },
              { label: "Pending", val: bookings.filter(b => b.status === "pending").length, icon: "⏳" },
              { label: "Reviews", val: reviews.length, icon: "⭐" },
              { label: "Collabs", val: collabs.length, icon: "🤝" },
            ].map((s, i) => (
              <div key={i} style={{ background: "var(--glass)", border: "1px solid var(--border)", padding: "20px 24px", borderRadius: 2, backdropFilter: "blur(4px)" }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontFamily: "'Cormorant Garamond',serif", color: "var(--gold)" }}>{s.val}</div>
                <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ background: tab === t ? "var(--gold)" : "transparent", color: tab === t ? "#0d0d0d" : "var(--muted)", border: "1px solid var(--border)", borderBottom: "none", padding: "10px 24px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", transition: "all .2s", borderRadius: "2px 2px 0 0" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--ink)", padding: "0 40px 100px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", borderTop: "1px solid var(--gold)", paddingTop: 36 }}>
          {/* BOOKINGS */}
          {tab === "bookings" && (
            <div>
              <h2 style={{ fontSize: 26, color: "var(--cream)", marginBottom: 24 }}>All Bookings</h2>
              {bookings.length === 0 ? <p style={{ color: "var(--muted)" }}>No bookings yet.</p> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Client", "Service", "Date", "Location", "Status", "Actions"].map(h => (
                          <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", fontWeight: 400 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "14px 16px", color: "var(--cream)" }}>{b.user}</td>
                          <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{b.service}</td>
                          <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{b.date}</td>
                          <td style={{ padding: "14px 16px", color: "var(--muted)" }}>{b.location || "—"}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: b.status === "confirmed" ? "rgba(30,107,61,.3)" : b.status === "cancelled" ? "rgba(192,57,43,.3)" : "rgba(201,168,76,.15)", color: b.status === "confirmed" ? "#4caf82" : b.status === "cancelled" ? "#e74c3c" : "var(--gold)", padding: "3px 10px", borderRadius: 2, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>{b.status}</span>
                          </td>
                          <td style={{ padding: "14px 16px", display: "flex", gap: 8 }}>
                            <Btn variant="ghost" onClick={() => updateStatus(b.id, "confirmed")} style={{ padding: "5px 12px", fontSize: 10 }}>Confirm</Btn>
                            <Btn variant="danger" onClick={() => updateStatus(b.id, "cancelled")} style={{ padding: "5px 12px", fontSize: 10 }}>Cancel</Btn>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* REVIEWS */}
          {tab === "reviews" && (
            <div>
              <h2 style={{ fontSize: 26, color: "var(--cream)", marginBottom: 24 }}>Reviews</h2>
              {reviews.map(r => (
                <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "20px 24px", borderRadius: 2, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div>
                    <div style={{ color: "var(--gold)", marginBottom: 4 }}>{"★".repeat(r.rating)} <span style={{ color: "var(--muted)", fontSize: 13, marginLeft: 8 }}>{r.user} · {r.service}</span></div>
                    <p style={{ color: "var(--cream)", fontSize: 14 }}>"{r.text}"</p>
                  </div>
                  <Btn variant="danger" onClick={() => deleteReview(r.id)} style={{ padding: "6px 14px", fontSize: 11, flexShrink: 0 }}>Remove</Btn>
                </div>
              ))}
            </div>
          )}

          {/* COLLABS */}
          {tab === "collabs" && (
            <div>
              <h2 style={{ fontSize: 26, color: "var(--cream)", marginBottom: 24 }}>Collaboration Requests</h2>
              {collabs.length === 0 ? <p style={{ color: "var(--muted)" }}>No requests yet.</p> : (
                collabs.map(c => (
                  <div key={c.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "20px 24px", borderRadius: 2, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <h4 style={{ color: "var(--cream)", fontSize: 16 }}>{c.brand}</h4>
                      <span style={{ color: "var(--gold)", fontSize: 12 }}>{c.type}</span>
                    </div>
                    <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 6 }}>{c.details}</p>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{c.user} · {c.submitted}{c.budget ? ` · Budget: ${c.budget}` : ""}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PORTFOLIO */}
          {tab === "portfolio" && (
            <div>
              <h2 style={{ fontSize: 26, color: "var(--cream)", marginBottom: 24 }}>Portfolio Images</h2>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "24px", borderRadius: 2, marginBottom: 32 }}>
                <h3 style={{ fontSize: 18, color: "var(--cream)", marginBottom: 20 }}>Add New Image</h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <input value={newImgUrl} onChange={e => setNewImgUrl(e.target.value)} placeholder="Image URL (Unsplash or direct link)"
                    style={{ flex: 2, minWidth: 200, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 2, padding: "10px 14px", color: "var(--cream)", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none" }} />
                  <select value={newImgCat} onChange={e => setNewImgCat(e.target.value)}
                    style={{ flex: 1, minWidth: 140, background: "#1a1710", border: "1px solid var(--border)", borderRadius: 2, padding: "10px 14px", color: "var(--cream)", fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: "none" }}>
                    {["portraits", "weddings", "events", "products"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Btn onClick={addImage}>Add Image</Btn>
                </div>
              </div>
              {Object.entries(portfolioImages).map(([cat, imgs]) => (
                <div key={cat} style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 18, color: "var(--gold)", textTransform: "capitalize", marginBottom: 12, letterSpacing: 2 }}>{cat} ({imgs.length})</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8 }}>
                    {imgs.map((src, i) => (
                      <div key={i} style={{ position: "relative", height: 100 }}>
                        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2 }} />
                        <button onClick={() => setPortfolioImages(prev => ({ ...prev, [cat]: prev[cat].filter((_, j) => j !== i) }))}
                          style={{ position: "absolute", top: 4, right: 4, background: "rgba(192,57,43,.8)", border: "none", color: "#fff", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── My Bookings ───────────────────────────────────────────────────────────────
function MyBookings({ bookings }) {
  return (
    <div style={{ paddingTop: 72 }}>
      <div style={{ background: "#0a0908", padding: "80px 40px 60px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 12 }}>Your Account</p>
          <h1 style={{ fontSize: "clamp(28px,4vw,48px)", color: "var(--cream)", marginBottom: 40 }}>My Bookings</h1>
          {bookings.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>You haven't placed any bookings yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {bookings.map(b => (
                <div key={b.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "24px 28px", borderRadius: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    <h3 style={{ fontSize: 20, color: "var(--cream)" }}>{b.service}</h3>
                    <span style={{ background: b.status === "confirmed" ? "rgba(30,107,61,.3)" : b.status === "cancelled" ? "rgba(192,57,43,.3)" : "rgba(201,168,76,.15)", color: b.status === "confirmed" ? "#4caf82" : b.status === "cancelled" ? "#e74c3c" : "var(--gold)", padding: "4px 12px", borderRadius: 2, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>{b.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>📅 {b.date}</span>
                    {b.location && <span style={{ color: "var(--muted)", fontSize: 13 }}>📍 {b.location}</span>}
                  </div>
                  {b.notes && <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>📝 {b.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Auth Modals ───────────────────────────────────────────────────────────────
function LoginModal({ users, setUser, onClose, showToast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    const u = users.find(u => u.email === email && u.password === password);
    if (!u) { showToast("Invalid email or password", "error"); return; }
    setUser({ name: u.name, email: u.email, isAdmin: !!u.isAdmin });
    showToast(`Welcome back, ${u.name}!`);
    onClose();
  };

  return (
    <Modal title="Sign In" onClose={onClose}>
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
      <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
      <Btn onClick={submit} style={{ width: "100%", marginBottom: 16 }}>Sign In</Btn>
      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
        No account? <button onClick={() => { onClose(); /* handled outside */ }} style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 13 }}>Register here</button>
      </p>
      <div style={{ marginTop: 20, background: "rgba(201,168,76,.08)", border: "1px solid var(--border)", padding: "12px 16px", borderRadius: 2 }}>
        <p style={{ color: "var(--muted)", fontSize: 12 }}>🔑 Demo admin: admin@lens.com / admin123</p>
      </div>
    </Modal>
  );
}

function RegisterModal({ users, setUsers, setUser, onClose, showToast }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });

  const submit = () => {
    if (!form.name || !form.email || !form.password) { showToast("Please fill all fields", "error"); return; }
    if (form.password !== form.confirm) { showToast("Passwords do not match", "error"); return; }
    if (users.find(u => u.email === form.email)) { showToast("Email already registered", "error"); return; }
    const newUser = { name: form.name, email: form.email, password: form.password };
    setUsers(prev => [...prev, newUser]);
    setUser({ name: form.name, email: form.email, isAdmin: false });
    showToast(`Welcome, ${form.name}!`);
    onClose();
  };

  return (
    <Modal title="Create Account" onClose={onClose}>
      <Input label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Alexandra Smith" required />
      <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
      <Input label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Choose a strong password" required />
      <Input label="Confirm Password" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat password" required />
      <Btn onClick={submit} style={{ width: "100%" }}>Create Account</Btn>
    </Modal>
  );
}

// ── Book Modal ────────────────────────────────────────────────────────────────
function BookModal({ user, bookings, setBookings, onClose, showToast }) {
  const [form, setForm] = useState({ service: "", date: "", location: "", notes: "" });

  const submit = () => {
    if (!form.service || !form.date) { showToast("Please select a service and date", "error"); return; }
    setBookings(prev => [...prev, { id: Date.now(), user: user.email, ...form, status: "pending" }]);
    showToast("Booking submitted! We'll confirm soon.");
    onClose();
  };

  return (
    <Modal title="Book a Session" onClose={onClose}>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>Booking as <strong style={{ color: "var(--cream)" }}>{user?.name}</strong></p>
      <Select label="Type of Service *" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required
        options={["Wedding Photography","Portrait Session","Event Coverage","Product Photography","Photo Editing","Brand Collaboration"].map(s => ({ value: s, label: s }))} />
      <Input label="Preferred Date *" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
      <Input label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Studio, venue, or address" />
      <Input label="Additional Notes" type="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Tell us about your shoot, theme, or special requirements..." />
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>Reference Images (optional)</label>
        <input type="file" accept="image/*" multiple style={{ color: "var(--muted)", fontSize: 13 }} />
      </div>
      <Btn onClick={submit} style={{ width: "100%" }}>Confirm Booking</Btn>
    </Modal>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ setPage }) {
  return (
    <footer style={{ background: "#080706", borderTop: "1px solid var(--border)", padding: "60px 40px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "var(--cream)", letterSpacing: 3, fontStyle: "italic", marginBottom: 16 }}>LENSCRAFT</div>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8, maxWidth: 280 }}>Professional photography services — capturing moments that last forever. Based in New York, shooting worldwide.</p>
          </div>
          {[
            { title: "Services", links: ["Photoshoots", "Photo Editing", "Brand Collaboration", "Event Coverage"] },
            { title: "Navigate", links: ["Home", "Portfolio", "Reviews", "Collaborate"] },
            { title: "Connect", links: ["Instagram", "Behance", "LinkedIn", "Email Us"] },
          ].map((col, i) => (
            <div key={i}>
              <h4 style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>{col.title}</h4>
              {col.links.map(l => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <button onClick={() => col.title === "Navigate" && setPage(l.toLowerCase())}
                    style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 14, transition: "color .2s" }}
                    onMouseEnter={e => e.target.style.color = "var(--cream)"}
                    onMouseLeave={e => e.target.style.color = "var(--muted)"}>{l}</button>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>© 2025 LensCraft Studio. All rights reserved.</span>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>Crafted with light & precision.</span>
        </div>
      </div>
    </footer>
  );
}
