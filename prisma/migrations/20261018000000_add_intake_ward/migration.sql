-- AlterTable
ALTER TABLE `IntakeItem` ADD COLUMN `ward` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `IntakeItem_ward_idx` ON `IntakeItem`(`ward`);
