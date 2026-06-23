

export interface ChartDatum {
  name: string;
  value: number;
}

export interface DashboardFilters {
  year: number | null;
  month: number | null;
}

export interface DashboardKpis {
  totalDisbursed: number;
  pendingFollowUps: number;
  overdueVaccinations: number;
  avgAttendance: number | null;
  openSafeguardingCases: number;
  pendingAssessments: number;
}

export interface FinancialAnalytics {
  byType: ChartDatum[];
  monthlyTrend: { name: string; amount: number }[];
  totalDisbursed: number;
}

export interface HomeVisitAnalytics {
  byPurpose: ChartDatum[];
  totalVisits: number;
  pendingFollowUps: number;
}

export interface HealthAnalytics {
  totalRecords: number;
}

export interface VaccinationAnalytics {
  total: number;
  overdue: number;
  dueSoon: number;
}

export interface NutritionAnalytics {
  bmiBuckets: ChartDatum[];
}

export interface EducationAnalytics {
  promotionBreakdown: ChartDatum[];
  totalRecords: number;
  avgAttendance: number | null;
}

export interface PsychosocialAnalytics {
  sessionsByType: ChartDatum[];
  tbriByPillar: ChartDatum[];
}

export interface SafeguardingAnalytics {
  byStatus: ChartDatum[];
  byType: ChartDatum[];
  openCases: number;
}

export interface VulnerabilityAnalytics {
  decisionBreakdown: ChartDatum[];
  avgVulnerabilityScore: number | null;
  pendingAssessments: number;
}

export interface OtherRecordsAnalytics {
  total: number;
}

export interface DashboardAnalyticsResponse {
  filters: DashboardFilters;
  kpis: DashboardKpis;
  financial: FinancialAnalytics;
  homeVisits: HomeVisitAnalytics;
  health: HealthAnalytics;
  vaccinations: VaccinationAnalytics;
  nutrition: NutritionAnalytics;
  education: EducationAnalytics;
  psychosocial: PsychosocialAnalytics;
  safeguarding: SafeguardingAnalytics;
  vulnerability: VulnerabilityAnalytics;
  otherRecords: OtherRecordsAnalytics;
}

export interface DateRange {
  gte: Date;
  lte: Date;
}