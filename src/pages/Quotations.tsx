export default function Quotations() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
        <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '700', color: '#1a365d' }}>
          Quotations
        </h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        {/* Blank page - ready for quotation content */}
      </div>
    </div>
  )
}
