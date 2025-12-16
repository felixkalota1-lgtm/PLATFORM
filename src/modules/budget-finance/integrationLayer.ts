import { useEffect, useState, useCallback } from 'react';
import { eventBus, INTEGRATION_EVENTS } from '../../services/integrationEventBus';

// ============================================================================
// Budget & Finance Integration Layer
// Real-time budget tracking, spend monitoring, and approval workflows
// ============================================================================

interface BudgetAllocation {
  id: string;
  department: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  fiscalYear: number;
  status: 'active' | 'paused' | 'exhausted';
}

interface BudgetRequest {
  id: string;
  department: string;
  requestedAmount: number;
  reason: string;
  createdDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: Date;
}

// Hook 1: Real-time budget tracking
export function useBudgetTracking() {
  const [budgets, setBudgets] = useState<Map<string, BudgetAllocation>>(new Map());

  useEffect(() => {
    const handleExpense = (data: any) => {
      if (data.department && data.amount) {
        recordExpense(data.department, data.amount);
      }
    };

    const handleProcurementOrder = (data: any) => {
      if (data.department && data.totalAmount) {
        recordExpense(data.department, data.totalAmount);
      }
    };

    eventBus.on(INTEGRATION_EVENTS.INVOICE_CREATED, handleExpense);
    eventBus.on(INTEGRATION_EVENTS.PROCUREMENT_ORDER_CREATED, handleProcurementOrder);

    return () => {
      eventBus.removeAllListeners(INTEGRATION_EVENTS.INVOICE_CREATED);
      eventBus.removeAllListeners(INTEGRATION_EVENTS.PROCUREMENT_ORDER_CREATED);
    };
  }, []);

  const allocateBudget = useCallback(
    (department: string, category: string, amount: number, fiscalYear: number) => {
      const budgetKey = `${department}-${category}`;

      const allocation: BudgetAllocation = {
        id: `BDG-${Date.now()}`,
        department,
        category,
        allocatedAmount: amount,
        spentAmount: 0,
        remainingAmount: amount,
        fiscalYear,
        status: 'active',
      };

      setBudgets((prev) => new Map(prev).set(budgetKey, allocation));

      eventBus.emit(INTEGRATION_EVENTS.BUDGET_ALLOCATED, {
        department,
        category,
        amount,
        fiscalYear,
        timestamp: new Date(),
      });
    },
    []
  );

  const recordExpense = useCallback((department: string, amount: number) => {
    setBudgets((prev) => {
      const updated = new Map(prev);
      updated.forEach((budget) => {
        if (budget.department === department) {
          budget.spentAmount += amount;
          budget.remainingAmount = budget.allocatedAmount - budget.spentAmount;

          const usagePercentage = (budget.spentAmount / budget.allocatedAmount) * 100;

          if (usagePercentage >= 90) {
            eventBus.emit(INTEGRATION_EVENTS.BUDGET_THRESHOLD_EXCEEDED, {
              department,
              category: budget.category,
              usagePercentage,
              remaining: budget.remainingAmount,
              timestamp: new Date(),
            });
          }

          if (budget.remainingAmount <= 0) {
            budget.status = 'exhausted';
            eventBus.emit(INTEGRATION_EVENTS.BUDGET_EXHAUSTED, {
              department,
              category: budget.category,
              timestamp: new Date(),
            });
          }
        }
      });
      return updated;
    });
  }, []);

  return {
    budgets,
    allocateBudget,
    recordExpense,
  };
}

// Hook 2: Budget approval workflow
export function useBudgetApprovalWorkflow() {
  const [requests, setRequests] = useState<BudgetRequest[]>([]);

  const createBudgetRequest = useCallback((department: string, amount: number, reason: string) => {
    const requestId = `BREQ-${Date.now()}`;

    const request: BudgetRequest = {
      id: requestId,
      department,
      requestedAmount: amount,
      reason,
      createdDate: new Date(),
      status: 'pending',
    };

    setRequests((prev) => [...prev, request]);

    eventBus.emit(INTEGRATION_EVENTS.BUDGET_REQUEST_CREATED, {
      requestId,
      department,
      amount,
      timestamp: new Date(),
    });

    return requestId;
  }, []);

  const approveBudgetRequest = useCallback((requestId: string, approvedBy: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              approvedBy,
              approvalDate: new Date(),
            }
          : r
      )
    );

    const request = requests.find((r) => r.id === requestId);
    if (request) {
      eventBus.emit(INTEGRATION_EVENTS.BUDGET_REQUEST_APPROVED, {
        requestId,
        department: request.department,
        amount: request.requestedAmount,
        approvedBy,
        timestamp: new Date(),
      });
    }
  }, [requests]);

  const rejectBudgetRequest = useCallback((requestId: string) => {
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r)));

    eventBus.emit(INTEGRATION_EVENTS.BUDGET_REQUEST_REJECTED, {
      requestId,
      timestamp: new Date(),
    });
  }, []);

  return {
    requests,
    createBudgetRequest,
    approveBudgetRequest,
    rejectBudgetRequest,
  };
}

// Hook 3: Budget forecasting and alerts
export function useBudgetAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  const checkBudgetHealth = useCallback((budgets: Map<string, any>) => {
    budgets.forEach((budget) => {
      const usagePercentage = (budget.spentAmount / budget.allocatedAmount) * 100;

      if (usagePercentage > 75 && usagePercentage < 90) {
        const alertId = `ALT-${Date.now()}`;
        setAlerts((prev) => [...prev, { id: alertId, type: 'high_usage', budget }]);

        eventBus.emit(INTEGRATION_EVENTS.BUDGET_WARNING, {
          department: budget.department,
          usagePercentage,
          timestamp: new Date(),
        });
      }
    });
  }, []);

  return {
    alerts,
    checkBudgetHealth,
  };
}
