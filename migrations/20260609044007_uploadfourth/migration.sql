/*
  Warnings:

  - You are about to drop the column `certificatePublicId` on the `vaccination` table. All the data in the column will be lost.
  - You are about to drop the column `certificateUrl` on the `vaccination` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vaccination` DROP COLUMN `certificatePublicId`,
    DROP COLUMN `certificateUrl`;

-- CreateTable
CREATE TABLE `VaccinationFile` (
    `id` VARCHAR(191) NOT NULL,
    `vaccinationId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VaccinationFile_vaccinationId_idx`(`vaccinationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VaccinationFile` ADD CONSTRAINT `VaccinationFile_vaccinationId_fkey` FOREIGN KEY (`vaccinationId`) REFERENCES `Vaccination`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
