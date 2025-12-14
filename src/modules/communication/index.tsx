import React from 'react';
import { useCommunicationStore } from './store';

export const CommunicationModule: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'messages' | 'orders' | 'requests'>('messages');
  const { messages, directorOrders, departmentRequests } = useCommunicationStore();

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Communication Hub</h1>
        
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'messages'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Team Messages ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'orders'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Director Orders ({directorOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Department Requests ({departmentRequests.length})
          </button>
        </div>

        {activeTab === 'messages' && <TeamMessagesView />}
        {activeTab === 'orders' && <DirectorOrdersView />}
        {activeTab === 'requests' && <DepartmentRequestsView />}
      </div>
    </div>
  );
};

const TeamMessagesView: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="divide-y divide-gray-200">
          {/* Conversation list would go here */}
          <div className="p-4 text-gray-500 text-center">No conversations yet</div>
        </div>
      </div>
      
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <div className="flex flex-col justify-center items-center h-full text-gray-400">
          <p className="text-lg">Select a conversation to start messaging</p>
        </div>
      </div>
    </div>
  );
};

const DirectorOrdersView: React.FC = () => {
  const { directorOrders } = useCommunicationStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Director Orders</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + New Order
        </button>
      </div>
      
      <div className="divide-y divide-gray-200">
        {directorOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No director orders yet
          </div>
        ) : (
          directorOrders.map((order) => (
            <div key={order.id} className="p-6 hover:bg-gray-50 cursor-pointer transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{order.title}</h3>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  order.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  order.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  order.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {order.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{order.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  Assigned to {order.assignedTo.length} people
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const DepartmentRequestsView: React.FC = () => {
  const { departmentRequests } = useCommunicationStore();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold">Inter-Department Requests</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + New Request
        </button>
      </div>
      
      <div className="divide-y divide-gray-200">
        {departmentRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No department requests yet
          </div>
        ) : (
          departmentRequests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50 cursor-pointer transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{request.title}</h3>
                  <p className="text-sm text-gray-600">
                    From {request.requesterDepartment} to {request.targetDepartment}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  request.priority === 'high' ? 'bg-red-100 text-red-800' :
                  request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {request.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{request.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  Type: {request.requestType}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  request.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {request.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunicationModule;
