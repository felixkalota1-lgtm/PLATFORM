import React, { useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  MapPin,
  Eye,
  MoreVertical,
} from 'lucide-react';
import { Department, Employee } from '../../../services/hrService';
import '../HRModule.css';

interface DepartmentsTabProps {
  departments: Department[];
  employees: Employee[];
  onRefresh?: () => void;
}

const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ departments, employees, onRefresh: _onRefresh }) => {
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getDeptHead = (headId: string | undefined): Employee | undefined => {
    if (!headId) return undefined;
    return employees.find((e) => e.id === headId);
  };

  const getDeptMembers = (deptName: string): Employee[] => {
    return employees.filter((e) => e.department === deptName);
  };

  return (
    <div className="space-y-6">
      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const head = getDeptHead(dept.headId);
          const members = getDeptMembers(dept.name);

          return (
            <div
              key={dept.id}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 transition-all duration-300" />

              <div className="relative p-6 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 rounded-lg bg-blue-500/20">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white">{dept.name}</h3>
                      <p className="text-xs text-slate-400">{dept.id}</p>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors">
                    <MoreVertical size={16} className="text-slate-400" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-300 line-clamp-2">{dept.description}</p>

                {/* Department Info */}
                <div className="space-y-2 border-t border-slate-600 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Users size={16} className="text-green-400 flex-shrink-0" />
                      <span>Members</span>
                    </div>
                    <span className="text-white font-bold">{members.length}</span>
                  </div>

                  {dept.budget && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <DollarSign size={16} className="text-green-400 flex-shrink-0" />
                        <span>Budget</span>
                      </div>
                      <span className="text-white font-bold">${(dept.budget / 1000000).toFixed(1)}M</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin size={16} className="text-amber-400 flex-shrink-0" />
                      <span>Location</span>
                    </div>
                    <span className="text-white font-medium text-sm">{dept.location}</span>
                  </div>
                </div>

                {/* Department Head */}
                {head && (
                  <div className="border-t border-slate-600 pt-4">
                    <p className="text-xs text-slate-400 mb-2">Department Head</p>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <div className="text-lg">{head.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">
                          {head.firstName} {head.lastName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{head.position}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => {
                    setSelectedDept(dept);
                    setShowDetailModal(true);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Detail Modal */}
      {showDetailModal && selectedDept && (() => {
        const head = getDeptHead(selectedDept.headId);
        const members = getDeptMembers(selectedDept.name);

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-96 overflow-y-auto border border-slate-700 shadow-2xl">
              <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800">
                <h2 className="text-2xl font-bold text-white">{selectedDept.name}</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Department ID</p>
                    <p className="text-white font-medium">{selectedDept.id}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Members</p>
                    <p className="text-white font-medium">{members.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Location</p>
                    <p className="text-white font-medium">{selectedDept.location}</p>
                  </div>
                  {selectedDept.budget && (
                    <div>
                      <p className="text-slate-400 text-sm">Annual Budget</p>
                      <p className="text-white font-medium">${(selectedDept.budget / 1000000).toFixed(1)}M</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-slate-400 text-sm">Description</p>
                  <p className="text-slate-300 mt-2">{selectedDept.description}</p>
                </div>

                {/* Department Head */}
                {head && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-white font-bold mb-3">Department Head</h3>
                    <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="text-4xl">{head.avatar}</div>
                      <div className="flex-1">
                        <p className="text-white font-bold">{head.firstName} {head.lastName}</p>
                        <p className="text-blue-300 text-sm">{head.position}</p>
                        <p className="text-slate-400 text-xs mt-1">{head.email}</p>
                        <p className="text-slate-400 text-xs">{head.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Team Members */}
                {members.length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <h3 className="text-white font-bold mb-3">Team Members ({members.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          <div className="text-xl">{member.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-slate-400 text-xs truncate">{member.position}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold flex-shrink-0 ${
                              member.status === 'active'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-slate-600 text-slate-300'
                            }`}
                          >
                            {member.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DepartmentsTab;
