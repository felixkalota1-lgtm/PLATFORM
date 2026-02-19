import { EmailAccount } from "./GmailOAuthService";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

/**
 * Email sending service that uses Cloud Functions for secure Gmail API calls
 * This ensures OAuth tokens are never exposed to the browser
 */
export class EmailSendingService {
  /**
   * Send email via Cloud Function (secure server-side approach)
   * IMPORTANT: Never expose OAuth tokens to the browser!
   */
  static async sendEmailViaGmail(
    emailAccount: EmailAccount,
    toEmail: string,
    subject: string,
    htmlBody: string,
    attachmentData?: {
      filename: string;
      mimeType: string;
      data: string;
    },
  ): Promise<{ messageId: string; threadId: string }> {
    try {
      // Call Cloud Function instead of direct Gmail API
      // This keeps OAuth tokens secure on the server
      const sendEmailFunction = httpsCallable(functions, "sendEmailViaGmail");

      const result = await sendEmailFunction({
        emailAccountId: emailAccount.id,
        toEmail,
        subject,
        htmlBody,
        attachmentData,
        documentId: undefined,
        documentType: "document",
      });

      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || "Failed to send email");
      }

      return {
        messageId: data.messageId,
        threadId: data.threadId,
      };
    } catch (error) {
      console.error("Error sending email via Cloud Function:", error);
      throw error;
    }
  }

  /**
   * Fetch inbox emails via Cloud Function (secure server-side approach)
   */
  static async fetchInboxEmails(
    emailAccount: EmailAccount,
    maxResults: number = 10,
  ): Promise<
    Array<{
      id: string;
      messageId: string;
      from: string;
      subject: string;
      body: string;
      date: string;
      isRead: boolean;
    }>
  > {
    try {
      const fetchInboxFunction = httpsCallable(functions, "fetchInboxEmails");

      const result = await fetchInboxFunction({
        emailAccountId: emailAccount.id,
        maxResults,
      });

      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch inbox emails");
      }

      return data.emails || [];
    } catch (error) {
      console.error("Error fetching inbox emails via Cloud Function:", error);
      throw error;
    }
  }

  /**
   * Mark email as read via Cloud Function (secure server-side approach)
   */
  static async markEmailAsRead(
    emailAccount: EmailAccount,
    messageId: string,
  ): Promise<void> {
    try {
      const markAsReadFunction = httpsCallable(functions, "markEmailAsRead");

      const result = await markAsReadFunction({
        emailAccountId: emailAccount.id,
        messageId,
      });

      const data = result.data as any;

      if (!data.success) {
        throw new Error(data.error || "Failed to mark email as read");
      }
    } catch (error) {
      console.error("Error marking email as read via Cloud Function:", error);
      throw error;
    }
  }

  /**
   * Convert React component to HTML string
   * This uses html-to-image library for rendering
   */
  static async convertDocumentToHtml(
    componentElement: HTMLElement,
    includeStyles: boolean = true,
  ): Promise<string> {
    try {
      // Clone the element to avoid modifying the original
      const clone = componentElement.cloneNode(true) as HTMLElement;

      // Ensure all images are embedded as data URIs for email compatibility
      const images = clone.querySelectorAll("img");
      for (const img of images) {
        const src = img.getAttribute("src");
        if (src && !src.startsWith("data:")) {
          try {
            const dataUri = await this.imageToDataUri(src);
            img.setAttribute("src", dataUri);
          } catch (e) {
            console.warn(`Could not convert image ${src} to data URI:`, e);
          }
        }
      }

      // Extract and inline styles
      let html = "<html><head><style>\r\n";

      if (includeStyles) {
        // Get all stylesheets
        const sheets = document.styleSheets;
        for (let i = 0; i < sheets.length; i++) {
          try {
            const rules = sheets[i].cssRules || sheets[i].rules;
            for (let j = 0; j < rules.length; j++) {
              html += rules[j].cssText + "\r\n";
            }
          } catch (e) {
            // Skip rules that can't be accessed (cross-origin)
            console.warn("Could not access stylesheet rules:", e);
          }
        }
      }

      html += "</style></head><body>\r\n";
      html += clone.outerHTML;
      html += "\r\n</body></html>";

      return html;
    } catch (error) {
      console.error("Error converting document to HTML:", error);
      throw error;
    }
  }

  /**
   * Convert image URL to data URI
   */
  private static async imageToDataUri(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
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
    onSuccess: (result: any) => void,
    onError: (error: Error) => void,
  ) {
    return async (
      emailAccount: EmailAccount,
      recipientEmail: string,
      subject: string,
      htmlBody: string,
      attachmentData?: { filename: string; mimeType: string; data: string },
    ) => {
      try {
        if (!this.validateEmail(recipientEmail)) {
          throw new Error("Invalid recipient email address");
        }

        const result = await this.sendEmailViaGmail(
          emailAccount,
          recipientEmail,
          subject,
          htmlBody,
          attachmentData,
        );

        onSuccess(result);
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    };
  }
}

export default EmailSendingService;
