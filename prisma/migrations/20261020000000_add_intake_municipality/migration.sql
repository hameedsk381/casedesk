-- AlterTable
ALTER TABLE `IntakeItem` ADD COLUMN `municipality` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `IntakeItem_municipality_ward_idx` ON `IntakeItem`(`municipality`, `ward`);
