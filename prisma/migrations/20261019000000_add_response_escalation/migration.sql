-- AlterTable
ALTER TABLE `ResponseRequest` ADD COLUMN `escalationLevel` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastEscalatedAt` DATETIME(3) NULL;
