/**
 * Email Inquiry AI Service
 * Scans emails, extracts inquiries, generates AI responses
 */

export interface EmailInquiry {
  id: string
  senderEmail: string
  senderName: string
  subject: string
  body: string
  receivedAt: Date
  productRequested: string
  quantity: number
  inquiryType: 'pricing' | 'availability' | 'bulk_order' | 'general' | 'other'
  status: 'pending' | 'responded' | 'queued' | 'ignored'
  aiResponse?: string
  isAutomated: boolean
  sentAt?: Date
}

export interface InquiryAnalysis {
  productRequested: string
  quantity: number
  inquiryType: 'pricing' | 'availability' | 'bulk_order' | 'general' | 'other'
  urgency: 'low' | 'medium' | 'high'
  confidence: number
  extractedData: {
    companyName?: string
    budget?: string
    timeline?: string
    specificRequirements?: string
  }
}

class EmailInquiryAIService {
  /**
   * Analyze email content and extract inquiry details using AI
   */
  async analyzeInquiry(_senderEmail: string, _senderName: string, subject: string, body: string): Promise<InquiryAnalysis> {
    try {
      // Parse using pattern matching first
      const analysis = this.parseInquiryPatterns(subject, body)
      
      // For more advanced analysis, you'd call Hugging Face API
      // This is a foundation for future AI enhancement
      
      return analysis
    } catch (error) {
      console.error('Error analyzing inquiry:', error)
      throw new Error('Failed to analyze email inquiry')
    }
  }

  /**
   * Parse inquiry patterns from email content
   */
  private parseInquiryPatterns(subject: string, body: string): InquiryAnalysis {
    const text = `${subject} ${body}`.toLowerCase()

    // Extract product name
    const productMatch = body.match(/(?:product|item|about|interested in|looking for)\s+([a-z0-9\s-]+?)(?:\.|,|$)/i)
    const productRequested = productMatch ? productMatch[1].trim() : 'Unknown Product'

    // Extract quantity
    const quantityMatch = body.match(/(\d+)\s*(?:units|pieces|orders|qty|quantities)/i)
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1

    // Determine inquiry type
    let inquiryType: 'pricing' | 'availability' | 'bulk_order' | 'general' | 'other' = 'general'
    if (text.includes('price') || text.includes('cost') || text.includes('quote')) {
      inquiryType = 'pricing'
    } else if (text.includes('available') || text.includes('stock') || text.includes('in stock')) {
      inquiryType = 'availability'
    } else if (quantity > 50 || text.includes('bulk') || text.includes('wholesale')) {
      inquiryType = 'bulk_order'
    }

    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' = 'medium'
    if (text.includes('urgent') || text.includes('asap') || text.includes('today') || text.includes('tomorrow')) {
      urgency = 'high'
    } else if (text.includes('when available') || text.includes('eventually')) {
      urgency = 'low'
    }

    // Extract additional data
    const companyMatch = body.match(/(?:company|organization|from)\s+([a-z0-9\s&,.']+?)(?:\.|$)/i)
    const budgetMatch = body.match(/(?:budget|budget of|around|approximately)\s*\$?([\d,]+)/i)
    const timelineMatch = body.match(/(?:timeline|by|delivery|needed by|required by)\s+([^.]+)/i)

    return {
      productRequested,
      quantity,
      inquiryType,
      urgency,
      confidence: 0.85,
      extractedData: {
        companyName: companyMatch ? companyMatch[1].trim() : undefined,
        budget: budgetMatch ? `$${budgetMatch[1]}` : undefined,
        timeline: timelineMatch ? timelineMatch[1].trim() : undefined,
      },
    }
  }

  /**
   * Generate AI response based on inquiry and inventory
   */
  async generateResponse(inquiry: EmailInquiry, stockAvailable: boolean, inventoryDetails?: any): Promise<string> {
    let response = `Dear ${inquiry.senderName},\n\n`
    response += `Thank you for your interest in our ${inquiry.productRequested}!\n\n`

    if (stockAvailable) {
      response += this.generateAvailableResponse(inquiry, inventoryDetails)
    } else {
      response += this.generateUnavailableResponse(inquiry)
    }

    response += `\nBest regards,\nSales Team\nPlatform Sales & Procurement`

    return response
  }

  /**
   * Generate response when stock is available
   */
  private generateAvailableResponse(inquiry: EmailInquiry, inventoryDetails?: any): string {
    let response = `Great news! We have ${inquiry.productRequested} in stock and ready to ship.\n\n`

    if (inventoryDetails) {
      response += `Product Details:\n`
      response += `• SKU: ${inventoryDetails.sku || 'N/A'}\n`
      response += `• Available Quantity: ${inventoryDetails.quantity || 'Limited'}\n`
      response += `• Price: $${inventoryDetails.price || 'Contact for pricing'}\n`
      response += `• Delivery: ${inventoryDetails.leadTime || '2-3 business days'}\n\n`
    }

    response += `We can deliver your order of ${inquiry.quantity} units immediately. `
    response += `Would you like to proceed? Please reply with confirmation and shipping details.\n`

    if (inquiry.quantity >= 50) {
      response += `\nAs a bulk order, we're happy to offer a 10% discount. `
      response += `Please let us know if you'd like to discuss volume pricing.`
    }

    return response
  }

  /**
   * Generate response when stock is unavailable
   */
  private generateUnavailableResponse(inquiry: EmailInquiry): string {
    let response = `Unfortunately, ${inquiry.productRequested} is currently out of stock. `
    response += `However, we have the following options:\n\n`

    response += `1. Pre-order: We expect new stock within 2-3 weeks\n`
    response += `2. Alternative Products: We have similar items available\n`
    response += `3. Waitlist: Be notified immediately when back in stock\n\n`

    response += `Please let us know which option interests you, `
    response += `and we'll be happy to assist with your needs.`

    return response
  }

  /**
   * Store inquiry in localStorage (for demo)
   */
  storeInquiry(inquiry: EmailInquiry): void {
    const inquiries = this.getAllInquiries()
    inquiries.push(inquiry)
    localStorage.setItem('email_inquiries', JSON.stringify(inquiries))
  }

  /**
   * Get all stored inquiries
   */
  getAllInquiries(): EmailInquiry[] {
    try {
      const stored = localStorage.getItem('email_inquiries')
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.error('Error loading inquiries:', e)
      return []
    }
  }

  /**
   * Update inquiry status
   */
  updateInquiryStatus(id: string, status: EmailInquiry['status'], response?: string): void {
    const inquiries = this.getAllInquiries()
    const inquiry = inquiries.find(i => i.id === id)
    
    if (inquiry) {
      inquiry.status = status
      if (response) {
        inquiry.aiResponse = response
        inquiry.sentAt = new Date()
      }
      localStorage.setItem('email_inquiries', JSON.stringify(inquiries))
    }
  }

  /**
   * Get pending inquiries
   */
  getPendingInquiries(): EmailInquiry[] {
    return this.getAllInquiries().filter(i => i.status === 'pending')
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const inquiries = this.getAllInquiries()
    const responded = inquiries.filter(i => i.status === 'responded').length
    const automated = inquiries.filter(i => i.isAutomated).length
    const avgResponseTime = this.calculateAvgResponseTime(inquiries)

    return {
      totalInquiries: inquiries.length,
      pendingInquiries: inquiries.filter(i => i.status === 'pending').length,
      respondedInquiries: responded,
      automatedResponses: automated,
      avgResponseTime,
      conversionRate: inquiries.length > 0 ? (responded / inquiries.length) * 100 : 0,
    }
  }

  /**
   * Calculate average response time
   */
  private calculateAvgResponseTime(inquiries: EmailInquiry[]): string {
    const responded = inquiries.filter(i => i.sentAt)
    if (responded.length === 0) return 'N/A'

    const totalTime = responded.reduce((sum, i) => {
      const received = new Date(i.receivedAt).getTime()
      const sent = new Date(i.sentAt!).getTime()
      return sum + (sent - received)
    }, 0)

    const avgMs = totalTime / responded.length
    const avgMinutes = Math.round(avgMs / 60000)
    
    if (avgMinutes < 60) return `${avgMinutes}m`
    return `${Math.round(avgMinutes / 60)}h`
  }
}

export const emailInquiryService = new EmailInquiryAIService()
