import { Prisma, CaseStatus, CommitteeDecision } from "@prisma/client";
import prisma from "../../config/prisma";
import { ChartDatum, DashboardAnalyticsResponse, DateRange } from "./Analytics.types";
import { DashboardQuery } from "./Analytics.dto";

// ── Date range helper ────────────────────────────────────────────────────
export function buildDateRange(year?: number, month?: number): DateRange | undefined {
  if (!year) return undefined;

  if (month) {
    return {
      gte: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)),
      lte: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    };
  }

  return {
    gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0)),
    lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

const toChart = <T extends Record<string, unknown>>(rows: T[], nameKey: keyof T): ChartDatum[] =>
  rows.map((r) => ({
    name: String(r[nameKey] ?? "Unknown"),
    value: Number((r["_count"] as { _all: number })._all),
  }));

// ── Financial ────────────────────────────────────────────────────────────
async function getFinancialAnalytics(range?: DateRange) {
  const where = range ? { disbursedDate: range } : {};

  const [byType, totals, monthlyTrend] = await Promise.all([
    prisma.financialSupport.groupBy({ by: ["supportType"], where, _count: { _all: true } }),
    prisma.financialSupport.aggregate({ where, _sum: { amount: true } }),
    // ✅ Quoted table/column names + TO_CHAR instead of DATE_FORMAT (PostgreSQL)
    prisma.$queryRaw<{ month: string; amount: number }[]>`
      SELECT TO_CHAR("disbursedDate", 'YYYY-MM') AS month, SUM(amount) AS amount
      FROM "FinancialSupport"
      ${range ? Prisma.sql`WHERE "disbursedDate" BETWEEN ${range.gte} AND ${range.lte}` : Prisma.empty}
      GROUP BY month
      ORDER BY month ASC
    `,
  ]);

  return {
    byType: toChart(byType, "supportType"),
    totalDisbursed: totals._sum.amount ?? 0,
    monthlyTrend: monthlyTrend.map((m) => ({ name: m.month, amount: Number(m.amount) })),
  };
}

// ── Home Visits ──────────────────────────────────────────────────────────
async function getHomeVisitAnalytics(range?: DateRange) {
  const where = range ? { visitDate: range } : {};

  const [byPurpose, totalVisits, pendingFollowUps] = await Promise.all([
    prisma.homeVisit.groupBy({ by: ["purpose"], where, _count: { _all: true } }),
    prisma.homeVisit.count({ where }),
    prisma.homeVisit.count({
      where: { ...where, isFollowUpDone: false, followUpDate: { lte: new Date() } },
    }),
  ]);

  return { byPurpose: toChart(byPurpose, "purpose"), totalVisits, pendingFollowUps };
}

// ── Health ───────────────────────────────────────────────────────────────
async function getHealthAnalytics(range?: DateRange) {
  const totalRecords = await prisma.healthRecord.count({
    where: range ? { recordDate: range } : {},
  });
  return { totalRecords };
}

// ── Vaccinations ─────────────────────────────────────────────────────────
async function getVaccinationAnalytics(range?: DateRange) {
  const where = range ? { dateGiven: range } : {};
  const now = new Date();

  const [total, overdue, dueSoon] = await Promise.all([
    prisma.vaccination.count({ where }),
    prisma.vaccination.count({ where: { ...where, nextDueDate: { lte: now } } }),
    prisma.vaccination.count({ where: { ...where, nextDueDate: { gt: now } } }),
  ]);

  return { total, overdue, dueSoon };
}

// ── Nutrition ────────────────────────────────────────────────────────────
async function getNutritionAnalytics(range?: DateRange) {
  // ✅ Quoted "NutritionRecord" and "recordDate"
  const buckets = await prisma.$queryRaw<{ bucket: string; value: bigint }[]>`
    SELECT
      CASE
        WHEN bmi IS NULL THEN 'No data'
        WHEN bmi < 18.5 THEN 'Underweight'
        WHEN bmi < 25   THEN 'Normal'
        ELSE 'Overweight'
      END AS bucket,
      COUNT(*) AS value
    FROM "NutritionRecord"
    ${range ? Prisma.sql`WHERE "recordDate" BETWEEN ${range.gte} AND ${range.lte}` : Prisma.empty}
    GROUP BY bucket
  `;

  return { bmiBuckets: buckets.map((b) => ({ name: b.bucket, value: Number(b.value) })) };
}

// ── Education ────────────────────────────────────────────────────────────
async function getEducationAnalytics(range?: DateRange) {
  const where = range ? { createdAt: range } : {};

  const [promotionBreakdown, totalRecords, attendanceAgg] = await Promise.all([
    prisma.academicRecord.groupBy({ by: ["promotionStatus"], where, _count: { _all: true } }),
    prisma.academicRecord.count({ where }),
    prisma.academicRecord.aggregate({ where, _avg: { attendanceRate: true } }),
  ]);

  return {
    promotionBreakdown: toChart(promotionBreakdown, "promotionStatus"),
    totalRecords,
    avgAttendance:
      attendanceAgg._avg.attendanceRate != null
        ? Number(attendanceAgg._avg.attendanceRate.toFixed(1))
        : null,
  };
}

// ── Psychosocial ─────────────────────────────────────────────────────────
async function getPsychosocialAnalytics(range?: DateRange) {
  const [sessionsByType, tbriByPillar] = await Promise.all([
    prisma.psychosocialSession.groupBy({
      by: ["sessionType"],
      where: range ? { sessionDate: range } : {},
      _count: { _all: true },
    }),
    prisma.tBRIActivity.groupBy({
      by: ["tbriPillar"],
      where: range ? { startDate: range } : {},
      _count: { _all: true },
    }),
  ]);

  return {
    sessionsByType: toChart(sessionsByType, "sessionType"),
    tbriByPillar: toChart(tbriByPillar, "tbriPillar"),
  };
}

// ── Safeguarding ─────────────────────────────────────────────────────────
async function getSafeguardingAnalytics(range?: DateRange) {
  const where = range ? { incidentDate: range } : {};

  const [byStatus, byType, openCases] = await Promise.all([
    prisma.safeguardingCase.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.safeguardingCase.groupBy({ by: ["incidentType"], where, _count: { _all: true } }),
    prisma.safeguardingCase.count({
      where: { ...where, status: { in: [CaseStatus.OPEN, CaseStatus.UNDER_INVESTIGATION] } },
    }),
  ]);

  return {
    byStatus: toChart(byStatus, "status"),
    byType: toChart(byType, "incidentType"),
    openCases,
  };
}

// ── Vulnerability Assessment ─────────────────────────────────────────────
async function getVulnerabilityAnalytics(range?: DateRange) {
  const where = range ? { assessmentDate: range } : {};

  const [decisionBreakdown, scoreAgg, pendingAssessments] = await Promise.all([
    prisma.vulnerabilityAssessment.groupBy({
      by: ["committeeDecision"],
      where,
      _count: { _all: true },
    }),
    prisma.vulnerabilityAssessment.aggregate({ where, _avg: { vulnerabilityScore: true } }),
    prisma.vulnerabilityAssessment.count({
      where: { ...where, committeeDecision: CommitteeDecision.PENDING },
    }),
  ]);

  return {
    decisionBreakdown: toChart(decisionBreakdown, "committeeDecision"),
    avgVulnerabilityScore:
      scoreAgg._avg.vulnerabilityScore != null
        ? Number(scoreAgg._avg.vulnerabilityScore.toFixed(1))
        : null,
    pendingAssessments,
  };
}

// ── Other Records ────────────────────────────────────────────────────────
async function getOtherRecordsAnalytics(range?: DateRange) {
  const total = await prisma.childOtherRecord.count({
    where: range ? { createdAt: range } : {},
  });
  return { total };
}

// ── Composed dashboard ───────────────────────────────────────────────────
export async function getDashboardAnalytics(query: DashboardQuery): Promise<DashboardAnalyticsResponse> {
  const range = buildDateRange(query.year, query.month);

  const [
    financial, homeVisits, health, vaccinations, nutrition,
    education, psychosocial, safeguarding, vulnerability, otherRecords,
  ] = await Promise.all([
    getFinancialAnalytics(range),
    getHomeVisitAnalytics(range),
    getHealthAnalytics(range),
    getVaccinationAnalytics(range),
    getNutritionAnalytics(range),
    getEducationAnalytics(range),
    getPsychosocialAnalytics(range),
    getSafeguardingAnalytics(range),
    getVulnerabilityAnalytics(range),
    getOtherRecordsAnalytics(range),
  ]);

  return {
    filters: { year: query.year ?? null, month: query.month ?? null },
    kpis: {
      totalDisbursed: financial.totalDisbursed,
      pendingFollowUps: homeVisits.pendingFollowUps,
      overdueVaccinations: vaccinations.overdue,
      avgAttendance: education.avgAttendance,
      openSafeguardingCases: safeguarding.openCases,
      pendingAssessments: vulnerability.pendingAssessments,
    },
    financial,
    homeVisits,
    health,
    vaccinations,
    nutrition,
    education,
    psychosocial,
    safeguarding,
    vulnerability,
    otherRecords,
  };
}