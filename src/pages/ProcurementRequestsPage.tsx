import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Send, TrendingUp, Clock, CheckCircle, AlertCircle, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { eventBus as integrationEventBus } from '../services/integrationEventBus';

interface ProcurementRequest {
  id: string;
  requestNumber: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    estimatedBudget: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }>;
  requesterName: string;
  department: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  totalBudget: number;
  createdAt: Date;
  dueDate?: Date;
  notes?: string;
  quotationResponses?: number;
}

const ProcurementRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data - in production this would come from the backend
      const mockRequests: ProcurementRequest[] = [
        {
          id: 'req-1',
          requestNumber: 'PR-2025-001',
          description: 'Office supplies and equipment for new department',
          items: [
            { name: 'Office Chairs (Ergonomic)', quantity: 10, estimatedBudget: 5000, priority: 'high' },
            { name: 'Desks (Electric Height Adjustable)', quantity: 10, estimatedBudget: 8000, priority: 'high' },
            { name: 'Computer Monitors', quantity: 20, estimatedBudget: 6000, priority: 'medium' },
          ],
          requesterName: 'John Smith',
          department: 'Operations',
          status: 'submitted',
          totalBudget: 19000,
          createdAt: new Date(Date.now() - 86400000),
          dueDate: new Date(Date.now() + 604800000),
          quotationResponses: 3,
        },
        {
          id: 'req-2',
          requestNumber: 'PR-2025-002',
          description: 'Manufacturing equipment replacement',
          items: [
            { name: 'CNC Lathe Machine', quantity: 1, estimatedBudget: 45000, priority: 'urgent' },
            { name: 'Precision Cutting Tools Set', quantity: 5, estimatedBudget: 3500, priority: 'urgent' },
          ],
          requesterName: 'Jane Doe',
          department: 'Manufacturing',
          status: 'approved',
          totalBudget: 48500,
          createdAt: new Date(Date.now() - 604800000),
          dueDate: new Date(Date.now() + 1209600000),
          quotationResponses: 5,
        },
        {
          id: 'req-3',
          requestNumber: 'PR-2025-003',
          description: 'IT Infrastructure and software licenses',
          items: [
            { name: 'Enterprise Server License (Annual)', quantity: 2, estimatedBudget: 8000, priority: 'high' },
            { name: 'Network Switches (48-port)', quantity: 4, estimatedBudget: 6400, priority: 'medium' },
            { name: 'UPS System 10kVA', quantity: 2, estimatedBudget: 4000, priority: 'medium' },
          ],
          requesterName: 'Michael Johnson',
          department: 'IT',
          status: 'draft',
          totalBudget: 18400,
          createdAt: new Date(),
          dueDate: new Date(Date.now() + 1209600000),
          quotationResponses: 0,
        },
        {
          id: 'req-4',
          requestNumber: 'PR-2025-004',
          description: 'Fleet maintenance and parts',
          items: [
            { name: 'Truck Tire Set (14 pieces)', quantity: 3, estimatedBudget: 2100, priority: 'high' },
            { name: 'Oil Change Service (10 vehicles)', quantity: 1, estimatedBudget: 500, priority: 'medium' },
            { name: 'Brake Pads Replacement', quantity: 5, estimatedBudget: 1500, priority: 'medium' },
          ],
          requesterName: 'Robert Williams',
          department: 'Logistics',
          status: 'approved',
          totalBudget: 4100,
          createdAt: new Date(Date.now() - 1209600000),
          dueDate: new Date(Date.now() - 172800000),
          quotationResponses: 2,
        },
        {
          id: 'req-5',
          requestNumber: 'PR-2025-005',
          description: 'Marketing and branding materials',
          items: [
            { name: 'Corporate Branded Merchandise', quantity: 500, estimatedBudget: 2500, priority: 'low' },
            { name: 'Signage and Promotional Materials', quantity: 20, estimatedBudget: 1200, priority: 'low' },
          ],
          requesterName: 'Sarah Anderson',
          department: 'Marketing',
          status: 'completed',
          totalBudget: 3700,
          createdAt: new Date(Date.now() - 1814400000),
          dueDate: new Date(Date.now() - 604800000),
          quotationResponses: 4,
        },
      ];

      setRequests(mockRequests);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError('Failed to load procurement requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = () => {
    integrationEventBus.emit('PROCUREMENT_REQUEST_CREATE_INITIATED', {
      timestamp: new Date(),
    });
    navigate('/procurement');
  };

  const handleSubmitRequest = (request: ProcurementRequest) => {
    integrationEventBus.emit('PROCUREMENT_REQUEST_SUBMITTED', {
      requestId: request.id,
      requestNumber: request.requestNumber,
      totalBudget: request.totalBudget,
      items: request.items,
      department: request.department,
      timestamp: new Date(),
    });
    alert(`Request ${request.requestNumber} submitted for approval!`);
    loadRequests();
  };

  const handleApproveRequest = (request: ProcurementRequest) => {
    integrationEventBus.emit('PROCUREMENT_REQUEST_APPROVED', {
      requestId: request.id,
      requestNumber: request.requestNumber,
      totalBudget: request.totalBudget,
      items: request.items,
      department: request.department,
      timestamp: new Date(),
    });
    alert(`Request ${request.requestNumber} approved! Budget reserved.`);
    loadRequests();
  };

  const handleRejectRequest = (request: ProcurementRequest) => {
    integrationEventBus.emit('PROCUREMENT_REQUEST_REJECTED', {
      requestId: request.id,
      requestNumber: request.requestNumber,
      timestamp: new Date(),
    });
    alert(`Request ${request.requestNumber} rejected!`);
    loadRequests();
  };

  const handleViewQuotations = (request: ProcurementRequest) => {
    integrationEventBus.emit('PROCUREMENT_QUOTATIONS_VIEWED', {
      requestId: request.id,
      quotationCount: request.quotationResponses || 0,
      timestamp: new Date(),
    });
    navigate(`/procurement/quotations?requestId=${request.id}`);
  };

  const filteredRequests = React.useMemo(() => {
    let result = requests;

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (searchTerm) {
      result = result.filter(r =>
        r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requesterName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [requests, statusFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'submitted':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'draft':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      case 'completed':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'low':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
      default:
        return '';
    }
  };

  const stats = [
    {
      label: 'Total Requests',
      value: requests.length,
      icon: ShoppingCart,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Pending Approval',
      value: requests.filter(r => r.status === 'submitted').length,
      icon: Clock,
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Approved',
      value: requests.filter(r => r.status === 'approved').length,
      icon: CheckCircle,
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      label: 'Total Budget',
      value: '$' + requests.reduce((sum, r) => sum + r.totalBudget, 0).toLocaleString(),
      icon: TrendingUp,
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Procurement Requests</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Create requests, collect quotations, and manage procurement process</p>
              </div>
            </div>
            <button 
              onClick={handleCreateRequest}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors">
              <Plus size={20} /> New Request
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className={`${stat.color} border ${stat.border} rounded-lg p-4 transition-all hover:shadow-md`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium opacity-75">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <Icon size={28} className="opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-24 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search requests by number, description, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Requests</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-900 dark:text-red-200 font-medium">Error Loading Requests</p>
              <button
                onClick={loadRequests}
                className="mt-2 text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading requests...</p>
            </div>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{request.requestNumber}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{request.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Requester</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.requesterName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Department</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.department}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Budget</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${request.totalBudget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Quotations</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.quotationResponses || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedRequest === request.id && (
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Requested Items</h4>
                    <div className="space-y-3 mb-6">
                      {request.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            <div className="flex gap-4 mt-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</span>
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${getPriorityColor(item.priority)}`}>
                                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                              </span>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">${item.estimatedBudget.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    {request.notes && (
                      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Notes</p>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{request.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {request.status === 'draft' && (
                        <>
                          <button 
                            onClick={() => handleSubmitRequest(request)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                            <Send size={16} /> Submit
                          </button>
                          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            Edit
                          </button>
                        </>
                      )}
                      {request.status === 'submitted' && (
                        <>
                          <button 
                            onClick={() => handleApproveRequest(request)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(request)}
                            className="px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleViewQuotations(request)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <Eye size={16} /> View Quotations ({request.quotationResponses})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingCart className="mx-auto text-gray-400 dark:text-gray-600" size={48} />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Requests Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Create a new procurement request to get started</p>
            <button 
              onClick={handleCreateRequest}
              className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto">
              <Plus size={20} /> Create Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcurementRequestsPage;
