import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDocumentStore } from './store';

export const DocumentManagementModule: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { documents, notifications, templates, auditLogs } = useDocumentStore();
  
  const getActiveTab = () => {
    const path = location.pathname.split('/').pop();
    return path || 'documents';
  };

  const activeTab = getActiveTab();
  const expiringDocs = documents.filter(d => d.status === 'expiring-soon' || d.status === 'expired');
  const pendingNotifications = notifications.filter(n => !n.acknowledged);

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Document Management</h1>
          
          {pendingNotifications.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 font-semibold">
                ⚠️ {pendingNotifications.length} document renewal reminders
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto sticky top-0 bg-gray-50 pb-2">
          {[
            { id: 'documents', label: 'All Documents', count: documents.length },
            { id: 'expiring', label: 'Expiring Soon', count: expiringDocs.length },
            { id: 'templates', label: 'Templates', count: templates.length },
            { id: 'audit', label: 'Audit Log', count: auditLogs.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(`/document-management/${tab.id}`)}
              className={`px-4 py-2 font-semibold whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/document-management/documents" replace />} />
          <Route path="/documents" element={<DocumentsListView />} />
          <Route path="/expiring" element={<ExpiringDocumentsView />} />
          <Route path="/templates" element={<TemplatesView />} />
          <Route path="/audit" element={<AuditLogView />} />
        </Routes>
      </div>
    </div>
  );
};

const DocumentsListView: React.FC = () => {
  const { documents } = useDocumentStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Company Documents</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Upload Document
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Document</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No documents uploaded yet
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{doc.title}</p>
                    <p className="text-sm text-gray-600">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(doc.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      doc.status === 'valid' ? 'bg-green-100 text-green-800' :
                      doc.status === 'expiring-soon' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {doc.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold mr-3">
                      Download
                    </button>
                    <button className="text-green-600 hover:text-green-800 text-sm font-semibold">
                      Renew
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExpiringDocumentsView: React.FC = () => {
  const { documents } = useDocumentStore();
  const expiringDocs = documents.filter(d => d.status === 'expiring-soon' || d.status === 'expired');

  return (
    <div className="space-y-4">
      {expiringDocs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          All documents are up to date!
        </div>
      ) : (
        expiringDocs.map((doc) => (
          <div key={doc.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-400">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{doc.title}</h3>
                <p className="text-sm text-gray-600">{doc.type}</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full font-semibold ${
                doc.status === 'expiring-soon' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {doc.daysUntilExpiry !== undefined && doc.daysUntilExpiry > 0
                  ? `${doc.daysUntilExpiry} days left`
                  : 'EXPIRED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Expiry Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(doc.expiryDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold">Assigned To</p>
                <p className="font-semibold text-gray-900">{doc.assignedTo.length} user(s)</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-semibold">
                Renew Now
              </button>
              <button className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold">
                View Details
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const TemplatesView: React.FC = () => {
  const { templates } = useDocumentStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Document Templates</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Create Template
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {templates.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No templates created yet
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="p-6 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.type}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm font-semibold">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AuditLogView: React.FC = () => {
  const { auditLogs } = useDocumentStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold">Document Audit Trail</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {auditLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No audit logs yet
          </div>
        ) : (
          auditLogs.slice(0, 50).map((log) => (
            <div key={log.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{log.action.toUpperCase()}</p>
                  <p className="text-sm text-gray-600">{log.details}</p>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500">By: {log.performedBy}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentManagementModule;
