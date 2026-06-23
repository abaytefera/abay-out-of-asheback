/*
  Warnings:

  - Added the required column `type` to the `Schoolname` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `schoolname` ADD COLUMN `type` ENUM('PRIVATE', 'GOVERMENT') NOT NULL;
