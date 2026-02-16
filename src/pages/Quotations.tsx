import React from 'react'

interface Product {
  id: string
  name: string
  partNumber: string
  price: number
  qty: number
  stock: string
  image?: string
  currency?: string
}

interface HistoryItem {
  id: string
  number: string
  date: string
  items: any[]
  createdAt: string
}

interface QuotationsProps {
  items: Product[]
  history?: HistoryItem[]
  onGeneratePDF?: () => void
  onSendEmail?: () => void
  onDeleteHistory?: (id: string) => void
}

export default function Quotations({ items, history = [], onGeneratePDF, onSendEmail, onDeleteHistory }: QuotationsProps) {
  const [selectedHistoryId, setSelectedHistoryId] = React.useState<string | null>(null)
  const [previewId, setPreviewId] = React.useState<string | null>(null)
  
  React.useEffect(() => {
    console.log(`Quotations component received - items: ${items.length}, history: ${history.length}`)
  }, [items, history])
  
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  }

  const formatCurrency = (value: number, currency?: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'ZWK' ? 'ZK' : currency === 'EUR' ? '€' : '£'
    return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '700', color: '#1a365d' }}>
          Quotations
        </h2>
        {items.length > 0 && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onGeneratePDF}
              style={{ padding: '10px 20px', background: '#5b7c99', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.25s ease' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#4a6fa5'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#5b7c99'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Generate & Download PDF
            </button>
            <button
              onClick={onSendEmail}
              style={{ padding: '10px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.25s ease' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#475569'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#64748b'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Send via Email
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        {items.length === 0 && history.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '60px', color: '#64748b' }}>
            <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px 0' }}>No quotations yet</p>
            <p style={{ fontSize: '13px', margin: '0', color: '#94a3b8' }}>Select products from the inventory and click "Add to Quotation" to create one</p>
          </div>
        ) : (
          <div>
            {items.length > 0 && (
              <>
                <div style={{ marginBottom: '28px' }}>
                  <h3 style={{ margin: '0 0 18px 0', fontSize: '18px', fontWeight: '700', color: '#5b7c99' }}>Quotation Items ({items.length})</h3>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#1a365d', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Product Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1a365d', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Part Number</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1a365d', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Unit Price</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1a365d', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Quantity</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1a365d', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Total</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1a365d', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                            <td style={{ padding: '16px', fontSize: '13px', color: '#1a365d', fontWeight: '500' }}>{item.name}</td>
                            <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>{item.partNumber}</td>
                            <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>{formatCurrency(item.price, item.currency)}</td>
                            <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{item.qty.toLocaleString()}</td>
                            <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#5b7c99', fontWeight: '700' }}>{formatCurrency(item.price * item.qty, item.currency)}</td>
                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 8px', borderRadius: '4px', background: item.stock === 'In Stock' ? '#dcfce7' : '#fee2e2', color: item.stock === 'In Stock' ? '#15803d' : '#dc2626' }}>
                                {item.stock}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary Section */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                        <strong>Total Items:</strong> {items.length}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                        <strong>Total Quantity:</strong> {items.reduce((sum, item) => sum + item.qty, 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '15px', color: '#5b7c99', fontWeight: '700', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #d0dce6' }}>
                        Quotation Total: {formatCurrency(calculateTotal(), items[0]?.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quotation History Section */}
            {history && history.length > 0 && (
              <div style={{ marginTop: '28px' }}>
                <h3 style={{ margin: '0 0 18px 0', fontSize: '18px', fontWeight: '700', color: '#5b7c99' }}>Previous Quotations ({history.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {history.map((histItem) => (
                    <div
                      key={histItem.id}
                      onClick={() => setSelectedHistoryId(selectedHistoryId === histItem.id ? null : histItem.id)}
                      style={{
                        padding: '16px',
                        border: '1px solid #d0dce6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: selectedHistoryId === histItem.id ? '#f0f4f8' : '#ffffff',
                        transition: 'all 0.2s ease',
                        boxShadow: selectedHistoryId === histItem.id ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none'
                      }}
                    >
                      <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1a365d', fontSize: '14px' }}>
                        {histItem.number}
                      </p>
                      <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '12px' }}>
                        {new Date(histItem.date).toLocaleDateString()} • {histItem.items.length} items
                      </p>
                      {selectedHistoryId === histItem.id && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewId(previewId === histItem.id ? null : histItem.id)
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 12px',
                              background: '#5b7c99',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            Preview
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onDeleteHistory) onDeleteHistory(histItem.id)
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 12px',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      
                      {/* Preview section */}
                      {previewId === histItem.id && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', maxHeight: '300px', overflowY: 'auto' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {histItem.items.map((item: any, idx: number) => (
                              <div key={idx} style={{ fontSize: '11px', color: '#64748b', padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>
                                <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1a365d' }}>{item.name}</p>
                                <p style={{ margin: '0 0 2px 0' }}>Part: {item.partNumber}</p>
                                <p style={{ margin: '0 0 2px 0' }}>Price: {formatCurrency(item.price, item.currency)}</p>
                                <p style={{ margin: '0', color: '#5b7c99', fontWeight: '600' }}>Qty: {item.qty} = {formatCurrency(item.price * item.qty, item.currency)}</p>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
                            <p style={{ margin: '0', fontSize: '12px', fontWeight: '700', color: '#5b7c99' }}>
                              Total: {formatCurrency(histItem.items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0), histItem.items[0]?.currency)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
