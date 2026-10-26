/*
  Warnings:

  - A unique constraint covering the columns `[idempotency_key]` on the table `pagamento` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `pagamento` ADD COLUMN `idempotency_key` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pagamento_idempotency_key_key` ON `pagamento`(`idempotency_key`);
