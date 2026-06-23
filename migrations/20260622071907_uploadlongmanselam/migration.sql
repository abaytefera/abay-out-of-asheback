-- DropForeignKey
ALTER TABLE `auditlog` DROP FOREIGN KEY `AuditLog_userId_fkey`;

-- DropForeignKey
ALTER TABLE `childdocument` DROP FOREIGN KEY `ChildDocument_uploadedById_fkey`;

-- DropForeignKey
ALTER TABLE `financialsupport` DROP FOREIGN KEY `FinancialSupport_disbursedById_fkey`;

-- DropForeignKey
ALTER TABLE `healthrecord` DROP FOREIGN KEY `HealthRecord_recordedById_fkey`;

-- DropForeignKey
ALTER TABLE `homevisit` DROP FOREIGN KEY `HomeVisit_staffId_fkey`;

-- DropForeignKey
ALTER TABLE `homevisitappointment` DROP FOREIGN KEY `HomeVisitAppointment_assignedToId_fkey`;

-- DropForeignKey
ALTER TABLE `materialsupport` DROP FOREIGN KEY `MaterialSupport_distributedById_fkey`;

-- DropForeignKey
ALTER TABLE `nutritionrecord` DROP FOREIGN KEY `NutritionRecord_recordedById_fkey`;

-- DropForeignKey
ALTER TABLE `performancereview` DROP FOREIGN KEY `PerformanceReview_userId_fkey`;

-- DropForeignKey
ALTER TABLE `psychosocialsession` DROP FOREIGN KEY `PsychosocialSession_counselorId_fkey`;

-- DropForeignKey
ALTER TABLE `safeguardingcase` DROP FOREIGN KEY `SafeguardingCase_reportedById_fkey`;

-- DropForeignKey
ALTER TABLE `tbriactivity` DROP FOREIGN KEY `TBRIActivity_facilitatorId_fkey`;

-- DropForeignKey
ALTER TABLE `tbrilog` DROP FOREIGN KEY `TBRILog_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `vulnerabilityassessment` DROP FOREIGN KEY `VulnerabilityAssessment_assessorId_fkey`;

-- AlterTable
ALTER TABLE `auditlog` MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `childdocument` MODIFY `uploadedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `financialsupport` MODIFY `disbursedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `healthrecord` MODIFY `recordedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `homevisit` MODIFY `staffId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `homevisitappointment` MODIFY `assignedToId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `materialsupport` MODIFY `distributedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `nutritionrecord` MODIFY `recordedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `performancereview` MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `psychosocialsession` MODIFY `counselorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `safeguardingcase` MODIFY `reportedById` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tbriactivity` MODIFY `facilitatorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tbrilog` MODIFY `authorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `vulnerabilityassessment` MODIFY `assessorId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `ChildDocument` ADD CONSTRAINT `ChildDocument_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VulnerabilityAssessment` ADD CONSTRAINT `VulnerabilityAssessment_assessorId_fkey` FOREIGN KEY (`assessorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HomeVisit` ADD CONSTRAINT `HomeVisit_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HomeVisitAppointment` ADD CONSTRAINT `HomeVisitAppointment_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialSupport` ADD CONSTRAINT `MaterialSupport_distributedById_fkey` FOREIGN KEY (`distributedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SafeguardingCase` ADD CONSTRAINT `SafeguardingCase_reportedById_fkey` FOREIGN KEY (`reportedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthRecord` ADD CONSTRAINT `HealthRecord_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NutritionRecord` ADD CONSTRAINT `NutritionRecord_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PsychosocialSession` ADD CONSTRAINT `PsychosocialSession_counselorId_fkey` FOREIGN KEY (`counselorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBRIActivity` ADD CONSTRAINT `TBRIActivity_facilitatorId_fkey` FOREIGN KEY (`facilitatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBRILog` ADD CONSTRAINT `TBRILog_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialSupport` ADD CONSTRAINT `FinancialSupport_disbursedById_fkey` FOREIGN KEY (`disbursedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerformanceReview` ADD CONSTRAINT `PerformanceReview_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
