export interface TeamMessage {
  id: string;
  senderId: string;
  teamId?: string;
  departmentId?: string;
  content: string;
  attachments?: string[];
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
  readBy: string[];
}

export interface DirectorOrder {
  id: string;
  directorId: string;
  companyId: string;
  title: string;
  description: string;
  assignedTo: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InterDepartmentRequest {
  id: string;
  requesterId: string;
  requesterDepartment: string;
  targetDepartment: string;
  companyId: string;
  title: string;
  description: string;
  requestType: 'purchase' | 'information' | 'support' | 'urgent-need';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed';
  approvals: { userId: string; status: 'pending' | 'approved' | 'rejected'; timestamp: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: TeamMessage;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}
