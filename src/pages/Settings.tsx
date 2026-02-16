interface PDFTemplate {
  id: string
  name: string
  type: 'quotation' | 'inquiry'
  htmlContent: string
  companyName: string
  createdAt: string
  isDefault: boolean
}

interface SettingsProps {
  quotationTemplate: PDFTemplate | null
  inquiryTemplate: PDFTemplate | null
  onSaveTemplate: (template: PDFTemplate) => void
  onLoadTemplate: (type: 'quotation' | 'inquiry') => void
}

export default function Settings({ quotationTemplate, inquiryTemplate, onSaveTemplate, onLoadTemplate }: SettingsProps) {
  const [activeTab, setActiveTab] = React.useState<'quotation' | 'inquiry'>('quotation')
  const [companyName, setCompanyName] = React.useState(quotationTemplate?.companyName || '')
  const [showUpload, setShowUpload] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        if (!content.includes('{{TABLE_ROWS}}')) {
          alert('Template must include {{TABLE_ROWS}} placeholder')
          return
        }

        const template: PDFTemplate = {
          id: `custom-${activeTab}-${Date.now()}`,
          name: file.name.replace('.html', ''),
          type: activeTab,
          htmlContent: content,
          companyName,
          createdAt: new Date().toISOString(),
          isDefault: false
        }

        onSaveTemplate(template)
        setShowUpload(false)
        alert('Template uploaded successfully!')
      } catch (error) {
        alert('Error uploading template: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
        <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '700', color: '#1a365d' }}>
          Settings
        </h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '32px', borderBottom: '2px solid #e2e8f0' }}>
          {(['quotation', 'inquiry'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '16px 32px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #5b7c99' : 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '700' : '500',
                color: activeTab === tab ? '#5b7c99' : '#64748b',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) e.currentTarget.style.color = '#5b7c99'
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) e.currentTarget.style.color = '#64748b'
              }}
            >
              {tab === 'quotation' ? 'Quotation Template' : 'Inquiry Template'}
            </button>
          ))}
        </div>

        {/* Template Section */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1a365d' }}>
            Current Template
          </h3>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px 0', color: '#64748b' }}>
              <strong>Name:</strong> {activeTab === 'quotation' ? quotationTemplate?.name : inquiryTemplate?.name}
            </p>
            <p style={{ margin: '0 0 12px 0', color: '#64748b' }}>
              <strong>Type:</strong> {activeTab === 'quotation' ? 'Quotation' : 'Inquiry'}
            </p>
            <p style={{ margin: '0 0 12px 0', color: '#64748b' }}>
              <strong>Created:</strong> {new Date(activeTab === 'quotation' ? quotationTemplate?.createdAt! : inquiryTemplate?.createdAt!).toLocaleDateString()}
            </p>
            <p style={{ margin: '0', color: (activeTab === 'quotation' ? quotationTemplate?.isDefault : inquiryTemplate?.isDefault) ? '#16a34a' : '#64748b' }}>
              <strong>Status:</strong> {(activeTab === 'quotation' ? quotationTemplate?.isDefault : inquiryTemplate?.isDefault) ? 'Default' : 'Custom'}
            </p>
          </div>
        </div>

        {/* Company Name */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a365d', fontSize: '13px' }}>
            Company Name (shown on PDF)
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter your company name"
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Upload Template */}
        <div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            style={{
              padding: '12px 24px',
              background: '#5b7c99',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
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
            {showUpload ? 'Cancel' : 'Upload Custom Template'}
          </button>

          {showUpload && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              background: '#f0f9ff',
              border: '2px dashed #5b7c99',
              borderRadius: '8px'
            }}>
              <p style={{ margin: '0 0 12px 0', color: '#1a365d', fontSize: '14px', fontWeight: '600' }}>
                Upload HTML Template
              </p>
              <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13px' }}>
                Your template must include these placeholders:
              </p>
              <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', color: '#64748b', fontSize: '13px' }}>
                <li>&#123;&#123;NUMBER&#125;&#125; - Document number</li>
                <li>&#123;&#123;DATE&#125;&#125; - Document date</li>
                <li>&#123;&#123;USER&#125;&#125; - Prepared by username</li>
                <li>&#123;&#123;TABLE_ROWS&#125;&#125; - Product items table</li>
                <li>&#123;&#123;TOTAL&#125;&#125; - Grand total</li>
              </ul>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '10px 20px',
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Choose File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import React from 'react'
