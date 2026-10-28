import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Search,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  FileCheck2,
  Award,
} from 'lucide-react';

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */
const CONFIG = {
  productName: 'CampusAI',
  tagline: 'AI Study Assistant for College Students',
  collegeName: 'Apex Institute of Technology',
  collegeShort: 'AIT',
  authorName: 'Muskan',
  currentYear: 2026,
};

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Syllabus-grounded answers',
    description:
      'Every response is drawn exclusively from your department\'s lecture slides, notes, and past papers — not the open internet.',
  },
  {
    icon: Award,
    title: 'Exam-ready formatting',
    description:
      'Ask for 2, 5, or 10-mark answers. CampusAI adapts depth, structure, and citations to match your university\'s rubric.',
  },
  {
    icon: FileCheck2,
    title: 'Cited to the page',
    description:
      'Every claim links back to the exact source document and slide number, so you can verify before your exam.',
  },
];

const STEPS = [
  {
    number: '01',
    icon: BookOpen,
    title: 'Material pre-loaded by faculty',
    description:
      'Professors upload syllabus PDFs, lecture slides, and past exam papers once at the start of semester. No manual uploads for students.',
  },
  {
    number: '02',
    icon: Search,
    title: 'Ask in plain language',
    description:
      'Type your question in English or Hinglish. Pick a mark-weight (2 / 5 / 10 marks) or ask for a quick revision.',
  },
  {
    number: '03',
    icon: FileText,
    title: 'Get a structured, cited answer',
    description:
      'Receive an exam-ready answer formatted with headings, code, and tables — each point traced back to the original source.',
  },
];

const FAQS = [
  {
    q: 'Where do the answers come from?',
    a: 'Answers come exclusively from documents uploaded by your department faculty for each subject. Every answer cites the exact source filename and page/slide number so you can verify it directly.',
  },
  {
    q: "What if my question isn't in the course notes?",
    a: 'CampusAI will honestly reply that the topic was not found in the indexed material. It is strictly programmed never to invent facts or hallucinate outside the indexed syllabus.',
  },
  {
    q: 'Can I ask in Hindi or Hinglish?',
    a: 'Yes. Ask in Hinglish and CampusAI responds naturally while preserving technical terminology, pseudocode, and the academic structure required for exams.',
  },
  {
    q: 'Who manages the course material?',
    a: 'Professors and department administrators upload curated course packets once per semester. Students only need to ask questions — no file management required.',
  },
];

/* ==========================================================================
   SHARED STYLES
   ========================================================================== */
const SHARED_STYLES = `
  .lp-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 28px;
  }
  .lp-btn-primary {
    border-radius: 10px;
    border: none;
    background: var(--lp-primary);
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, transform 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-family: var(--lp-font-body);
  }
  .lp-btn-primary:hover {
    background: var(--lp-primary-hover);
    transform: translateY(-1px);
  }
  .lp-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 13px;
    border-radius: 99px;
    background: var(--lp-primary-soft);
    border: 1px solid var(--lp-border);
    color: var(--lp-primary);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .lp-section-eyebrow {
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--lp-highlight);
    margin: 0 0 12px 0;
  }
  .lp-section-heading {
    font-family: var(--lp-font-heading);
    font-size: clamp(1.65rem, 3.5vw, 2.4rem);
    font-weight: 600;
    color: var(--lp-text);
    letter-spacing: -0.03em;
    line-height: 1.2;
    margin: 0 0 14px 0;
  }
  .lp-section-sub {
    font-size: 15.5px;
    color: var(--lp-muted);
    line-height: 1.7;
    max-width: 520px;
    margin: 0 auto;
  }
  .lp-card {
    background: var(--lp-card);
    border: 1px solid var(--lp-border);
    box-shadow: var(--lp-shadow);
  }
  .lp-benefit-card {
    background: var(--lp-card);
    border: 1px solid var(--lp-border);
    border-radius: 16px;
    padding: 28px;
    box-shadow: var(--lp-shadow);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .lp-benefit-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }
  .lp-step-card {
    background: var(--lp-card);
    border: 1px solid var(--lp-border);
    border-radius: 16px;
    padding: 28px;
    box-shadow: var(--lp-shadow);
    height: 100%;
    box-sizing: border-box;
  }
  .lp-benefits-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .lp-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    position: relative;
  }
  .lp-chat-preview-wrap {
    animation: lp-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: 0.15s;
  }
  @keyframes lp-rise {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lp-nav-desktop {
    display: flex !important;
  }
  .lp-nav-mobile {
    display: none !important;
  }
  @media (max-width: 768px) {
    .lp-benefits-grid {
      grid-template-columns: 1fr;
    }
    .lp-steps-grid {
      grid-template-columns: 1fr;
    }
    .lp-nav-desktop {
      display: none !important;
    }
    .lp-nav-mobile {
      display: flex !important;
    }
    .lp-container {
      padding: 0 18px;
    }
  }
`;

/* ==========================================================================
   NAVBAR
   ========================================================================== */
function Navbar({ darkMode, setDarkMode, onStartStudying }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
        background: scrolled ? 'var(--lp-bg)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--lp-border)' : '1px solid transparent',
        boxShadow: scrolled ? 'var(--lp-shadow)' : 'none',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div className="lp-container" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--lp-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={18} strokeWidth={1.5} color="white" />
          </div>
          <span style={{
            fontFamily: 'var(--lp-font-heading)',
            fontWeight: 600, fontSize: 18,
            color: 'var(--lp-text)', letterSpacing: '-0.02em',
          }}>
            {CONFIG.productName}
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="lp-nav-desktop" style={{ gap: 32, alignItems: 'center' }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: 14, fontWeight: 500,
                color: 'var(--lp-muted)', textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--lp-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--lp-muted)')}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="lp-nav-desktop" style={{ alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
            style={{
              padding: '7px 8px', borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--lp-muted)', fontSize: 16,
              transition: 'color 0.15s',
            }}
          >
            {darkMode ? '☀' : '🌙'}
          </button>
          <button
            type="button"
            onClick={onStartStudying}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, color: 'var(--lp-text)',
              transition: 'color 0.15s', fontFamily: 'var(--lp-font-body)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--lp-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--lp-text)')}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={onStartStudying}
            className="lp-btn-primary"
            style={{ padding: '9px 20px', fontSize: 14 }}
          >
            Get Started
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="lp-nav-mobile" style={{ gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
            style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lp-muted)', fontSize: 16 }}
          >
            {darkMode ? '☀' : '🌙'}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lp-text)' }}
          >
            {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          borderTop: '1px solid var(--lp-border)',
          background: 'var(--lp-bg)',
          padding: '20px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block', padding: '13px 0',
                fontSize: 15, fontWeight: 500,
                color: 'var(--lp-text)', textDecoration: 'none',
                borderBottom: '1px solid var(--lp-border)',
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onStartStudying(); }}
              style={{
                padding: '12px', borderRadius: 10,
                border: '1px solid var(--lp-border)',
                background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 500, color: 'var(--lp-text)',
                fontFamily: 'var(--lp-font-body)',
              }}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onStartStudying(); }}
              className="lp-btn-primary"
              style={{ padding: 13, fontSize: 15 }}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ==========================================================================
   HERO
   ========================================================================== */
function Hero({ onStartStudying }) {
  return (
    <section style={{ padding: '80px 0 0', background: 'var(--lp-bg)', overflow: 'hidden' }}>
      <div className="lp-container">
        {/* Badge */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span className="lp-badge">
            <Sparkles size={12} strokeWidth={1.5} />
            Syllabus-Grounded RAG &middot; {CONFIG.collegeShort} Edition
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--lp-font-heading)',
          fontSize: 'clamp(2.2rem, 5vw, 3.75rem)',
          fontWeight: 600,
          color: 'var(--lp-text)',
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          textAlign: 'center',
          maxWidth: 760,
          margin: '0 auto',
        }}>
          Your professors&rsquo; notes,{' '}
          <span style={{ color: 'var(--lp-primary)' }}>answered instantly.</span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          marginTop: 20,
          fontSize: 17,
          lineHeight: 1.7,
          color: 'var(--lp-muted)',
          textAlign: 'center',
          maxWidth: 520,
          margin: '20px auto 0',
        }}>
          CampusAI answers exam questions directly from your course material &mdash;
          lecture slides, past papers, and lab notes &mdash; with the exact source cited.
        </p>

        {/* CTAs */}
        <div style={{
          marginTop: 36,
          display: 'flex', flexWrap: 'wrap', gap: 12,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <button
            type="button"
            onClick={onStartStudying}
            className="lp-btn-primary"
            style={{ padding: '13px 28px', fontSize: 15 }}
          >
            Start Studying
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
          <a
            href="#how-it-works"
            style={{
              padding: '13px 24px', borderRadius: 10,
              border: '1px solid var(--lp-border)',
              background: 'var(--lp-card)',
              fontSize: 15, fontWeight: 500,
              color: 'var(--lp-text)', textDecoration: 'none',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--lp-text)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--lp-border)')}
          >
            See how it works
          </a>
        </div>

        {/* Trust line */}
        <p style={{
          marginTop: 20, fontSize: 12.5,
          color: 'var(--lp-muted)', textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <ShieldCheck size={14} strokeWidth={1.5} style={{ color: 'var(--lp-primary)', flexShrink: 0 }} />
          Built for {CONFIG.collegeName} &middot; Department of Computer Science &amp; Engineering
        </p>

        {/* Chat Preview */}
        <div style={{ marginTop: 60, position: 'relative' }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
            background: 'linear-gradient(to bottom, transparent, var(--lp-bg))',
            zIndex: 2, pointerEvents: 'none',
          }} />
          <div className="lp-card lp-chat-preview-wrap" style={{
            maxWidth: 760, margin: '0 auto',
            overflow: 'hidden', borderRadius: '16px 16px 0 0',
          }}>
            {/* Window chrome */}
            <div style={{
              padding: '14px 18px', background: 'var(--lp-bg-alt)',
              borderBottom: '1px solid var(--lp-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {['#e06b6b', '#e0bc6b', '#6bd17d'].map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lp-text)', marginLeft: 4 }}>
                  {CONFIG.productName} &middot; DAA Unit 4
                </span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--lp-primary)',
                background: 'var(--lp-primary-soft)', padding: '2px 10px',
                borderRadius: 99, border: '1px solid var(--lp-border)',
              }}>
                Index Active
              </span>
            </div>

            {/* Messages */}
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* User bubble */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '80%', background: 'var(--lp-primary)', color: 'white',
                  borderRadius: '16px 16px 4px 16px',
                  padding: '10px 15px', fontSize: 13.5, fontWeight: 500, lineHeight: 1.5,
                }}>
                  Compare Prim&rsquo;s and Kruskal&rsquo;s MST algorithm for 5 marks
                </div>
              </div>

              {/* Assistant bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: 'var(--lp-primary-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <GraduationCap size={13} strokeWidth={1.5} style={{ color: 'var(--lp-primary)' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lp-text)' }}>CampusAI</span>
                  <span style={{
                    fontSize: 11, color: 'var(--lp-muted)',
                    background: 'var(--lp-bg-alt)', padding: '2px 8px',
                    borderRadius: 6, border: '1px solid var(--lp-border)',
                  }}>5-Marks Mode</span>
                </div>
                <div style={{
                  background: 'var(--lp-bg)', border: '1px solid var(--lp-border)',
                  borderRadius: '4px 16px 16px 16px', padding: '14px 16px',
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <p style={{ fontSize: 13, color: 'var(--lp-text)', fontWeight: 600, margin: 0 }}>
                    Both algorithms find a Minimum Spanning Tree for a connected weighted graph, but differ in their greedy selection strategy:
                  </p>
                  <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--lp-border)' }}>
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--lp-bg-alt)', borderBottom: '1px solid var(--lp-border)' }}>
                          {['Feature', "Prim's", "Kruskal's"].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--lp-text)', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['Approach', 'Grows from one vertex', 'Adds global min-edge'],
                          ['Data Struct', 'Priority Queue', 'Disjoint Set (DSU)'],
                          ['Time', 'O(E log V)', 'O(E log E)'],
                          ['Best For', 'Dense graphs', 'Sparse graphs'],
                        ].map(([a, b, c], i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--lp-border)', background: i % 2 === 1 ? 'var(--lp-bg-alt)' : 'transparent' }}>
                            <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--lp-text)', fontSize: 12 }}>{a}</td>
                            <td style={{ padding: '7px 10px', color: 'var(--lp-muted)', fontSize: 12 }}>{b}</td>
                            <td style={{ padding: '7px 10px', color: 'var(--lp-muted)', fontSize: 12 }}>{c}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4, borderTop: '1px solid var(--lp-border)' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 6,
                      background: 'var(--lp-primary-soft)', border: '1px solid var(--lp-border)',
                      fontSize: 11, fontWeight: 500, color: 'var(--lp-primary)',
                    }}>
                      <FileText size={11} strokeWidth={1.5} />
                      DAA_Unit4_MST.pptx &middot; Slide 12
                    </span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 6,
                      background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)',
                      fontSize: 11, fontWeight: 500, color: 'var(--lp-muted)',
                    }}>
                      Cormen CLRS &sect;23.2
                    </span>
                  </div>
                </div>
              </div>

              {/* Fake input bar */}
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
                background: 'var(--lp-bg-alt)', border: '1px solid var(--lp-border)',
                borderRadius: 10, padding: '10px 14px',
              }}>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--lp-muted)' }}>
                  Ask next: &ldquo;Write pseudocode for Kruskal&rsquo;s...&rdquo;
                </span>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, background: 'var(--lp-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <ArrowRight size={13} strokeWidth={2} color="white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   BENEFITS
   ========================================================================== */
function Benefits() {
  return (
    <section id="features" style={{ padding: '96px 0', background: 'var(--lp-bg)' }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p className="lp-section-eyebrow">Why CampusAI</p>
          <h2 className="lp-section-heading">Built for how university exams actually work</h2>
          <p className="lp-section-sub">
            Not a general-purpose chatbot. A study tool tuned for your department&rsquo;s syllabus, marking scheme, and exam format.
          </p>
        </div>

        <div className="lp-benefits-grid">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="lp-benefit-card">
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--lp-primary-soft)', border: '1px solid var(--lp-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Icon size={20} strokeWidth={1.5} style={{ color: 'var(--lp-primary)' }} />
                </div>
                <h3 style={{
                  fontFamily: 'var(--lp-font-heading)', fontSize: 18, fontWeight: 600,
                  color: 'var(--lp-text)', marginBottom: 10, letterSpacing: '-0.01em',
                }}>
                  {b.title}
                </h3>
                <p style={{ fontSize: 14.5, color: 'var(--lp-muted)', lineHeight: 1.7, margin: 0 }}>
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   HOW IT WORKS
   ========================================================================== */
function HowItWorks() {
  return (
    <section id="how-it-works" style={{
      padding: '96px 0', background: 'var(--lp-bg-alt)',
      borderTop: '1px solid var(--lp-border)', borderBottom: '1px solid var(--lp-border)',
    }}>
      <div className="lp-container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p className="lp-section-eyebrow">How It Works</p>
          <h2 className="lp-section-heading">Up and running from day one</h2>
          <p className="lp-section-sub">
            No uploads, no setup. Log in, select a subject, and start asking questions.
          </p>
        </div>

        <div className="lp-steps-grid">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="lp-step-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{
                    fontFamily: 'var(--lp-font-heading)', fontSize: 32, fontWeight: 700,
                    color: 'var(--lp-highlight)', lineHeight: 1, letterSpacing: '-0.03em',
                  }}>
                    {step.number}
                  </span>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'var(--lp-primary-soft)', border: '1px solid var(--lp-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} strokeWidth={1.5} style={{ color: 'var(--lp-primary)' }} />
                  </div>
                </div>
                <h3 style={{
                  fontFamily: 'var(--lp-font-heading)', fontSize: 17, fontWeight: 600,
                  color: 'var(--lp-text)', marginBottom: 10, letterSpacing: '-0.01em',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--lp-muted)', lineHeight: 1.7, margin: 0 }}>
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   FAQ
   ========================================================================== */
function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section id="faq" style={{ padding: '96px 0', background: 'var(--lp-bg)' }}>
      <div className="lp-container" style={{ maxWidth: 680 }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p className="lp-section-eyebrow">FAQ</p>
          <h2 className="lp-section-heading">Common questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                style={{
                  borderRadius: 12, overflow: 'hidden',
                  border: `1px solid ${isOpen ? 'var(--lp-primary)' : 'var(--lp-border)'}`,
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '18px 20px',
                    background: 'var(--lp-card)', border: 'none', cursor: 'pointer',
                    textAlign: 'left', gap: 12, fontFamily: 'var(--lp-font-body)',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--lp-text)', lineHeight: 1.4 }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={17} strokeWidth={1.5}
                    style={{
                      color: isOpen ? 'var(--lp-primary)' : 'var(--lp-muted)',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s, color 0.2s',
                      flexShrink: 0,
                    }}
                  />
                </button>
                {isOpen && (
                  <div style={{
                    padding: '16px 20px 20px', background: 'var(--lp-card)',
                    fontSize: 14.5, color: 'var(--lp-muted)', lineHeight: 1.75,
                    borderTop: '1px solid var(--lp-border)',
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   BOTTOM CTA
   ========================================================================== */
function BottomCTA({ onStartStudying }) {
  return (
    <section style={{
      padding: '80px 0', background: 'var(--lp-bg-alt)',
      borderTop: '1px solid var(--lp-border)',
    }}>
      <div className="lp-container" style={{ textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'var(--lp-font-heading)',
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 600, color: 'var(--lp-text)',
          letterSpacing: '-0.03em', maxWidth: 560,
          margin: '0 auto 16px', lineHeight: 1.2,
        }}>
          Stop searching through 500-page PDFs.
        </h2>
        <p style={{
          fontSize: 16, color: 'var(--lp-muted)',
          maxWidth: 400, margin: '0 auto 36px', lineHeight: 1.65,
        }}>
          Get exam-ready answers from your course material &mdash; with source citations &mdash; in seconds.
        </p>
        <button
          type="button"
          onClick={onStartStudying}
          className="lp-btn-primary"
          style={{ padding: '14px 32px', fontSize: 15 }}
        >
          Start Studying Free
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}

/* ==========================================================================
   FOOTER
   ========================================================================== */
function Footer() {
  return (
    <footer style={{
      background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border)',
      padding: '40px 0',
    }}>
      <div className="lp-container" style={{
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: 'var(--lp-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={15} strokeWidth={1.5} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--lp-font-heading)', fontWeight: 600, fontSize: 16, color: 'var(--lp-text)' }}>
            {CONFIG.productName}
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              style={{ fontSize: 13.5, color: 'var(--lp-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--lp-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--lp-muted)')}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p style={{ fontSize: 12.5, color: 'var(--lp-muted)', margin: 0 }}>
          &copy; {CONFIG.currentYear} {CONFIG.productName} &middot; Built by {CONFIG.authorName} for {CONFIG.collegeShort}
        </p>
      </div>
    </footer>
  );
}

/* ==========================================================================
   MAIN LANDING PAGE
   ========================================================================== */
export default function LandingPage({ onStartStudying }) {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('campusai_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('campusai_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('campusai_theme', 'light');
      }
    } catch (e) {
      console.warn('Could not save theme:', e);
    }
  }, [darkMode]);

  const handleStartStudying = () => {
    if (onStartStudying) onStartStudying();
  };

  return (
    <>
      <style>{SHARED_STYLES}</style>
      <div style={{
        minHeight: '100vh', background: 'var(--lp-bg)',
        color: 'var(--lp-text)', fontFamily: 'var(--lp-font-body)',
        WebkitFontSmoothing: 'antialiased', overflowX: 'hidden',
      }}>
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} onStartStudying={handleStartStudying} />
        <main>
          <Hero onStartStudying={handleStartStudying} />
          <Benefits />
          <HowItWorks />
          <FAQ />
          <BottomCTA onStartStudying={handleStartStudying} />
        </main>
        <Footer />
      </div>
    </>
  );
}
