-- AlterTable
ALTER TABLE `notification` MODIFY `type` ENUM('SAFEGUARDING_ALERT', 'FINANCIAL_APPROVAL_REQUEST', 'HOME_VISIT_DUE', 'ACADEMIC_ALERT', 'SYSTEM_ANNOUNCEMENT', 'DATA_CREATE', 'DATA_UPDATE', 'DATA_DELETE', 'SECURITY_WARNING', 'NEW_VISIT_LOGGED', 'NEW_APPOINTMENT_ASSIGNED', 'UPCOMING_REMINDER', 'TODAY_VISIT_ALERT', 'EMERGENCY_ALERT') NOT NULL;

-- CreateTable
CREATE TABLE `HomeVisitAppointment` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `assignedToId` VARCHAR(191) NOT NULL,
    `appointmentDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HomeVisitAppointment_assignedToId_idx`(`assignedToId`),
    INDEX `HomeVisitAppointment_appointmentDate_idx`(`appointmentDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HomeVisitAppointment` ADD CONSTRAINT `HomeVisitAppointment_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `Child`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HomeVisitAppointment` ADD CONSTRAINT `HomeVisitAppointment_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
