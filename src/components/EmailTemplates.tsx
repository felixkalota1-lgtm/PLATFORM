import React, { useState } from "react";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  description: string;
  category: "professional" | "casual" | "formal" | "personalized";
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "template-professional",
    name: "Professional",
    subject: "Quote Submission - {documentType}",
    description: "Clean and professional email template",
    category: "professional",
    htmlContent: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Document Submission</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">{documentType} - {currentDate}</p>
          </div>

          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">Dear {recipientName},</p>

            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
              We are pleased to submit the attached {documentType} for your review. This document contains detailed
              information about our proposal and pricing.
            </p>

            <div style="background: #f5f5f5; padding: 20px; border-left: 4px solid #667eea; margin: 30px 0;">
              <p style="margin: 0; font-size: 13px; color: #555;">
                <strong>Document Details:</strong><br>
                Date: {currentDate}<br>
                Type: {documentType}<br>
                Submitted by: {senderName}
              </p>
            </div>

            <p style="margin: 20px 0; font-size: 14px; line-height: 1.8;">
              Please review the attached document carefully. If you have any questions or require clarification,
              please don't hesitate to reach out.
            </p>

            <p style="margin: 20px 0 0 0; font-size: 14px;">
              Best regards,<br>
              <strong>{senderName}</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 20px 30px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888;">
            <p style="margin: 0;">This email was sent from Matrix Hub Platform</p>
            <p style="margin: 8px 0 0 0;">© 2026 Matrix Hub. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  },
  {
    id: "template-casual",
    name: "Casual",
    subject: "Check out this {documentType}",
    description: "Friendly and approachable email template",
    category: "casual",
    htmlContent: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">👋 Hi there!</h1>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">Take a look at this {documentType}</p>
          </div>

          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="margin: 0 0 20px 0; font-size: 16px;">Hey {recipientName},</p>

            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
              I wanted to send over the {documentType} we discussed. Take a look whenever you have a chance and let me know what you think!
            </p>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 30px 0;">
              <p style="margin: 0; font-size: 13px;">
                📎 The {documentType} is attached to this email.<br>
                Feel free to reach out if you have any questions!
              </p>
            </div>

            <p style="margin: 20px 0; font-size: 14px; line-height: 1.8;">
              Looking forward to hearing from you soon!
            </p>

            <p style="margin: 20px 0 0 0; font-size: 14px;">
              Cheers,<br>
              <strong>{senderName}</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 20px 30px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888; text-align: center;">
            <p style="margin: 0;">Sent from Matrix Hub Platform 🚀</p>
          </div>
        </div>
      </div>
    `,
  },
  {
    id: "template-formal",
    name: "Formal",
    subject: "{documentType} - Official Submission",
    description: "Formal and corporate email template",
    category: "formal",
    htmlContent: `
      <div style="font-family: 'Times New Roman', serif; line-height: 1.8; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 0;">
          <!-- Header with Corporate Look -->
          <div style="background: #003366; padding: 40px 30px; color: white; border-bottom: 3px solid #gold;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">OFFICIAL SUBMISSION</h1>
            <p style="margin: 12px 0 0 0; font-size: 14px; letter-spacing: 0.5px;">{documentType} - {currentDate}</p>
          </div>

          <!-- Body -->
          <div style="padding: 50px 30px;">
            <p style="margin: 0 0 30px 0; font-size: 14px;">Dear {recipientName},</p>

            <p style="margin: 0 0 20px 0; font-size: 14px; text-align: justify;">
              Please find the formal {documentType} enclosed with this correspondence. This document represents our
              comprehensive submission in accordance with the specified requirements and parameters.
            </p>

            <div style="margin: 40px 0; border-collapse: collapse;">
              <table style="width: 100%; border: 1px solid #ccc;">
                <tr style="background: #f0f0f0;">
                  <td style="padding: 12px; border: 1px solid #ccc; font-weight: bold; width: 30%;">Date:</td>
                  <td style="padding: 12px; border: 1px solid #ccc;">{currentDate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ccc; font-weight: bold;">Document Type:</td>
                  <td style="padding: 12px; border: 1px solid #ccc;">{documentType}</td>
                </tr>
                <tr style="background: #f0f0f0;">
                  <td style="padding: 12px; border: 1px solid #ccc; font-weight: bold;">Submitted By:</td>
                  <td style="padding: 12px; border: 1px solid #ccc;">{senderName}</td>
                </tr>
              </table>
            </div>

            <p style="margin: 20px 0; font-size: 14px; text-align: justify;">
              Should you require any clarification or additional information regarding this submission, please do not
              hesitate to contact the undersigned.
            </p>

            <p style="margin: 30px 0 0 0; font-size: 14px;">
              Respectfully submitted,
            </p>

            <p style="margin: 50px 0 0 0; font-size: 14px;">
              <strong>{senderName}</strong><br>
              Office Administrator<br>
              Matrix Hub Platform
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f5f5f5; padding: 30px; border-top: 2px solid #003366; text-align: center; font-size: 11px; color: #666;">
            <p style="margin: 0;">CONFIDENTIAL - This email and any attachment contain confidential and proprietary information.</p>
          </div>
        </div>
      </div>
    `,
  },
  {
    id: "template-personalized",
    name: "Personalized",
    subject: "Personal message: {documentType}",
    description: "Custom personalized email template",
    category: "personalized",
    htmlContent: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 0;">
          <!-- Colorful Header -->
          <div style="background: linear-gradient(to right, #667eea, #764ba2, #f093fb); padding: 30px; color: white; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700;">✨ Shared with You</h1>
            <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.95;">A {documentType} worth your attention</p>
          </div>

          <!-- Body -->
          <div style="padding: 40px 30px; background: white;">
            <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 500;">Hi {recipientName}! 👋</p>

            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.8;">
              I'm excited to share this {documentType} with you. I think you'll find it valuable and relevant to our discussion.
            </p>

            <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%); 
                        padding: 25px; border-radius: 8px; border-left: 4px solid #667eea; margin: 30px 0;">
              <p style="margin: 0; font-size: 13px; color: #555;">
                <strong>📄 What's inside:</strong><br>
                This {documentType} contains everything we discussed, with detailed insights and actionable recommendations.
              </p>
            </div>

            <p style="margin: 20px 0; font-size: 14px; line-height: 1.8;">
              I'd love to hear your thoughts on this. Feel free to reach out with any feedback or if you'd like to discuss further.
            </p>

            <div style="margin: 30px 0; padding: 20px; background: #f0f8ff; border-radius: 6px;">
              <p style="margin: 0; font-size: 13px; text-align: center;">
                <strong>Need more info?</strong><br>
                Don't hesitate to ask questions or request clarification.
              </p>
            </div>

            <p style="margin: 30px 0 0 0; font-size: 14px;">
              Till then,<br>
              <strong>{senderName}</strong> 💙
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 20px 30px; border-top: 1px solid #e0e0e0; border-radius: 0 0 12px 12px; 
                      font-size: 12px; color: #888; text-align: center;">
            <p style="margin: 0;">Sent from Matrix Hub Platform</p>
          </div>
        </div>
      </div>
    `,
  },
];

export interface EmailTemplateSelectProps {
  onSelectTemplate?: (template: EmailTemplate) => void;
  onApplyToCompose?: (template: EmailTemplate) => void;
}

export const EmailTemplateSelector: React.FC<EmailTemplateSelectProps> = ({
  onSelectTemplate,
  onApplyToCompose,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template.id);
    onSelectTemplate?.(template);
  };

  const handleApplyTemplate = (template: EmailTemplate) => {
    onApplyToCompose?.(template);
  };

  const getTemplateIcon = (category: string): string => {
    switch (category) {
      case "professional":
        return "💼";
      case "casual":
        return "👋";
      case "formal":
        return "🎩";
      case "personalized":
        return "💝";
      default:
        return "📧";
    }
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "700" }}>
        Email Templates
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
        }}
      >
        {EMAIL_TEMPLATES.map((template) => (
          <div
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            style={{
              padding: "12px",
              border:
                selectedTemplate === template.id
                  ? "2px solid #0284c7"
                  : "1px solid #cbd5e1",
              borderRadius: "6px",
              cursor: "pointer",
              background:
                selectedTemplate === template.id ? "#f0f9ff" : "#ffffff",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (selectedTemplate !== template.id) {
                e.currentTarget.style.borderColor = "#94a3b8";
                e.currentTarget.style.background = "#f8fafc";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTemplate !== template.id) {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.background = "#ffffff";
              }
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>
              {getTemplateIcon(template.category)}
            </div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: "600" }}>
              {template.name}
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "11px",
                color: "#94a3b8",
              }}
            >
              {template.category}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApplyTemplate(template);
              }}
              style={{
                marginTop: "8px",
                padding: "6px 10px",
                fontSize: "11px",
                background: "#0284c7",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%",
                fontWeight: "600",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0369a1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0284c7";
              }}
            >
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmailTemplateSelector;
