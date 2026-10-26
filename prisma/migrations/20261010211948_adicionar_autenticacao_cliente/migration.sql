/*
  Warnings:

  - You are about to drop the column `cpf` on the `cliente` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `cpf` ON `cliente`;

-- AlterTable
ALTER TABLE `cliente` DROP COLUMN `cpf`,
    ADD COLUMN `email_verificado` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `otp_cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `codigo_hash` VARCHAR(255) NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expira_em` DATETIME(0) NOT NULL,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `usado` BOOLEAN NOT NULL DEFAULT false,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    INDEX `otp_cliente_cliente_id_idx`(`cliente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessao_cliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cliente_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `expira_em` DATETIME(0) NOT NULL,
    `revogado` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `sessao_cliente_token_hash_key`(`token_hash`),
    INDEX `sessao_cliente_cliente_id_idx`(`cliente_id`),
    INDEX `sessao_cliente_expira_em_idx`(`expira_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `otp_cliente` ADD CONSTRAINT `otp_cliente_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessao_cliente` ADD CONSTRAINT `sessao_cliente_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
