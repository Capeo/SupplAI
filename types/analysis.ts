export interface AnalysisResponse {
  tenderRequirements: string,
  qualificationAnalysis: string;
  requiresApproval?: boolean;
  companyStatus?: boolean;
  success: boolean;
} 