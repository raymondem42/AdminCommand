import { auth } from '@/auth';
import { getLicenses, getUsers } from '@/services/msGraph';
import Link from 'next/link';

const LICENSE_PRICES: Record<string, number> = {
  'SPE_E5': 57,
  'SPE_E3': 36,
  'SPE_E1': 10,
  'O365_BUSINESS_PREMIUM': 22,
  'O365_BUSINESS_ESSENTIALS': 6,
  'O365_BUSINESS': 8.25,
  'ENTERPRISEPACK': 36,
  'ENTERPRISEPREMIUM': 57,
  'DESKLESSPACK': 2.25,
  'TEAMS_ESSENTIALS': 4,
  'POWER_BI_PRO': 10,
  'PROJECTPREMIUM': 55,
  'VISIOCLIENT': 28,
  'MCOSTANDARD': 10,
};

const LICENSE_NAMES: Record<string, string> = {
  'SPE_E5': 'Microsoft 365 E5',
  'SPE_E3': 'Microsoft 365 E3',
  'SPE_E1': 'Microsoft 365 E1',
  'O365_BUSINESS_PREMIUM': 'Microsoft 365 Business Premium',
  'O365_BUSINESS_ESSENTIALS': 'Microsoft 365 Business Basic',
  'O365_BUSINESS': 'Microsoft 365 Apps for Business',
  'ENTERPRISEPACK': 'Office 365 E3',
  'ENTERPRISEPREMIUM': 'Office 365 E5',
  'DESKLESSPACK': 'Office 365 F3',
  'TEAMS_ESSENTIALS': 'Microsoft Teams Essentials',
  'POWER_BI_PRO': 'Power BI Pro',
  'PROJECTPREMIUM': 'Project Plan 5',
  'VISIOCLIENT': 'Visio Plan 2',
  'MCOSTANDARD': 'Skype for Business',
};

export default async function UnusedLicensesPage() {
  const session = await auth();
  const accessToken = (session as any)?.accessToken;

  let rows: {
    name: string;
    sku: string;
    total: number;
    used: number;
    unused: number;
    pricePerUnit: number;
    monthlyWaste: number;
  }[] = [];

  let totalWaste = 0;
  let error = null;

  try {
    const licenses = await getLicenses(accessToken);

    rows = (licenses.value || [])
      .map((sku: any) => {
        const total = sku.prepaidUnits?.enabled || 0;
        const used = sku.consumedUnits || 0;
        const unused = total - used;
        const price = LICENSE_PRICES[sku.skuPartNumber] ?? 0;
        const monthlyWaste = unused * price;
        return {
          name: LICENSE_NAMES[sku.skuPartNumber] ?? sku.skuPartNumber,
          sku: sku.skuPartNumber,
          total,
          used,
          unused,
          pricePerUnit: price,
          monthlyWaste,
        };
      })
      .filter((r: any) => r.total > 0)
      .sort((a: any, b: any) => b.monthlyWaste - a.monthlyWaste);

    totalWaste = rows.reduce((sum, r) => sum + r.monthlyWaste, 0);
  } catch (e: any) {
    error = e.message;
  }

  const unusedRows = rows.filter(r => r.unused > 0);
  const cleanRows = rows.filter(r => r.unused === 0);

  return (
    <div style={{ color: 'white', padding: '48px 0', maxWidth: 900 }}>
      <Link href="/reports" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
        ← Reports
      </Link>

      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Unused Licenses</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>
          Licenses your organization is paying for that aren't assigned to anyone.
        </p>
      </div>

      {error ? (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '16px 20px', color: '#FCA5A5', fontSize: 14 }}>
          Failed to load license data: {error}
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Monthly Waste', value: `$${totalWaste.toLocaleString()}`, sub: 'estimated per month', color: totalWaste > 0 ? '#F87171' : '#34D399' },
              { label: 'Annual Waste', value: `$${(totalWaste * 12).toLocaleString()}`, sub: 'estimated per year', color: totalWaste > 0 ? '#F87171' : '#34D399' },
              { label: 'Unused Licenses', value: unusedRows.reduce((s, r) => s + r.unused, 0).toString(), sub: 'across all plans', color: 'white' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '20px 22px'
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{stat.label}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: stat.color, letterSpacing: '-0.03em' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Unused licenses table */}
          {unusedRows.length > 0 ? (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Wasted Spend</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px 80px 120px',
                  gap: 16,
                  padding: '10px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  <span>License</span>
                  <span style={{ textAlign: 'right' }}>Total</span>
                  <span style={{ textAlign: 'right' }}>Used</span>
                  <span style={{ textAlign: 'right' }}>Unused</span>
                  <span style={{ textAlign: 'right' }}>Monthly Cost</span>
                </div>

                {unusedRows.map((row, i) => (
                  <div key={row.sku} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px 80px 120px',
                    gap: 16,
                    padding: '14px 20px',
                    borderBottom: i < unusedRows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{row.name}</div>
                      {row.pricePerUnit > 0 && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>${row.pricePerUnit}/user/mo</div>
                      )}
                    </div>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>{row.total}</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>{row.used}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#F87171', textAlign: 'right' }}>{row.unused}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: row.monthlyWaste > 0 ? '#F87171' : 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
                      {row.monthlyWaste > 0 ? `$${row.monthlyWaste.toLocaleString()}/mo` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12, padding: '20px 24px', marginBottom: 32, color: '#6EE7B7', fontSize: 14 }}>
              No unused licenses found. All licenses are assigned.
            </div>
          )}

          {/* Clean licenses */}
          {cleanRows.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Fully Utilized</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                {cleanRows.map((row, i) => (
                  <div key={row.sku} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px 80px 120px',
                    gap: 16,
                    padding: '12px 20px',
                    borderBottom: i < cleanRows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>{row.name}</div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>{row.total}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>{row.used}</span>
                    <span style={{ fontSize: 13, color: '#34D399', textAlign: 'right' }}>0</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'right' }}>—</span>
                  </div>
                ))}
              </div>
            </div>
          )}

{/* Fix action CTA */}
          {unusedRows.length > 0 && (
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Fix this
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <Link href="/actions/find-unused-licenses" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 22px', borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(251,191,36,0.03))',
                  border: '1px solid rgba(251,191,36,0.2)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FBBF24', marginBottom: 4 }}>
                      Find Unused Licenses
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                      Run the action to get a detailed breakdown and remove unused seats directly from AdminCommand.
                    </div>
                  </div>
                  <div style={{ fontSize: 18, color: 'rgba(251,191,36,0.4)', flexShrink: 0, marginLeft: 16 }}>→</div>
                </div>
              </Link>

              <Link href="/actions/remove-licenses-disabled" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 22px', borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.05), rgba(251,191,36,0.02))',
                  border: '1px solid rgba(251,191,36,0.12)',
                  cursor: 'pointer',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FBBF24', marginBottom: 4 }}>
                      Remove Licenses from Disabled Users
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                      Automatically removes paid licenses from every disabled account in your tenant.
                    </div>
                  </div>
                  <div style={{ fontSize: 18, color: 'rgba(251,191,36,0.4)', flexShrink: 0, marginLeft: 16 }}>→</div>
                </div>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}