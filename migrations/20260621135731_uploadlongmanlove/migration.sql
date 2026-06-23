-- DropForeignKey
ALTER TABLE `sponsorship` DROP FOREIGN KEY `Sponsorship_sponsorId_fkey`;

-- AddForeignKey
ALTER TABLE `Sponsorship` ADD CONSTRAINT `Sponsorship_sponsorId_fkey` FOREIGN KEY (`sponsorId`) REFERENCES `Sponsor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
