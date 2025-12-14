import React, { useState, useMemo } from 'react';
import {
  Search,
  MoreVertical,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Edit,
  Eye,
} from 'lucide-react';
import { Employee } from '../../../services/hrService';
import '../HRModule.css';

interface EmployeesTabProps {
  employees: Employee[];
  onRefresh?: () => void;
}

const EmployeesTab: React.FC<EmployeesTabProps> = ({ employees }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const departments = Array.from(new Set(employees.map((e) => e.department)));
  const statuses = Array.from(new Set(employees.map((e) => e.status)));

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
      const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, searchQuery, selectedDepartment, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
      case 'on-leave':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'contract-ending':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div
            key={employee.id}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300" />

            <div className="relative p-6 space-y-4">
              {/* Header with Avatar */}
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-4xl leading-none">{employee.avatar}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-blue-300 font-medium">{employee.position}</p>
                  </div>
                </div>
                <button className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors">
                  <MoreVertical size={16} className="text-slate-400" />
                </button>
              </div>

              {/* Status Badge */}
              <div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(employee.status)}`}>
                  {employee.status.charAt(0).toUpperCase() + employee.status.slice(1).replace('-', ' ')}
                </span>
              </div>

              {/* Employee Details */}
              <div className="space-y-2 border-t border-slate-600 pt-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Briefcase size={16} className="text-blue-400 flex-shrink-0" />
                  <span>{employee.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Mail size={16} className="text-blue-400 flex-shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Phone size={16} className="text-blue-400 flex-shrink-0" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Calendar size={16} className="text-blue-400 flex-shrink-0" />
                  <span>{employee.hireDate.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Salary Info */}
              <div className="border-t border-slate-600 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Salary</span>
                  <span className="font-bold text-white">${(employee.salary / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
                  <span>{employee.employmentType}</span>
                  <span className="px-2 py-1 bg-slate-600 rounded">{employee.baseSalary ? 'Full Details' : 'Base Only'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-slate-600 pt-4">
                <button
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setShowDetailModal(true);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  View
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Edit size={16} />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-slate-500 mb-4">👥</div>
          <p className="text-slate-400 text-lg font-medium">No employees found</p>
          <p className="text-slate-500 text-sm">Try adjusting your filters</p>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
              <h2 className="text-2xl font-bold text-white">
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Position</p>
                  <p className="text-white font-medium">{selectedEmployee.position}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Department</p>
                  <p className="text-white font-medium">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Employment Type</p>
                  <p className="text-white font-medium">{selectedEmployee.employmentType}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Status</p>
                  <p className={`font-medium ${getStatusColor(selectedEmployee.status)}`}>
                    {selectedEmployee.status}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Email</p>
                  <p className="text-white font-medium">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Phone</p>
                  <p className="text-white font-medium">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Hire Date</p>
                  <p className="text-white font-medium">{selectedEmployee.hireDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Salary</p>
                  <p className="text-white font-medium">${selectedEmployee.salary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Address</p>
                  <p className="text-white font-medium">{selectedEmployee.address}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">City, State ZIP</p>
                  <p className="text-white font-medium">
                    {selectedEmployee.city}, {selectedEmployee.state} {selectedEmployee.zipCode}
                  </p>
                </div>
              </div>

              {selectedEmployee.emergencyContact && (
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-white font-bold mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Name</p>
                      <p className="text-white font-medium">{selectedEmployee.emergencyContact.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Relationship</p>
                      <p className="text-white font-medium">{selectedEmployee.emergencyContact.relationship}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 text-sm">Phone</p>
                      <p className="text-white font-medium">{selectedEmployee.emergencyContact.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesTab;
