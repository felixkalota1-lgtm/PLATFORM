import React, { useState, useEffect } from "react";
import { X, Send, Loader } from "lucide-react";
import GmailOAuthService, { EmailAccount } from "../services/GmailOAuthService";
import EmailSendingService from "../services/EmailSendingService";

export interface SendEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentType: "quotation" | "invoice" | "order";
  documentElement?: HTMLElement;
  defaultRecipientEmail?: string;
  onEmailSent?: (result: { messageId: string; threadId: string }) => void;
  onEmailError?: (error: Error) => void;
  gmailService: GmailOAuthService;
}

const SendEmailDialog: React.FC<SendEmailDialogProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentType,
  documentElement,
  defaultRecipientEmail = "",
  onEmailSent,
  onEmailError,
  gmailService,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState(
    `${documentTitle} - ${documentType.toLowerCase()}`,
  );
  const [message, setMessage] = useState("");
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(
    null,
  );
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load email accounts on mount
  useEffect(() => {
    if (isOpen) {
      loadEmailAccounts();
    }
  }, [isOpen]);

  // Set default account when accounts load
  useEffect(() => {
    if (emailAccounts.length > 0 && !selectedAccount) {
      const defaultAccount =
        emailAccounts.find((acc) => acc.isDefault) || emailAccounts[0];
      setSelectedAccount(defaultAccount);
    }
  }, [emailAccounts]);

  const loadEmailAccounts = async () => {
    try {
      const accounts = await gmailService.getEmailAccounts();
      setEmailAccounts(accounts);

      if (accounts.length === 0) {
        setError(
          "No email accounts connected. Please connect a Gmail account first.",
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load email accounts";
      setError(errorMessage);
    }
  };

  const handleSendEmail = async () => {
    try {
      setError(null);
      setIsSending(true);

      // Validate inputs
      if (!recipientEmail) {
        throw new Error("Recipient email is required");
      }
      if (!EmailSendingService.validateEmail(recipientEmail)) {
        throw new Error("Invalid recipient email address");
      }
      if (!selectedAccount) {
        throw new Error("No email account selected");
      }

      // Generate HTML version of document
      let htmlBody = message || `<p>Please see attached ${documentType}.</p>`;

      if (documentElement) {
        const documentHtml =
          await EmailSendingService.convertDocumentToHtml(documentElement);
        htmlBody = `
          <p>${message || `Please see the ${documentType} below:`}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          ${documentHtml}
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">This email was sent from Matrix Hub Platform</p>
        `;
      }

      // Send email via Cloud Function
      const result = await EmailSendingService.sendEmailViaGmail(
        selectedAccount,
        recipientEmail,
        subject,
        htmlBody,
      );

      // Log to email history
      await gmailService.logEmailHistory({
        documentId: documentTitle,
        documentType,
        recipientEmail,
        senderEmail: selectedAccount.email,
        subject,
        timestamp: Date.now(),
        status: "sent",
      });

      setSuccess(true);
      onEmailSent?.(result);

      // Reset form
      setTimeout(() => {
        setRecipientEmail("");
        setRecipientName("");
        setMessage("");
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      onEmailError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Send {documentType.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
              Email sent successfully! Closing dialog...
            </div>
          )}

          {/* From Account */}
          {emailAccounts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Account
              </label>
              <select
                value={selectedAccount?.id || ""}
                onChange={(e) => {
                  const account = emailAccounts.find(
                    (acc) => acc.id === e.target.value,
                  );
                  setSelectedAccount(account || null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an account</option>
                {emailAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.email} {account.isDefault ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* To Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email *
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSending}
            />
          </div>

          {/* Recipient Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Name (Optional)
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSending}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSending}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to include with the document..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              disabled={isSending}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            <p>
              The {documentType} will be included in the email with all
              formatting and images.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSending}
            className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendEmail}
            disabled={isSending || !selectedAccount || !recipientEmail}
            className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendEmailDialog;
