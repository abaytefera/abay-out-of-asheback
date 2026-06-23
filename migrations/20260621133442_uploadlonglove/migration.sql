-- DropForeignKey
ALTER TABLE `academicrecord` DROP FOREIGN KEY `AcademicRecord_childId_fkey`;

-- DropForeignKey
ALTER TABLE `childdocument` DROP FOREIGN KEY `ChildDocument_childId_fkey`;

-- DropForeignKey
ALTER TABLE `childotherrecord` DROP FOREIGN KEY `ChildOtherRecord_childId_fkey`;

-- DropForeignKey
ALTER TABLE `childotherrecordfile` DROP FOREIGN KEY `ChildOtherRecordFile_recordId_fkey`;

-- DropForeignKey
ALTER TABLE `donorreport` DROP FOREIGN KEY `DonorReport_sponsorshipId_fkey`;

-- DropForeignKey
ALTER TABLE `educationalert` DROP FOREIGN KEY `EducationAlert_academicRecordId_fkey`;

-- DropForeignKey
ALTER TABLE `financialsupport` DROP FOREIGN KEY `FinancialSupport_childId_fkey`;

-- DropForeignKey
ALTER TABLE `healthrecord` DROP FOREIGN KEY `HealthRecord_childId_fkey`;

-- DropForeignKey
ALTER TABLE `homevisit` DROP FOREIGN KEY `HomeVisit_childId_fkey`;

-- DropForeignKey
ALTER TABLE `homevisitappointment` DROP FOREIGN KEY `HomeVisitAppointment_childId_fkey`;

-- DropForeignKey
ALTER TABLE `materialsupport` DROP FOREIGN KEY `MaterialSupport_childId_fkey`;

-- DropForeignKey
ALTER TABLE `nutritionrecord` DROP FOREIGN KEY `NutritionRecord_childId_fkey`;

-- DropForeignKey
ALTER TABLE `psychosocialsession` DROP FOREIGN KEY `PsychosocialSession_childId_fkey`;

-- DropForeignKey
ALTER TABLE `safeguardingcase` DROP FOREIGN KEY `SafeguardingCase_childId_fkey`;

-- DropForeignKey
ALTER TABLE `sponsorship` DROP FOREIGN KEY `Sponsorship_childId_fkey`;

-- DropForeignKey
ALTER TABLE `tbriactivity` DROP FOREIGN KEY `TBRIActivity_childId_fkey`;

-- DropForeignKey
ALTER TABLE `vaccination` DROP FOREIGN KEY `Vaccination_childId_fkey`;

-- DropForeignKey
ALTER TABLE `vulnerabilityassessment` DROP FOREIGN KEY `VulnerabilityAssessment_childId_fkey`;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('SOCIAL_WORKER', 'EDUCATION_OFFICER', 'FINANCE_OFFICER', 'HEALTH_OFFICER', 'PSYCHOSOCIAL_OFFICER', 'PROGRAM_MANAGER', 'COUNTRY_DIRECTOR', 'ADMIN') NOT NULL;

-- AddForeignKey
ALTER TABLE `ChildDocument` ADD CONSTRAINT `ChildDocument_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChildOtherRecord` ADD CONSTRAINT `ChildOtherRecord_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChildOtherRecordFile` ADD CONSTRAINT `ChildOtherRecordFile_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `ChildOtherRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VulnerabilityAssessment` ADD CONSTRAINT `VulnerabilityAssessment_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HomeVisit` ADD CONSTRAINT `HomeVisit_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HomeVisitAppointment` ADD CONSTRAINT `HomeVisitAppointment_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AcademicRecord` ADD CONSTRAINT `AcademicRecord_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EducationAlert` ADD CONSTRAINT `EducationAlert_academicRecordId_fkey` FOREIGN KEY (`academicRecordId`) REFERENCES `AcademicRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialSupport` ADD CONSTRAINT `MaterialSupport_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sponsorship` ADD CONSTRAINT `Sponsorship_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DonorReport` ADD CONSTRAINT `DonorReport_sponsorshipId_fkey` FOREIGN KEY (`sponsorshipId`) REFERENCES `Sponsorship`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SafeguardingCase` ADD CONSTRAINT `SafeguardingCase_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HealthRecord` ADD CONSTRAINT `HealthRecord_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vaccination` ADD CONSTRAINT `Vaccination_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NutritionRecord` ADD CONSTRAINT `NutritionRecord_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PsychosocialSession` ADD CONSTRAINT `PsychosocialSession_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBRIActivity` ADD CONSTRAINT `TBRIActivity_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialSupport` ADD CONSTRAINT `FinancialSupport_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
