import { EmailAccount, EmailHistory } from './GmailOAuthService';

/**
 * Send email via Gmail API
 */
export class EmailSendingService {
  /**
   * Send email message via Gmail API
   */
  static async sendEmailViaGmail(
    accessToken: string,
    toEmail: string,
    subject: string,
    htmlBody: string,
    fromEmail: string,
    attachmentData?: {
      filename: string;
      mimeType: string;
      data: string; // base64 encoded
    }
  ): Promise<{ messageId: string; threadId: string }> {
    try {
      // Construct email message
      let msg = this.constructMimeMessage(
        fromEmail,
        toEmail,
        subject,
        htmlBody,
        attachmentData
      );

      // Encode message as base64url
      const encodedMessage = this.encodeBase64Url(msg);

      // Call Gmail API
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedMessage
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gmail API error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      return {
        messageId: result.id,
        threadId: result.threadId
      };
    } catch (error) {
      console.error('Error sending email via Gmail:', error);
      throw error;
    }
  }

  /**
   * Construct MIME message for email
   */
  private static constructMimeMessage(
    from: string,
    to: string,
    subject: string,
    htmlBody: string,
    attachmentData?: {
      filename: string;
      mimeType: string;
      data: string;
    }
  ): string {
    const boundary = `boundary${Date.now()}`;
    const contentType = attachmentData
      ? `multipart/mixed; boundary="${boundary}"`
      : 'text/html; charset="UTF-8"';

    let msg = `From: ${from}\r\nTo: ${to}\r\nSubject: ${this.encodeSubject(subject)}\r\nContent-Type: ${contentType}\r\n`;

    if (attachmentData) {
      msg += `\r\n--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n`;
      msg += htmlBody;

      msg += `\r\n\r\n--${boundary}\r\nContent-Type: ${attachmentData.mimeType}\r\nContent-Disposition: attachment; filename="${attachmentData.filename}"\r\nContent-Transfer-Encoding: base64\r\n\r\n`;
      msg += attachmentData.data;
      msg += `\r\n--${boundary}--`;
    } else {
      msg += 'Content-Transfer-Encoding: quoted-printable\r\n\r\n';
      msg += htmlBody;
    }

    return msg;
  }

  /**
   * Encode subject line for email header
   */
  private static encodeSubject(subject: string): string {
    const base64 = btoa(unescape(encodeURIComponent(subject)));
    return `=?UTF-8?B?${base64}?=`;
  }

  /**
   * Encode string to base64url format (for Gmail API)
   */
  private static encodeBase64Url(str: string): string {
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Convert React component to HTML string
   * This uses html-to-image library for rendering
   */
  static async convertDocumentToHtml(
    componentElement: HTMLElement,
    includeStyles: boolean = true
  ): Promise<string> {
    try {
      // Clone the element to avoid modifying the original
      const clone = componentElement.cloneNode(true) as HTMLElement;

      // Ensure all images are embedded as data URIs for email compatibility
      const images = clone.querySelectorAll('img');
      for (const img of images) {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          try {
            const dataUri = await this.imageToDataUri(src);
            img.setAttribute('src', dataUri);
          } catch (e) {
            console.warn(`Could not convert image ${src} to data URI:`, e);
          }
        }
      }

      // Extract and inline styles
      let html = '<html><head><style>\r\n';

      if (includeStyles) {
        // Get all stylesheets
        const sheets = document.styleSheets;
        for (let i = 0; i < sheets.length; i++) {
          try {
            const rules = sheets[i].cssRules || sheets[i].rules;
            for (let j = 0; j < rules.length; j++) {
              html += rules[j].cssText + '\r\n';
            }
          } catch (e) {
            // Skip rules that can't be accessed (cross-origin)
            console.warn('Could not access stylesheet rules:', e);
          }
        }
      }

      html += '</style></head><body>\r\n';
      html += clone.outerHTML;
      html += '\r\n</body></html>';

      return html;
    } catch (error) {
      console.error('Error converting document to HTML:', error);
      throw error;
    }
  }

  /**
   * Convert image URL to data URI
   */
  private static async imageToDataUri(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * Generate PDF attachment from HTML (requires backend)
   * For now, returns null - implement via Cloud Function
   */
  static async convertHtmlToPdf(
    htmlContent: string,
    filename: string
  ): Promise<{ filename: string; mimeType: string; data: string } | null> {
    // This should be implemented as a Cloud Function for security and reliability
    // Returns null - caller should implement PDF generation
    console.warn('PDF generation not yet implemented - implement via Cloud Function');
    return null;
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Create send email handler
   */
  static createSendHandler(
    emailAccount: EmailAccount,
    onSuccess: (result: any) => void,
    onError: (error: Error) => void
  ) {
    return async (
      recipientEmail: string,
      subject: string,
      htmlBody: string,
      attachmentData?: { filename: string; mimeType: string; data: string }
    ) => {
      try {
        if (!this.validateEmail(recipientEmail)) {
          throw new Error('Invalid recipient email address');
        }

        const result = await this.sendEmailViaGmail(
          emailAccount.accessToken,
          recipientEmail,
          subject,
          htmlBody,
          emailAccount.email,
          attachmentData
        );

        onSuccess(result);
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    };
  }
}

export default EmailSendingService;
