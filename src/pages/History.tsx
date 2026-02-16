import React from 'react'

interface HistoryItem {
  id: string
  number: string
  date: string
  items: any[]
  createdAt: string
}

interface HistoryProps {
  type: 'quotation' | 'inquiry'
  items: HistoryItem[]
  onView: (item: HistoryItem) => void
  onDelete: (id: string) => void
}

export default function History({ type, items, onView, onDelete }: HistoryProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    console.log(`History component (${type}) mounted with ${items?.length || 0} items:`, items)
  }, [items, type])

  const filteredItems = items.filter(item =>
    item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.date.includes(searchTerm)
  )

  const selectedItem = selectedId ? items.find(i => i.id === selectedId) : null

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: '600px', gap: '0', background: '#ffffff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      {/* List */}
      <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minHeight: '600px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#1a365d' }}>
            {type === 'quotation' ? 'Quotation' : 'Inquiry'} History
          </h3>
          <input
            type="text"
            placeholder="Search by number or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
        </div>\n        <div style={{ flex: 1, overflow: 'auto', minHeight: '0' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ margin: '0', fontSize: '13px' }}>No {type}s found</p>
            </div>
          ) : (
            <div>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: selectedId === item.id ? '#f0f4f8' : '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedId !== item.id) e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== item.id) e.currentTarget.style.background = '#ffffff'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1a365d', fontSize: '13px' }}>
                    {item.number}
                  </p>
                  <p style={{ margin: '0', color: '#64748b', fontSize: '12px' }}>
                    {new Date(item.date).toLocaleDateString()} • {item.items.length} items
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', minHeight: '600px', overflow: 'hidden' }}>
        {selectedItem ? (
          <>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', color: '#1a365d' }}>
                {selectedItem.number}
              </h3>
              <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '13px' }}>
                Created: {new Date(selectedItem.createdAt).toLocaleString()}
              </p>
            </div>
            <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto', minHeight: '0' }}>
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#5b7c99' }}>
                  Items ({selectedItem.items.length})
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#1a365d' }}>
                        Product
                      </th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#1a365d' }}>
                        Qty
                      </th>
                      <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#1a365d' }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.items.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px', fontSize: '13px', color: '#1a365d' }}>
                          {item.name}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                          {item.qty}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', color: '#5b7c99', fontWeight: '600' }}>
                          {item.currency} {(item.price * item.qty).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ padding: '16px 32px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => onView(selectedItem)}
                style={{
                  padding: '10px 20px',
                  background: '#5b7c99',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4a6fa5'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#5b7c99'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                View/Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Delete this ' + type + '?')) {
                    onDelete(selectedItem.id)
                    setSelectedId(null)
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#b91c1c'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#dc2626'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
            <p style={{ margin: '0', fontSize: '14px' }}>Select a {type} to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
