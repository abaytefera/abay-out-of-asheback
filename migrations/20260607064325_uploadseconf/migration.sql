-- CreateTable
CREATE TABLE `Child` (
    `id` VARCHAR(191) NOT NULL,
    `childCode` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `nationality` VARCHAR(191) NULL,
    `religion` VARCHAR(191) NULL,
    `subCity` VARCHAR(191) NULL,
    `kebele` VARCHAR(191) NULL,
    `admissionDate` DATETIME(3) NOT NULL,
    `exitDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'GRADUATED', 'SUSPENDED', 'TRANSFERRED', 'DROPPED') NOT NULL DEFAULT 'ACTIVE',
    `profilePhotoUrl` VARCHAR(191) NULL,
    `profilePhotoPublicId` VARCHAR(191) NULL,
    `schoolName` VARCHAR(191) NULL,
    `emergencyContactName` VARCHAR(191) NULL,
    `emergencyContactPhone` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `householdId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Child_childCode_key`(`childCode`),
    INDEX `Child_status_idx`(`status`),
    INDEX `Child_subCity_idx`(`subCity`),
    INDEX `Child_admissionDate_idx`(`admissionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChildPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChildPhoto_childId_idx`(`childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChildDocument` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `filePublicId` VARCHAR(191) NOT NULL,
    `uploadedById` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,

    INDEX `ChildDocument_childId_idx`(`childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Household` (
    `id` VARCHAR(191) NOT NULL,
    `householdCode` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `subCity` VARCHAR(191) NULL,
    `kebele` VARCHAR(191) NULL,
    `housingCondition` ENUM('OWNED', 'RENTED', 'INFORMAL', 'HOMELESS') NULL,
    `waterAccess` ENUM('PIPED', 'WELL', 'RIVER', 'COMMUNAL_TAP', 'NONE') NULL,
    `sanitationAccess` ENUM('PRIVATE_TOILET', 'SHARED_TOILET', 'OPEN_DEFECATION', 'NONE') NULL,
    `hasDisabledMember` BOOLEAN NOT NULL DEFAULT false,
    `numberOfMembers` INTEGER NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Household_householdCode_key`(`householdCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Guardian` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `relationship` VARCHAR(191) NOT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `photoPublicId` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `occupation` VARCHAR(191) NULL,
    `educationLevel` VARCHAR(191) NULL,
    `maritalStatus` ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED') NULL,
    `incomeRange` ENUM('NONE', 'BELOW_500', 'RANGE_500_1000', 'RANGE_1001_3000', 'ABOVE_3000') NULL,
    `isEmergencyContact` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Guardian_householdId_idx`(`householdId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IncomeSource` (
    `id` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NULL,
    `frequency` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VulnerabilityAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `assessmentDate` DATETIME(3) NOT NULL,
    `assessorId` VARCHAR(191) NOT NULL,
    `isOrphan` BOOLEAN NOT NULL DEFAULT false,
    `isSingleParent` BOOLEAN NOT NULL DEFAULT false,
    `isExtremePoverty` BOOLEAN NOT NULL DEFAULT false,
    `childLaborRisk` BOOLEAN NOT NULL DEFAULT false,
    `highAbsenteeism` BOOLEAN NOT NULL DEFAULT false,
    `vulnerabilityScore` INTEGER NOT NULL,
    `committeeDate` DATETIME(3) NULL,
    `committeeDecision` ENUM('APPROVED', 'REJECTED', 'DEFERRED', 'PENDING') NOT NULL DEFAULT 'PENDING',
    `committeeNotes` TEXT NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvalHistory` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VulnerabilityAssessment_childId_idx`(`childId`),
    INDEX `VulnerabilityAssessment_committeeDecision_idx`(`committeeDecision`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssessmentEvidenceFile` (
    `id` VARCHAR(191) NOT NULL,
    `assessmentId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AssessmentEvidenceFile_assessmentId_idx`(`assessmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomeVisit` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `visitDate` DATETIME(3) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `purpose` ENUM('ROUTINE', 'FOLLOW_UP', 'EMERGENCY', 'INTAKE_ASSESSMENT', 'EXIT_VISIT') NOT NULL,
    `observations` TEXT NULL,
    `familyNeeds` TEXT NULL,
    `actionItems` TEXT NULL,
    `followUpDate` DATETIME(3) NULL,
    `isFollowUpDone` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HomeVisit_childId_idx`(`childId`),
    INDEX `HomeVisit_visitDate_idx`(`visitDate`),
    INDEX `HomeVisit_followUpDate_idx`(`followUpDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomeVisitPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `homeVisitId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HomeVisitPhoto_homeVisitId_idx`(`homeVisitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcademicRecord` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `schoolName` VARCHAR(191) NOT NULL,
    `academicYear` VARCHAR(191) NOT NULL,
    `semester` VARCHAR(191) NULL,
    `grade` VARCHAR(191) NOT NULL,
    `averageScore` DOUBLE NULL,
    `attendanceRate` DOUBLE NULL,
    `nationalExamScore` DOUBLE NULL,
    `promotionStatus` ENUM('PROMOTED', 'REPEATED', 'PENDING', 'GRADUATED', 'DROPPED_OUT') NOT NULL DEFAULT 'PENDING',
    `teacherNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AcademicRecord_childId_idx`(`childId`),
    INDEX `AcademicRecord_academicYear_idx`(`academicYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AcademicFile` (
    `id` VARCHAR(191) NOT NULL,
    `academicRecordId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AcademicFile_academicRecordId_idx`(`academicRecordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EducationAlert` (
    `id` VARCHAR(191) NOT NULL,
    `academicRecordId` VARCHAR(191) NOT NULL,
    `alertType` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedById` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EducationAlert_isResolved_idx`(`isResolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialSupport` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `type` ENUM('SCHOOL_FEES', 'UNIFORM', 'SUPPLIES', 'TUTORING', 'BOOTCAMP') NOT NULL,
    `description` VARCHAR(191) NULL,
    `quantity` INTEGER NULL,
    `distributeDate` DATETIME(3) NOT NULL,
    `distributedById` VARCHAR(191) NOT NULL,
    `academicYear` VARCHAR(191) NULL,

    INDEX `MaterialSupport_childId_idx`(`childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sponsor` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `organization` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Sponsor_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SponsorPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `sponsorId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SponsorPhoto_sponsorId_idx`(`sponsorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sponsorship` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `sponsorId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `monthlyAmount` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sponsorship_childId_idx`(`childId`),
    INDEX `Sponsorship_sponsorId_idx`(`sponsorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DonorReport` (
    `id` VARCHAR(191) NOT NULL,
    `sponsorshipId` VARCHAR(191) NOT NULL,
    `sentDate` DATETIME(3) NOT NULL,
    `reportType` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DonorReport_sponsorshipId_idx`(`sponsorshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DonorReportFile` (
    `id` VARCHAR(191) NOT NULL,
    `donorReportId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DonorReportFile_donorReportId_idx`(`donorReportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SafeguardingCase` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `incidentDate` DATETIME(3) NOT NULL,
    `reportedById` VARCHAR(191) NOT NULL,
    `incidentType` ENUM('ABUSE', 'NEGLECT', 'CHILD_LABOR', 'SCHOOL_VIOLENCE', 'MISSING_CHILD', 'OTHER') NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('OPEN', 'UNDER_INVESTIGATION', 'REFERRED', 'CLOSED', 'REOPENED') NOT NULL DEFAULT 'OPEN',
    `actionPlan` TEXT NULL,
    `externalReferral` VARCHAR(191) NULL,
    `followUpNotes` TEXT NULL,
    `closedAt` DATETIME(3) NULL,
    `closedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SafeguardingCase_childId_idx`(`childId`),
    INDEX `SafeguardingCase_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SafeguardingViewer` (
    `id` VARCHAR(191) NOT NULL,
    `safeguardingCaseId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SafeguardingViewer_safeguardingCaseId_idx`(`safeguardingCaseId`),
    UNIQUE INDEX `SafeguardingViewer_safeguardingCaseId_userId_key`(`safeguardingCaseId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HealthRecord` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `recordDate` DATETIME(3) NOT NULL,
    `knownDisabilities` TEXT NULL,
    `hospitalVisitReason` VARCHAR(191) NULL,
    `hospitalName` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `recordedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HealthRecord_childId_idx`(`childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HealthRecordFile` (
    `id` VARCHAR(191) NOT NULL,
    `healthRecordId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HealthRecordFile_healthRecordId_idx`(`healthRecordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vaccination` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `vaccineName` VARCHAR(191) NOT NULL,
    `dateGiven` DATETIME(3) NOT NULL,
    `nextDueDate` DATETIME(3) NULL,
    `administeredBy` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `certificateUrl` VARCHAR(191) NULL,
    `certificatePublicId` VARCHAR(191) NULL,

    INDEX `Vaccination_childId_idx`(`childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NutritionRecord` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `recordDate` DATETIME(3) NOT NULL,
    `heightCm` DOUBLE NULL,
    `weightKg` DOUBLE NULL,
    `bmi` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `recordedById` VARCHAR(191) NOT NULL,

    INDEX `NutritionRecord_childId_idx`(`childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PsychosocialSession` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `sessionDate` DATETIME(3) NOT NULL,
    `counselorId` VARCHAR(191) NOT NULL,
    `sessionType` VARCHAR(191) NOT NULL,
    `behavioralConcerns` TEXT NULL,
    `traumaAssessment` TEXT NULL,
    `progressNotes` TEXT NULL,
    `nextSessionDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PsychosocialSession_childId_idx`(`childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBRIActivity` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `activityName` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `tbriPillar` ENUM('CONNECTING', 'EMPOWERING', 'CORRECTING') NOT NULL,
    `facilitatorId` VARCHAR(191) NOT NULL,
    `initialState` ENUM('REGULATED', 'HYPER_AROUSAL', 'HYPO_AROUSAL', 'UNREGULATED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TBRIActivity_childId_idx`(`childId`),
    INDEX `TBRIActivity_tbriPillar_idx`(`tbriPillar`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBRILog` (
    `id` VARCHAR(191) NOT NULL,
    `tbriActivityId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `strategyUsed` VARCHAR(191) NULL,
    `observations` TEXT NOT NULL,
    `outcomes` TEXT NOT NULL,
    `resultingState` ENUM('REGULATED', 'HYPER_AROUSAL', 'HYPO_AROUSAL', 'UNREGULATED') NOT NULL,
    `loggedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TBRILog_tbriActivityId_idx`(`tbriActivityId`),
    INDEX `TBRILog_loggedAt_idx`(`loggedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancialSupport` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `supportType` ENUM('SCHOOL_FEES', 'RENT', 'FOOD', 'MEDICAL', 'EMERGENCY_CASH', 'OTHER') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ETB',
    `disbursedDate` DATETIME(3) NOT NULL,
    `disbursedById` VARCHAR(191) NOT NULL,
    `academicYear` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FinancialSupport_childId_idx`(`childId`),
    INDEX `FinancialSupport_disbursedDate_idx`(`disbursedDate`),
    INDEX `FinancialSupport_supportType_idx`(`supportType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancialSupportFile` (
    `id` VARCHAR(191) NOT NULL,
    `financialSupportId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FinancialSupportFile_financialSupportId_idx`(`financialSupportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('SOCIAL_WORKER', 'EDUCATION_OFFICER', 'FINANCE_OFFICER', 'PROGRAM_MANAGER', 'COUNTRY_DIRECTOR', 'ADMIN') NOT NULL,
    `phone` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `avatarPublicId` VARCHAR(191) NULL,
    `jobTitle` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `hireDate` DATETIME(3) NULL,
    `backgroundCheckStatus` VARCHAR(191) NULL,
    `backgroundCheckDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerformanceReview` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `reviewDate` DATETIME(3) NOT NULL,
    `reviewedById` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comments` TEXT NULL,
    `goals` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_resource_idx`(`resource`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Child` ADD CONSTRAINT `Child_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChildPhoto` ADD CONSTRAINT `ChildPhoto_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChildDocument` ADD CONSTRAINT `ChildDocument_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChildDocument` ADD CONSTRAINT `ChildDocument_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Guardian` ADD CONSTRAINT `Guardian_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IncomeSource` ADD CONSTRAINT `IncomeSource_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VulnerabilityAssessment` ADD CONSTRAINT `VulnerabilityAssessment_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VulnerabilityAssessment` ADD CONSTRAINT `VulnerabilityAssessment_assessorId_fkey` FOREIGN KEY (`assessorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VulnerabilityAssessment` ADD CONSTRAINT `VulnerabilityAssessment_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssessmentEvidenceFile` ADD CONSTRAINT `AssessmentEvidenceFile_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `VulnerabilityAssessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HomeVisit` ADD CONSTRAINT `HomeVisit_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HomeVisit` ADD CONSTRAINT `HomeVisit_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HomeVisitPhoto` ADD CONSTRAINT `HomeVisitPhoto_homeVisitId_fkey` FOREIGN KEY (`homeVisitId`) REFERENCES `HomeVisit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AcademicRecord` ADD CONSTRAINT `AcademicRecord_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AcademicFile` ADD CONSTRAINT `AcademicFile_academicRecordId_fkey` FOREIGN KEY (`academicRecordId`) REFERENCES `AcademicRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EducationAlert` ADD CONSTRAINT `EducationAlert_academicRecordId_fkey` FOREIGN KEY (`academicRecordId`) REFERENCES `AcademicRecord`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EducationAlert` ADD CONSTRAINT `EducationAlert_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialSupport` ADD CONSTRAINT `MaterialSupport_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialSupport` ADD CONSTRAINT `MaterialSupport_distributedById_fkey` FOREIGN KEY (`distributedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SponsorPhoto` ADD CONSTRAINT `SponsorPhoto_sponsorId_fkey` FOREIGN KEY (`sponsorId`) REFERENCES `Sponsor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sponsorship` ADD CONSTRAINT `Sponsorship_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sponsorship` ADD CONSTRAINT `Sponsorship_sponsorId_fkey` FOREIGN KEY (`sponsorId`) REFERENCES `Sponsor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DonorReport` ADD CONSTRAINT `DonorReport_sponsorshipId_fkey` FOREIGN KEY (`sponsorshipId`) REFERENCES `Sponsorship`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DonorReportFile` ADD CONSTRAINT `DonorReportFile_donorReportId_fkey` FOREIGN KEY (`donorReportId`) REFERENCES `DonorReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SafeguardingCase` ADD CONSTRAINT `SafeguardingCase_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SafeguardingCase` ADD CONSTRAINT `SafeguardingCase_reportedById_fkey` FOREIGN KEY (`reportedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SafeguardingCase` ADD CONSTRAINT `SafeguardingCase_closedById_fkey` FOREIGN KEY (`closedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SafeguardingViewer` ADD CONSTRAINT `SafeguardingViewer_safeguardingCaseId_fkey` FOREIGN KEY (`safeguardingCaseId`) REFERENCES `SafeguardingCase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthRecord` ADD CONSTRAINT `HealthRecord_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthRecord` ADD CONSTRAINT `HealthRecord_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthRecordFile` ADD CONSTRAINT `HealthRecordFile_healthRecordId_fkey` FOREIGN KEY (`healthRecordId`) REFERENCES `HealthRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vaccination` ADD CONSTRAINT `Vaccination_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NutritionRecord` ADD CONSTRAINT `NutritionRecord_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NutritionRecord` ADD CONSTRAINT `NutritionRecord_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PsychosocialSession` ADD CONSTRAINT `PsychosocialSession_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PsychosocialSession` ADD CONSTRAINT `PsychosocialSession_counselorId_fkey` FOREIGN KEY (`counselorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBRIActivity` ADD CONSTRAINT `TBRIActivity_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBRIActivity` ADD CONSTRAINT `TBRIActivity_facilitatorId_fkey` FOREIGN KEY (`facilitatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBRILog` ADD CONSTRAINT `TBRILog_tbriActivityId_fkey` FOREIGN KEY (`tbriActivityId`) REFERENCES `TBRIActivity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBRILog` ADD CONSTRAINT `TBRILog_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialSupport` ADD CONSTRAINT `FinancialSupport_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialSupport` ADD CONSTRAINT `FinancialSupport_disbursedById_fkey` FOREIGN KEY (`disbursedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialSupportFile` ADD CONSTRAINT `FinancialSupportFile_financialSupportId_fkey` FOREIGN KEY (`financialSupportId`) REFERENCES `FinancialSupport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerformanceReview` ADD CONSTRAINT `PerformanceReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
