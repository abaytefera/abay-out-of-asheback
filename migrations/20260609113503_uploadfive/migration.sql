-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `childRegister` BOOLEAN NOT NULL DEFAULT false,
    `childUpdate` BOOLEAN NOT NULL DEFAULT false,
    `childDelete` BOOLEAN NOT NULL DEFAULT false,
    `childView` BOOLEAN NOT NULL DEFAULT true,
    `employeeRegister` BOOLEAN NOT NULL DEFAULT false,
    `employeeUpdate` BOOLEAN NOT NULL DEFAULT false,
    `employeeDelete` BOOLEAN NOT NULL DEFAULT false,
    `employeeView` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permission_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
