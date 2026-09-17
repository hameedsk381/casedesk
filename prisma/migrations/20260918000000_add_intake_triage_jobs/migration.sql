CREATE TABLE `IntakeTriageJob` (
  `id` VARCHAR(191) NOT NULL,
  `intakeItemId` VARCHAR(191) NOT NULL,
  `workspaceId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `maxAttempts` INTEGER NOT NULL DEFAULT 3,
  `availableAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lockedAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `lastError` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `IntakeTriageJob_intakeItemId_key`(`intakeItemId`),
  INDEX `IntakeTriageJob_status_availableAt_idx`(`status`, `availableAt`),
  INDEX `IntakeTriageJob_workspaceId_idx`(`workspaceId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `IntakeTriageJob`
  ADD CONSTRAINT `IntakeTriageJob_intakeItemId_fkey`
  FOREIGN KEY (`intakeItemId`) REFERENCES `IntakeItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
