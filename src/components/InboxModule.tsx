import React, { useState, useEffect } from "react";
import {
  Mail,
  Archive,
  Trash2,
  ExternalLink,
  Loader,
  MessageSquare,
  Clock,
  User,
} from "lucide-react";
import GmailOAuthService, { InboxEmail } from "../services/GmailOAuthService";
import EmailSendingService from "../services/EmailSendingService";

export interface InboxModuleProps {
  gmailService: GmailOAuthService;
  unreadCount?: number;
  onUnreadCountChange?: (count: number) => void;
}

const InboxModule: React.FC<InboxModuleProps> = ({
  gmailService,
  unreadCount = 0,
  onUnreadCountChange,
}) => {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [error, setError] = useState<string | null>(null);

  // Load emails on mount and set up polling
  useEffect(() => {
    loadEmails();

    // Poll for new emails every 5 minutes
    const interval = setInterval(
      () => {
        loadEmails();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, []);

  const loadEmails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get email accounts
      const accounts = await gmailService.getEmailAccounts();

      if (accounts.length === 0) {
        setError(
          "No email accounts connected. Please connect a Gmail account.",
        );
        setEmails([]);
        return;
      }

      // Fetch emails from all accounts via Cloud Function
      const allEmails: InboxEmail[] = [];

      for (const account of accounts) {
        try {
          const fetchedEmails =
            await EmailSendingService.fetchInboxEmails(account);

          // Map Cloud Function response to InboxEmail structure
          const mappedEmails: InboxEmail[] = fetchedEmails.map(
            (email: any) => ({
              id: email.id,
              messageId: email.messageId,
              from: email.from,
              to: "", // Not provided by Cloud Function, set to empty
              subject: email.subject,
              body: email.body,
              timestamp: new Date(email.date).getTime(),
              isRead: email.isRead,
              hasAttachments: false, // Cloud Function doesn't include attachment info yet
              attachmentCount: 0,
            }),
          );

          allEmails.push(...mappedEmails);
        } catch (err) {
          console.error(
            `Failed to fetch emails from account ${account.email}:`,
            err,
          );
          // Continue with other accounts even if one fails
        }
      }

      setEmails(allEmails);

      // Update unread count
      const unreadEmails = allEmails.filter((e) => !e.isRead).length;
      if (onUnreadCountChange) {
        onUnreadCountChange(unreadEmails);
      }

      // Update inbox metadata in database
      await gmailService.updateInboxMetadata(unreadEmails, Date.now());
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load emails";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (email: InboxEmail) => {
    try {
      // Get email accounts to find which account owns this email
      const accounts = await gmailService.getEmailAccounts();
      if (accounts.length === 0) return;

      // Use the first/default account (in real app, should track which account owns each email)
      const account = accounts[0];

      // Call Cloud Function to mark as read
      await EmailSendingService.markEmailAsRead(account, email.messageId);

      // Update local state
      const updated = { ...email, isRead: true };
      setEmails(emails.map((e) => (e.id === email.id ? updated : e)));
      setSelectedEmail(updated);
    } catch (err) {
      console.error("Failed to mark email as read:", err);
    }
  };

  const handleMarkAsUnread = async (email: InboxEmail) => {
    try {
      // Note: markEmailAsUnread is not yet implemented in Cloud Functions
      // For now, just update local state
      const updated = { ...email, isRead: false };
      setEmails(emails.map((e) => (e.id === email.id ? updated : e)));
      setSelectedEmail(updated);
      console.warn("Mark as unread not yet implemented in Cloud Functions");
    } catch (err) {
      console.error("Failed to mark email as unread:", err);
    }
  };

  const handleArchive = async (emailId: string) => {
    // TODO: Implement archive functionality
    setEmails(emails.filter((e) => e.id !== emailId));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
  };

  const handleDelete = async (emailId: string) => {
    // TODO: Implement delete functionality
    setEmails(emails.filter((e) => e.id !== emailId));
    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null);
    }
  };

  const formatEmailDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const filteredEmails =
    filter === "unread" ? emails.filter((e) => !e.isRead) : emails;

  return (
    <div className="flex h-full gap-4">
      {/* Email List */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail size={24} className="text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Inbox</h2>
                <p className="text-sm text-gray-600">{emails.length} emails</p>
              </div>
            </div>
            <button
              onClick={loadEmails}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              title="Refresh emails"
            >
              {isLoading ? (
                <Loader size={18} className="text-gray-600 animate-spin" />
              ) : (
                <Mail size={18} className="text-gray-600" />
              )}
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                filter === "all"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                filter === "unread"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Unread ({emails.filter((e) => !e.isRead).length})
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && emails.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader size={24} className="text-gray-400 animate-spin" />
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <MessageSquare size={48} className="mb-2 text-gray-400" />
              <p>No {filter} emails</p>
            </div>
          ) : (
            filteredEmails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                  selectedEmail?.id === email.id
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : ""
                } ${!email.isRead ? "bg-blue-50/50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p
                        className={`font-medium ${!email.isRead ? "font-bold text-gray-900" : "text-gray-700"}`}
                      >
                        {email.from}
                      </p>
                      {!email.isRead && (
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <p
                      className={`text-sm truncate ${!email.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}
                    >
                      {email.subject}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {email.body}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
                    <span className="whitespace-nowrap">
                      {formatEmailDate(email.timestamp)}
                    </span>
                    {email.hasAttachments && (
                      <span className="text-gray-600">📎</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Email Details */}
      {selectedEmail && (
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 break-words">
                  {selectedEmail.subject}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedEmail.from}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>
                  <strong>From:</strong> {selectedEmail.from}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>
                  <strong>To:</strong> {selectedEmail.to}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>
                  {new Date(selectedEmail.timestamp).toLocaleString()}
                </span>
              </div>
              {selectedEmail.hasAttachments && (
                <div className="flex items-center gap-2">
                  <span>📎 {selectedEmail.attachmentCount} attachment(s)</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {selectedEmail.isRead ? (
                <button
                  onClick={() => handleMarkAsUnread(selectedEmail)}
                  className="flex-1 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Mark Unread
                </button>
              ) : (
                <button
                  onClick={() => handleMarkAsRead(selectedEmail)}
                  className="flex-1 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Mark Read
                </button>
              )}
              <button
                onClick={() => handleArchive(selectedEmail.id)}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Archive"
              >
                <Archive size={18} />
              </button>
              <button
                onClick={() => handleDelete(selectedEmail.id)}
                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Email Body */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="prose text-gray-700 max-w-none">
              {selectedEmail.body}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedEmail && emails.length > 0 && (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 text-gray-500">
          <p>Select an email to read</p>
        </div>
      )}
    </div>
  );
};

export default InboxModule;
