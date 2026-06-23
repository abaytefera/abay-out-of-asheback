/*
  Warnings:

  - You are about to drop the column `profilePhotoPublicId` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `profilePhotoUrl` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `photoPublicId` on the `guardian` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `guardian` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `child` DROP COLUMN `profilePhotoPublicId`,
    DROP COLUMN `profilePhotoUrl`;

-- AlterTable
ALTER TABLE `guardian` DROP COLUMN `photoPublicId`,
    DROP COLUMN `photoUrl`;

-- CreateTable
CREATE TABLE `ParentPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `guardianId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ParentPhoto_guardianId_idx`(`guardianId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ParentPhoto` ADD CONSTRAINT `ParentPhoto_guardianId_fkey` FOREIGN KEY (`guardianId`) REFERENCES `Guardian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
