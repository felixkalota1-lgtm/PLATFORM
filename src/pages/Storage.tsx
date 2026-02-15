export default function Storage() {
  const tiles = [
    { id: 1, title: 'Tile 1' },
    { id: 2, title: 'Tile 2' },
    { id: 3, title: 'Tile 3' },
    { id: 4, title: 'Tile 4' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
        <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '700', color: '#1a365d' }}>
          Storage
        </h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {tiles.map((tile) => (
            <div
              key={tile.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                minHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                e.currentTarget.style.borderColor = '#cbd5e1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.borderColor = '#e2e8f0'
              }}
            >
              <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#64748b' }}>
                {tile.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
