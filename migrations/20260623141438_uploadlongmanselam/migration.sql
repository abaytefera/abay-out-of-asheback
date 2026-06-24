-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'SUSPENDED', 'TRANSFERRED', 'DROPPED');

-- CreateEnum
CREATE TYPE "SchoolWon" AS ENUM ('PRIVATE', 'GOVERMENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED');

-- CreateEnum
CREATE TYPE "IncomeRange" AS ENUM ('NONE', 'BELOW_500', 'RANGE_500_1000', 'RANGE_1001_3000', 'ABOVE_3000');

-- CreateEnum
CREATE TYPE "HousingCondition" AS ENUM ('OWNED', 'RENTED', 'INFORMAL', 'HOMELESS');

-- CreateEnum
CREATE TYPE "WaterAccess" AS ENUM ('PIPED', 'WELL', 'RIVER', 'COMMUNAL_TAP', 'NONE');

-- CreateEnum
CREATE TYPE "SanitationAccess" AS ENUM ('PRIVATE_TOILET', 'SHARED_TOILET', 'OPEN_DEFECATION', 'NONE');

-- CreateEnum
CREATE TYPE "CommitteeDecision" AS ENUM ('APPROVED', 'REJECTED', 'DEFERRED', 'PENDING');

-- CreateEnum
CREATE TYPE "VisitPurpose" AS ENUM ('ROUTINE', 'FOLLOW_UP', 'EMERGENCY', 'INTAKE_ASSESSMENT', 'EXIT_VISIT');

-- CreateEnum
CREATE TYPE "SupportMaterialType" AS ENUM ('SCHOOL_FEES', 'UNIFORM', 'SUPPLIES', 'TUTORING', 'BOOTCAMP');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('ABUSE', 'NEGLECT', 'CHILD_LABOR', 'SCHOOL_VIOLENCE', 'MISSING_CHILD', 'OTHER');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'REFERRED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "TBRIPillar" AS ENUM ('CONNECTING', 'EMPOWERING', 'CORRECTING');

-- CreateEnum
CREATE TYPE "BehavioralState" AS ENUM ('REGULATED', 'HYPER_AROUSAL', 'HYPO_AROUSAL', 'UNREGULATED');

-- CreateEnum
CREATE TYPE "FinancialSupportType" AS ENUM ('SCHOOL_FEES', 'RENT', 'FOOD', 'MEDICAL', 'EMERGENCY_CASH', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "WorkflowType" AS ENUM ('ADMISSION', 'FINANCIAL_REQUEST', 'SAFEGUARDING_CASE', 'EXIT', 'HOME_VISIT_APPROVAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SOCIAL_WORKER', 'EDUCATION_OFFICER', 'FINANCE_OFFICER', 'HEALTH_OFFICER', 'PSYCHOSOCIAL_OFFICER', 'PROGRAM_MANAGER', 'COUNTRY_DIRECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PROMOTED', 'REPEATED', 'PENDING', 'GRADUATED', 'DROPPED_OUT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SAFEGUARDING_ALERT', 'FINANCIAL_APPROVAL_REQUEST', 'HOME_VISIT_DUE', 'ACADEMIC_ALERT', 'SYSTEM_ANNOUNCEMENT', 'DATA_CREATE', 'DATA_UPDATE', 'DATA_DELETE', 'SECURITY_WARNING', 'NEW_VISIT_LOGGED', 'NEW_APPOINTMENT_ASSIGNED', 'UPCOMING_REMINDER', 'TODAY_VISIT_ALERT', 'EMERGENCY_ALERT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "childCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "nationality" TEXT,
    "religion" TEXT,
    "subCity" TEXT,
    "kebele" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "exitDate" TIMESTAMP(3),
    "status" "ChildStatus" NOT NULL DEFAULT 'ACTIVE',
    "schoolName" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "notes" TEXT,
    "householdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildPhoto" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildDocument" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePublicId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "ChildDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildOtherRecord" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildOtherRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildOtherRecordFile" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChildOtherRecordFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "householdCode" TEXT NOT NULL,
    "address" TEXT,
    "subCity" TEXT,
    "kebele" TEXT,
    "housingCondition" "HousingCondition",
    "waterAccess" "WaterAccess",
    "sanitationAccess" "SanitationAccess",
    "hasDisabledMember" BOOLEAN NOT NULL DEFAULT false,
    "numberOfMembers" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "occupation" TEXT,
    "educationLevel" TEXT,
    "maritalStatus" "MaritalStatus",
    "incomeRange" "IncomeRange",
    "isEmergencyContact" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentPhoto" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "frequency" TEXT,

    CONSTRAINT "IncomeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VulnerabilityAssessment" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL,
    "assessorId" TEXT,
    "isOrphan" BOOLEAN NOT NULL DEFAULT false,
    "isSingleParent" BOOLEAN NOT NULL DEFAULT false,
    "isExtremePoverty" BOOLEAN NOT NULL DEFAULT false,
    "childLaborRisk" BOOLEAN NOT NULL DEFAULT false,
    "highAbsenteeism" BOOLEAN NOT NULL DEFAULT false,
    "vulnerabilityScore" INTEGER NOT NULL,
    "committeeDate" TIMESTAMP(3),
    "committeeDecision" "CommitteeDecision" NOT NULL DEFAULT 'PENDING',
    "committeeNotes" TEXT,
    "approvedById" TEXT,
    "approvalHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VulnerabilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentEvidenceFile" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentEvidenceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeVisit" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT,
    "purpose" "VisitPurpose" NOT NULL,
    "observations" TEXT,
    "familyNeeds" TEXT,
    "actionItems" TEXT,
    "followUpDate" TIMESTAMP(3),
    "isFollowUpDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeVisitPhoto" (
    "id" TEXT NOT NULL,
    "homeVisitId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeVisitPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeVisitAppointment" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeVisitAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicRecord" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" TEXT,
    "grade" TEXT NOT NULL,
    "rank" INTEGER,
    "averageScore" DOUBLE PRECISION,
    "attendanceRate" DOUBLE PRECISION,
    "nationalExamScore" DOUBLE PRECISION,
    "promotionStatus" "PromotionStatus" NOT NULL DEFAULT 'PENDING',
    "teacherNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicFile" (
    "id" TEXT NOT NULL,
    "academicRecordId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EducationAlert" (
    "id" TEXT NOT NULL,
    "academicRecordId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducationAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialSupport" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "type" "SupportMaterialType" NOT NULL,
    "description" TEXT,
    "quantity" INTEGER,
    "distributeDate" TIMESTAMP(3) NOT NULL,
    "distributedById" TEXT,
    "academicYear" TEXT,

    CONSTRAINT "MaterialSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "country" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "organization" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorPhoto" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsorPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "monthlyAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorReport" (
    "id" TEXT NOT NULL,
    "sponsorshipId" TEXT NOT NULL,
    "sentDate" TIMESTAMP(3) NOT NULL,
    "reportType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorReportFile" (
    "id" TEXT NOT NULL,
    "donorReportId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DonorReportFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeguardingCase" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "reportedById" TEXT,
    "incidentType" "IncidentType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "actionPlan" TEXT,
    "externalReferral" TEXT,
    "followUpNotes" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafeguardingCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeguardingViewer" (
    "id" TEXT NOT NULL,
    "safeguardingCaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafeguardingViewer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "knownDisabilities" TEXT,
    "hospitalVisitReason" TEXT,
    "hospitalName" TEXT,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecordFile" (
    "id" TEXT NOT NULL,
    "healthRecordId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthRecordFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "dateGiven" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "administeredBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaccinationFile" (
    "id" TEXT NOT NULL,
    "vaccinationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VaccinationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionRecord" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "notes" TEXT,
    "recordedById" TEXT,

    CONSTRAINT "NutritionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychosocialSession" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "counselorId" TEXT,
    "sessionType" TEXT NOT NULL,
    "behavioralConcerns" TEXT,
    "traumaAssessment" TEXT,
    "progressNotes" TEXT,
    "nextSessionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsychosocialSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBRIActivity" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "tbriPillar" "TBRIPillar" NOT NULL,
    "facilitatorId" TEXT,
    "initialState" "BehavioralState" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TBRIActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBRILog" (
    "id" TEXT NOT NULL,
    "tbriActivityId" TEXT NOT NULL,
    "authorId" TEXT,
    "strategyUsed" TEXT,
    "observations" TEXT NOT NULL,
    "outcomes" TEXT NOT NULL,
    "resultingState" "BehavioralState" NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TBRILog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialSupport" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "supportType" "FinancialSupportType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "disbursedDate" TIMESTAMP(3) NOT NULL,
    "disbursedById" TEXT,
    "academicYear" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialSupportFile" (
    "id" TEXT NOT NULL,
    "financialSupportId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialSupportFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "avatarUrl" TEXT,
    "avatarPublicId" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "hireDate" TIMESTAMP(3),
    "backgroundCheckStatus" TEXT,
    "backgroundCheckDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "goals" TEXT,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "childRegister" BOOLEAN NOT NULL DEFAULT false,
    "childUpdate" BOOLEAN NOT NULL DEFAULT false,
    "childDelete" BOOLEAN NOT NULL DEFAULT false,
    "childView" BOOLEAN NOT NULL DEFAULT true,
    "employeeRegister" BOOLEAN NOT NULL DEFAULT false,
    "employeeUpdate" BOOLEAN NOT NULL DEFAULT false,
    "employeeDelete" BOOLEAN NOT NULL DEFAULT false,
    "employeeView" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "childId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "relatedId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schoolname" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SchoolWon" NOT NULL,

    CONSTRAINT "Schoolname_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Child_childCode_key" ON "Child"("childCode");

-- CreateIndex
CREATE INDEX "Child_status_idx" ON "Child"("status");

-- CreateIndex
CREATE INDEX "Child_subCity_idx" ON "Child"("subCity");

-- CreateIndex
CREATE INDEX "Child_admissionDate_idx" ON "Child"("admissionDate");

-- CreateIndex
CREATE INDEX "ChildPhoto_childId_idx" ON "ChildPhoto"("childId");

-- CreateIndex
CREATE INDEX "ChildDocument_childId_idx" ON "ChildDocument"("childId");

-- CreateIndex
CREATE INDEX "ChildOtherRecord_childId_idx" ON "ChildOtherRecord"("childId");

-- CreateIndex
CREATE INDEX "ChildOtherRecordFile_recordId_idx" ON "ChildOtherRecordFile"("recordId");

-- CreateIndex
CREATE INDEX "ChildOtherRecordFile_publicId_idx" ON "ChildOtherRecordFile"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Household_householdCode_key" ON "Household"("householdCode");

-- CreateIndex
CREATE INDEX "Guardian_householdId_idx" ON "Guardian"("householdId");

-- CreateIndex
CREATE INDEX "ParentPhoto_guardianId_idx" ON "ParentPhoto"("guardianId");

-- CreateIndex
CREATE INDEX "VulnerabilityAssessment_childId_idx" ON "VulnerabilityAssessment"("childId");

-- CreateIndex
CREATE INDEX "VulnerabilityAssessment_committeeDecision_idx" ON "VulnerabilityAssessment"("committeeDecision");

-- CreateIndex
CREATE INDEX "AssessmentEvidenceFile_assessmentId_idx" ON "AssessmentEvidenceFile"("assessmentId");

-- CreateIndex
CREATE INDEX "HomeVisit_childId_idx" ON "HomeVisit"("childId");

-- CreateIndex
CREATE INDEX "HomeVisit_visitDate_idx" ON "HomeVisit"("visitDate");

-- CreateIndex
CREATE INDEX "HomeVisit_followUpDate_idx" ON "HomeVisit"("followUpDate");

-- CreateIndex
CREATE INDEX "HomeVisitPhoto_homeVisitId_idx" ON "HomeVisitPhoto"("homeVisitId");

-- CreateIndex
CREATE INDEX "HomeVisitAppointment_assignedToId_idx" ON "HomeVisitAppointment"("assignedToId");

-- CreateIndex
CREATE INDEX "HomeVisitAppointment_appointmentDate_idx" ON "HomeVisitAppointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "AcademicRecord_childId_idx" ON "AcademicRecord"("childId");

-- CreateIndex
CREATE INDEX "AcademicRecord_academicYear_idx" ON "AcademicRecord"("academicYear");

-- CreateIndex
CREATE INDEX "AcademicFile_academicRecordId_idx" ON "AcademicFile"("academicRecordId");

-- CreateIndex
CREATE INDEX "EducationAlert_isResolved_idx" ON "EducationAlert"("isResolved");

-- CreateIndex
CREATE INDEX "MaterialSupport_childId_idx" ON "MaterialSupport"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_email_key" ON "Sponsor"("email");

-- CreateIndex
CREATE INDEX "SponsorPhoto_sponsorId_idx" ON "SponsorPhoto"("sponsorId");

-- CreateIndex
CREATE INDEX "Sponsorship_childId_idx" ON "Sponsorship"("childId");

-- CreateIndex
CREATE INDEX "Sponsorship_sponsorId_idx" ON "Sponsorship"("sponsorId");

-- CreateIndex
CREATE INDEX "DonorReport_sponsorshipId_idx" ON "DonorReport"("sponsorshipId");

-- CreateIndex
CREATE INDEX "DonorReportFile_donorReportId_idx" ON "DonorReportFile"("donorReportId");

-- CreateIndex
CREATE INDEX "SafeguardingCase_childId_idx" ON "SafeguardingCase"("childId");

-- CreateIndex
CREATE INDEX "SafeguardingCase_status_idx" ON "SafeguardingCase"("status");

-- CreateIndex
CREATE INDEX "SafeguardingViewer_safeguardingCaseId_idx" ON "SafeguardingViewer"("safeguardingCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "SafeguardingViewer_safeguardingCaseId_userId_key" ON "SafeguardingViewer"("safeguardingCaseId", "userId");

-- CreateIndex
CREATE INDEX "HealthRecord_childId_idx" ON "HealthRecord"("childId");

-- CreateIndex
CREATE INDEX "HealthRecordFile_healthRecordId_idx" ON "HealthRecordFile"("healthRecordId");

-- CreateIndex
CREATE INDEX "Vaccination_childId_idx" ON "Vaccination"("childId");

-- CreateIndex
CREATE INDEX "VaccinationFile_vaccinationId_idx" ON "VaccinationFile"("vaccinationId");

-- CreateIndex
CREATE INDEX "NutritionRecord_childId_idx" ON "NutritionRecord"("childId");

-- CreateIndex
CREATE INDEX "PsychosocialSession_childId_idx" ON "PsychosocialSession"("childId");

-- CreateIndex
CREATE INDEX "TBRIActivity_childId_idx" ON "TBRIActivity"("childId");

-- CreateIndex
CREATE INDEX "TBRIActivity_tbriPillar_idx" ON "TBRIActivity"("tbriPillar");

-- CreateIndex
CREATE INDEX "TBRILog_tbriActivityId_idx" ON "TBRILog"("tbriActivityId");

-- CreateIndex
CREATE INDEX "TBRILog_loggedAt_idx" ON "TBRILog"("loggedAt");

-- CreateIndex
CREATE INDEX "FinancialSupport_childId_idx" ON "FinancialSupport"("childId");

-- CreateIndex
CREATE INDEX "FinancialSupport_disbursedDate_idx" ON "FinancialSupport"("disbursedDate");

-- CreateIndex
CREATE INDEX "FinancialSupport_supportType_idx" ON "FinancialSupport"("supportType");

-- CreateIndex
CREATE INDEX "FinancialSupportFile_financialSupportId_idx" ON "FinancialSupportFile"("financialSupportId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_userId_key" ON "Permission"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildPhoto" ADD CONSTRAINT "ChildPhoto_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildDocument" ADD CONSTRAINT "ChildDocument_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildDocument" ADD CONSTRAINT "ChildDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildOtherRecord" ADD CONSTRAINT "ChildOtherRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildOtherRecordFile" ADD CONSTRAINT "ChildOtherRecordFile_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ChildOtherRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentPhoto" ADD CONSTRAINT "ParentPhoto_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeSource" ADD CONSTRAINT "IncomeSource_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VulnerabilityAssessment" ADD CONSTRAINT "VulnerabilityAssessment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VulnerabilityAssessment" ADD CONSTRAINT "VulnerabilityAssessment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VulnerabilityAssessment" ADD CONSTRAINT "VulnerabilityAssessment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentEvidenceFile" ADD CONSTRAINT "AssessmentEvidenceFile_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "VulnerabilityAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisitPhoto" ADD CONSTRAINT "HomeVisitPhoto_homeVisitId_fkey" FOREIGN KEY ("homeVisitId") REFERENCES "HomeVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisitAppointment" ADD CONSTRAINT "HomeVisitAppointment_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisitAppointment" ADD CONSTRAINT "HomeVisitAppointment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicFile" ADD CONSTRAINT "AcademicFile_academicRecordId_fkey" FOREIGN KEY ("academicRecordId") REFERENCES "AcademicRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationAlert" ADD CONSTRAINT "EducationAlert_academicRecordId_fkey" FOREIGN KEY ("academicRecordId") REFERENCES "AcademicRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationAlert" ADD CONSTRAINT "EducationAlert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialSupport" ADD CONSTRAINT "MaterialSupport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialSupport" ADD CONSTRAINT "MaterialSupport_distributedById_fkey" FOREIGN KEY ("distributedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorPhoto" ADD CONSTRAINT "SponsorPhoto_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorReport" ADD CONSTRAINT "DonorReport_sponsorshipId_fkey" FOREIGN KEY ("sponsorshipId") REFERENCES "Sponsorship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorReportFile" ADD CONSTRAINT "DonorReportFile_donorReportId_fkey" FOREIGN KEY ("donorReportId") REFERENCES "DonorReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeguardingCase" ADD CONSTRAINT "SafeguardingCase_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeguardingCase" ADD CONSTRAINT "SafeguardingCase_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeguardingCase" ADD CONSTRAINT "SafeguardingCase_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeguardingViewer" ADD CONSTRAINT "SafeguardingViewer_safeguardingCaseId_fkey" FOREIGN KEY ("safeguardingCaseId") REFERENCES "SafeguardingCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecordFile" ADD CONSTRAINT "HealthRecordFile_healthRecordId_fkey" FOREIGN KEY ("healthRecordId") REFERENCES "HealthRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaccinationFile" ADD CONSTRAINT "VaccinationFile_vaccinationId_fkey" FOREIGN KEY ("vaccinationId") REFERENCES "Vaccination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRecord" ADD CONSTRAINT "NutritionRecord_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionRecord" ADD CONSTRAINT "NutritionRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychosocialSession" ADD CONSTRAINT "PsychosocialSession_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychosocialSession" ADD CONSTRAINT "PsychosocialSession_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBRIActivity" ADD CONSTRAINT "TBRIActivity_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBRIActivity" ADD CONSTRAINT "TBRIActivity_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBRILog" ADD CONSTRAINT "TBRILog_tbriActivityId_fkey" FOREIGN KEY ("tbriActivityId") REFERENCES "TBRIActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBRILog" ADD CONSTRAINT "TBRILog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialSupport" ADD CONSTRAINT "FinancialSupport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialSupport" ADD CONSTRAINT "FinancialSupport_disbursedById_fkey" FOREIGN KEY ("disbursedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialSupportFile" ADD CONSTRAINT "FinancialSupportFile_financialSupportId_fkey" FOREIGN KEY ("financialSupportId") REFERENCES "FinancialSupport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
