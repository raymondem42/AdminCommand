import Link from 'next/link';

const reports = [
  {
    href: '/reports/licenses',
    title: 'Unused Licenses',
    desc: "Licenses you're paying for that nobody is using",
    category: 'Cost & Licensing',
  },
  {
    href: '/reports/overprovisioned',
    title: 'Overprovisioned Users',
    desc: 'Users with E5 licenses who only need E3',
    category: 'Cost & Licensing',
  },
  {
    href: '/reports/shared-mailbox',
    title: 'Shared Mailbox Licenses',
    desc: 'Shared mailboxes incorrectly assigned paid licenses',
    category: 'Cost & Licensing',
  },
  {
    href: '/reports/mfa',
    title: 'MFA Coverage',
    desc: 'See who has multi-factor authentication enabled',
    category: 'Security',
  },
  {
    href: '/reports/guests',
    title: 'Guest Accounts',
    desc: 'Audit external users with access to your tenant',
    category: 'Security',
  },
  {
    href: '/reports/inactive',
    title: 'Inactive Users',
    desc: "Users who haven't signed in for 30+ days",
    category: 'Security',
  },
  {
    href: '/reports/admins',
    title: 'Admin Role Audit',
    desc: 'Every user with admin privileges in your tenant',
    category: 'Security',
  },
  {
    href: '/reports/password-expiry',
    title: 'Password Expiry',
    desc: 'Users with passwords expiring in the next 30 days',
    category: 'Compliance',
  },
  {
    href: '/reports/devices',
    title: 'Device Compliance',
    desc: 'Devices out of compliance with your policies',
    category: 'Compliance',
  },
];

const categories = [
  'All',
  'Cost & Licensing',
  'Security',
  'Compliance',
];

export default function ReportsPage() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1120,
        margin: '0 auto',
        padding: '40px 20px 72px',
        color: 'white',
      }}
    >
      <Link
        href="/"
        style={{
          textDecoration: 'none',
          color: 'rgba(255,255,255,0.38)',
          fontSize: 13,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 24,
        }}
      >
        <span>←</span>
        <span>Back</span>
      </Link>

      {/* Featured */}
      <Link href="/reports/savings-scan" style={{ textDecoration: 'none' }}>
        <div
          style={{
            borderRadius: 24,
            border: '1px solid rgba(255,255,255,0.08)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))',
            padding: '24px 22px',
            marginBottom: 28,
            boxShadow: '0 16px 40px rgba(0,0,0,0.20)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(96,165,250,0.10)',
              border: '1px solid rgba(96,165,250,0.16)',
              color: '#9CC4FF',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Featured
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <h1
                style={{
                  margin: '0 0 10px',
                  fontSize: 'clamp(28px, 5vw, 42px)',
                  lineHeight: 1.04,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: 'white',
                }}
              >
                Microsoft 365 Savings Scan
              </h1>

              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.52)',
                  maxWidth: 620,
                }}
              >
                Estimate wasted spend from unused licenses, overprovisioned users,
                and other licensing inefficiencies across your tenant. Full results
                unlock after subscription.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Subscription required
              </div>

              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: 18,
                }}
              >
                →
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: 22,
            fontWeight: 750,
            letterSpacing: '-0.03em',
          }}
        >
          All reports
        </h2>
        <p
          style={{
            margin: 0,
            color: 'rgba(255,255,255,0.45)',
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Browse savings, security, compliance, and tenant visibility reports.
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            minHeight: 52,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '0 16px',
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            placeholder="Search reports..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: 15,
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {categories.map((category, index) => (
            <button
              key={category}
              style={{
                height: 36,
                padding: '0 14px',
                borderRadius: 999,
                border:
                  index === 0
                    ? '1px solid rgba(96,165,250,0.18)'
                    : '1px solid rgba(255,255,255,0.08)',
                background:
                  index === 0
                    ? 'rgba(96,165,250,0.10)'
                    : 'rgba(255,255,255,0.04)',
                color: index === 0 ? '#9CC4FF' : 'rgba(255,255,255,0.72)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Report grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignSelf: 'flex-start',
                  padding: '5px 9px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.46)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {report.category}
              </div>

              <div
                style={{
                  fontSize: 15,
                  fontWeight: 650,
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                {report.title}
              </div>

              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: 'rgba(255,255,255,0.45)',
                  flex: 1,
                }}
              >
                {report.desc}
              </div>

              <div
                style={{
                  color: 'rgba(255,255,255,0.28)',
                  fontSize: 14,
                }}
              >
                Open →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}