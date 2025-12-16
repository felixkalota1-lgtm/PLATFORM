import { useState } from 'react';
import { useInquiryFlowStore } from '../store';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Mail,
  Phone,
  Clock,
  DollarSign,
} from 'lucide-react';

type InquiryStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'archived';

const statusColors: Record<InquiryStatus, { bg: string; text: string; badge: string }> = {
  new: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', badge: 'bg-blue-100 dark:bg-blue-800' },
  contacted: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-100 dark:bg-yellow-800' },
  quoted: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', badge: 'bg-purple-100 dark:bg-purple-800' },
  won: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', badge: 'bg-green-100 dark:bg-green-800' },
  lost: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-100 dark:bg-red-800' },
  archived: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', badge: 'bg-gray-100 dark:bg-gray-800' },
};

const priorityColors: Record<string, string> = {
  low: 'text-blue-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

export default function InquiriesList() {
  const inquiries = useInquiryFlowStore((state: any) => state.inquiries);
  const updateInquiry = useInquiryFlowStore((state: any) => state.updateInquiry);
  const cancelInquiry = useInquiryFlowStore((state: any) => state.cancelInquiry);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStatusChange = (id: string, newStatus: InquiryStatus) => {
    updateInquiry(id, { status: newStatus });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const deleteInquiry = (id: string) => {
    cancelInquiry(id);
  };

  if (inquiries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          No inquiries found. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inquiry: any) => {
        const isExpanded = expandedId === inquiry.id;
        const colors = statusColors[inquiry.status as InquiryStatus];

        return (
          <div
            key={inquiry.id}
            className={`border rounded-lg overflow-hidden transition-all ${colors.bg}`}
          >
            {/* Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => toggleExpand(inquiry.id)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {isExpanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {inquiry.inquiryNumber}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded ${colors.badge} ${colors.text}`}
                    >
                      {inquiry.status}
                    </span>
                    <span className={`text-xs px-2 py-1 ${priorityColors[inquiry.priority]}`}>
                      ⚡ {inquiry.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {inquiry.subject}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {inquiry.contactName}
                    {inquiry.company && ` • ${inquiry.company}`}
                  </p>
                </div>

                <button
                  onClick={() => deleteInquiry(inquiry.id)}
                  className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t dark:border-gray-700 p-4 space-y-4">
                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Mail size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                      <p className="text-sm text-gray-900 dark:text-white break-all">
                        {inquiry.contactEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {inquiry.contactPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Description
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                    {inquiry.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {inquiry.productCategory && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Category
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {inquiry.productCategory}
                      </p>
                    </div>
                  )}

                  {inquiry.quantity && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Quantity
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {inquiry.quantity} units
                      </p>
                    </div>
                  )}

                  {inquiry.estimatedBudget && (
                    <div className="flex items-start gap-2">
                      <DollarSign size={14} className="text-gray-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Est. Budget
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          ${inquiry.estimatedBudget.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {inquiry.requiredBy && (
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="text-gray-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Required By
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(inquiry.requiredBy).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Type Badge */}
                <div>
                  <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                    Type: {inquiry.type}
                  </span>
                </div>

                {/* Status Actions */}
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Change Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(['new', 'contacted', 'quoted', 'won', 'lost', 'archived'] as InquiryStatus[]).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(inquiry.id, status)}
                          className={`text-xs px-3 py-1.5 rounded border transition-all ${
                            inquiry.status === status
                              ? `${statusColors[status].badge} ${statusColors[status].text} border-current font-medium`
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
                          }`}
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
