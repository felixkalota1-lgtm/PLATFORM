import { useState, useEffect } from 'react'
import { useWorkloadTheme } from '../contexts/WorkloadThemeContext'
import { emailInquiryService, EmailInquiry } from '../services/emailInquiryAIService'
import { Mail, Send, CheckCircle, Clock, TrendingUp, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AIEmailAssistant() {
  const { theme } = useWorkloadTheme()
  const [inquiries, setInquiries] = useState<EmailInquiry[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<EmailInquiry | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [testEmail, setTestEmail] = useState({
    senderEmail: 'customer@example.com',
    senderName: 'John Smith',
    subject: 'Inquiry about Office Chairs - Bulk Order',
    body: 'Hi, we are interested in your Office Chairs product. We need about 100 units for our office. Can you provide pricing and availability information? Our company is Smith & Co.',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allInquiries = emailInquiryService.getAllInquiries()
    setInquiries(allInquiries)
    setStats(emailInquiryService.getStatistics())
  }

  const handleSimulateEmail = async () => {
    try {
      // Analyze the inquiry
      const analysis = await emailInquiryService.analyzeInquiry(
        testEmail.senderEmail,
        testEmail.senderName,
        testEmail.subject,
        testEmail.body
      )

      // Generate AI response (simulating stock available)
      const aiResponse = await emailInquiryService.generateResponse(
        {
          id: Date.now().toString(),
          senderEmail: testEmail.senderEmail,
          senderName: testEmail.senderName,
          subject: testEmail.subject,
          body: testEmail.body,
          receivedAt: new Date(),
          productRequested: analysis.productRequested,
          quantity: analysis.quantity,
          inquiryType: analysis.inquiryType,
          status: 'pending',
          isAutomated: false,
        },
        true,
        {
          sku: 'CHAIR-001',
          quantity: 150,
          price: 299.99,
          leadTime: '5-7 business days',
        }
      )

      const newInquiry: EmailInquiry = {
        id: Date.now().toString(),
        senderEmail: testEmail.senderEmail,
        senderName: testEmail.senderName,
        subject: testEmail.subject,
        body: testEmail.body,
        receivedAt: new Date(),
        productRequested: analysis.productRequested,
        quantity: analysis.quantity,
        inquiryType: analysis.inquiryType,
        status: 'pending',
        aiResponse,
        isAutomated: false,
      }

      emailInquiryService.storeInquiry(newInquiry)
      loadData()
      setSelectedInquiry(newInquiry)
      toast.success('📧 Email inquiry processed and analyzed!')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to process email')
    }
  }

  const handleSendResponse = (inquiryId: string) => {
    emailInquiryService.updateInquiryStatus(inquiryId, 'responded')
    loadData()
    toast.success('✅ Response sent to customer!')
  }

  const handleCopyResponse = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'responded':
        return { emoji: '✅', label: 'Responded', color: theme.colors.success }
      case 'pending':
        return { emoji: '⏳', label: 'Pending', color: theme.colors.warning }
      case 'queued':
        return { emoji: '📋', label: 'Queued', color: theme.colors.info }
      default:
        return { emoji: '❌', label: 'Ignored', color: theme.colors.danger }
    }
  }

  return (
    <div className="min-h-screen p-6" style={{ background: theme.gradients.bg, color: theme.colors.text }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: theme.colors.text }}>
            <Mail size={40} style={{ color: theme.colors.primary }} />
            AI Email Assistant
          </h1>
          <p style={{ color: theme.colors.textSecondary }}>
            Automatic inquiry processing and intelligent response generation
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div
              className="p-6 rounded-lg border-2"
              style={{ background: theme.colors.background, borderColor: theme.colors.border }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Mail size={20} style={{ color: theme.colors.primary }} />
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Total Inquiries
                </p>
              </div>
              <p className="text-3xl font-bold">{stats.totalInquiries}</p>
            </div>

            <div
              className="p-6 rounded-lg border-2"
              style={{ background: theme.colors.background, borderColor: theme.colors.border }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock size={20} style={{ color: theme.colors.warning }} />
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Pending
                </p>
              </div>
              <p className="text-3xl font-bold">{stats.pendingInquiries}</p>
            </div>

            <div
              className="p-6 rounded-lg border-2"
              style={{ background: theme.colors.background, borderColor: theme.colors.border }}
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle size={20} style={{ color: theme.colors.success }} />
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Automated
                </p>
              </div>
              <p className="text-3xl font-bold">{stats.automatedResponses}</p>
            </div>

            <div
              className="p-6 rounded-lg border-2"
              style={{ background: theme.colors.background, borderColor: theme.colors.border }}
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={20} style={{ color: theme.colors.accent }} />
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  Avg Response
                </p>
              </div>
              <p className="text-3xl font-bold">{stats.avgResponseTime}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Inquiry List */}
          <div
            className="lg:col-span-1 p-6 rounded-lg border-2"
            style={{ background: theme.colors.background, borderColor: theme.colors.border }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.text }}>
              <Mail size={24} />
              Inquiries
            </h2>

            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {inquiries.length === 0 ? (
                <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                  No inquiries yet. Create a test email below.
                </p>
              ) : (
                inquiries.map((inquiry) => {
                  const badge = getStatusBadge(inquiry.status)
                  return (
                    <button
                      key={inquiry.id}
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="w-full text-left p-3 rounded-lg transition-all"
                      style={{
                        background: selectedInquiry?.id === inquiry.id ? theme.colors.primary : theme.colors.surface,
                        color: selectedInquiry?.id === inquiry.id ? '#fff' : theme.colors.text,
                      }}
                    >
                      <p className="font-semibold text-sm">{inquiry.senderName}</p>
                      <p className="text-xs opacity-75 line-clamp-1">{inquiry.productRequested}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span style={{ fontSize: '12px' }}>{badge.emoji}</span>
                        <span className="text-xs">{badge.label}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <button
              onClick={handleSimulateEmail}
              className="w-full py-2 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ background: theme.colors.primary, color: '#fff' }}
            >
              + New Test Email
            </button>
          </div>

          {/* Inquiry Details & AI Response */}
          <div
            className="lg:col-span-2 p-6 rounded-lg border-2"
            style={{ background: theme.colors.background, borderColor: theme.colors.border }}
          >
            {selectedInquiry ? (
              <>
                {/* Customer Info */}
                <div className="mb-6 pb-6" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: theme.colors.text }}>
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p style={{ color: theme.colors.textSecondary }}>Name</p>
                      <p className="font-semibold">{selectedInquiry.senderName}</p>
                    </div>
                    <div>
                      <p style={{ color: theme.colors.textSecondary }}>Email</p>
                      <p className="font-semibold">{selectedInquiry.senderEmail}</p>
                    </div>
                    <div>
                      <p style={{ color: theme.colors.textSecondary }}>Product</p>
                      <p className="font-semibold">{selectedInquiry.productRequested}</p>
                    </div>
                    <div>
                      <p style={{ color: theme.colors.textSecondary }}>Quantity</p>
                      <p className="font-semibold">{selectedInquiry.quantity} units</p>
                    </div>
                  </div>
                </div>

                {/* Original Inquiry */}
                <div className="mb-6 pb-6" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  <h3 className="text-lg font-bold mb-3" style={{ color: theme.colors.text }}>
                    Original Inquiry
                  </h3>
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: theme.colors.surface }}
                  >
                    <p className="font-semibold mb-2">{selectedInquiry.subject}</p>
                    <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {selectedInquiry.body}
                    </p>
                  </div>
                </div>

                {/* AI Response */}
                {selectedInquiry.aiResponse && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>
                        🤖 AI Generated Response
                      </h3>
                      <button
                        onClick={() => handleCopyResponse(selectedInquiry.aiResponse!)}
                        className="p-2 rounded-lg transition-all hover:opacity-75"
                        style={{ background: theme.colors.border }}
                        title="Copy to clipboard"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                    <div
                      className="p-4 rounded-lg mb-4 whitespace-pre-wrap text-sm"
                      style={{ background: theme.colors.surface }}
                    >
                      {selectedInquiry.aiResponse}
                    </div>

                    {selectedInquiry.status !== 'responded' && (
                      <button
                        onClick={() => handleSendResponse(selectedInquiry.id)}
                        className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                        style={{ background: theme.colors.success, color: '#fff' }}
                      >
                        <Send size={20} />
                        Send Response
                      </button>
                    )}
                  </div>
                )}

                {selectedInquiry.status === 'responded' && (
                  <div className="flex items-center gap-2 p-4 rounded-lg" style={{ background: theme.colors.success + '20' }}>
                    <CheckCircle size={20} style={{ color: theme.colors.success }} />
                    <span style={{ color: theme.colors.success }}>
                      Response sent on {new Date(selectedInquiry.sentAt!).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p style={{ color: theme.colors.textSecondary }}>
                  Select an inquiry or create a new one to get started
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Test Email Form */}
        {inquiries.length === 0 && (
          <div
            className="mt-8 p-6 rounded-lg border-2"
            style={{ background: theme.colors.background, borderColor: theme.colors.border }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>
              📧 Test Email Template
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Customer Name"
                value={testEmail.senderName}
                onChange={(e) => setTestEmail({ ...testEmail, senderName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg"
                style={{ background: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}
              />
              <input
                type="email"
                placeholder="Customer Email"
                value={testEmail.senderEmail}
                onChange={(e) => setTestEmail({ ...testEmail, senderEmail: e.target.value })}
                className="w-full px-4 py-2 rounded-lg"
                style={{ background: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}
              />
              <input
                type="text"
                placeholder="Subject"
                value={testEmail.subject}
                onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
                className="w-full px-4 py-2 rounded-lg"
                style={{ background: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}
              />
              <textarea
                placeholder="Email Body"
                value={testEmail.body}
                onChange={(e) => setTestEmail({ ...testEmail, body: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 rounded-lg"
                style={{ background: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
