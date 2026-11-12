/**
 * Inventory Services - Barrel Export
 */

// Services
export { FIFOService } from './fifo-service';
export { ExpiryAlertService } from './expiry-alert-service';
export { BatchRecallService } from './batch-recall-service';
export { WeightedAverageCostService } from './weighted-average-cost-service';

// Re-export types from FIFO service
export type {
  BatchConsumption,
  FIFOConsumptionResult,
  FIFOOptions,
} from './fifo-service';

// Re-export types from Expiry Alert service
export type {
  ExpiryAlert,
  ExpiryAlertSummary,
} from './expiry-alert-service';

// Re-export types from Batch Recall service
export type {
  RecallStatus,
  QuarantineReason,
} from './batch-recall-service';

// Re-export types from Weighted Average Cost service
export type {
  WeightedAverageCostResult,
  CostHistoryEntry,
} from './weighted-average-cost-service';
