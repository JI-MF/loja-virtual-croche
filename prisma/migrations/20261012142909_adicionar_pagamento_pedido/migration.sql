-- AlterTable
ALTER TABLE `pedido` ADD COLUMN `valor_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE `pagamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedido_id` INTEGER NOT NULL,
    `provedor` VARCHAR(30) NOT NULL DEFAULT 'MERCADO_PAGO',
    `mercado_pago_payment_id` VARCHAR(100) NULL,
    `preferencia_id` VARCHAR(100) NULL,
    `status` ENUM('PENDENTE', 'EM_PROCESSAMENTO', 'APROVADO', 'RECUSADO', 'CANCELADO', 'ESTORNADO', 'EM_DISPUTA') NOT NULL DEFAULT 'PENDENTE',
    `valor` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `atualizado_em` DATETIME(0) NOT NULL,

    UNIQUE INDEX `pagamento_mercado_pago_payment_id_key`(`mercado_pago_payment_id`),
    INDEX `pagamento_pedido_id_idx`(`pedido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pagamento` ADD CONSTRAINT `pagamento_pedido_id_fkey` FOREIGN KEY (`pedido_id`) REFERENCES `pedido`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
