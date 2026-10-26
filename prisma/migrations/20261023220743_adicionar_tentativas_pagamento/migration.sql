-- CreateTable
CREATE TABLE `tentativa_pagamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pagamento_id` INTEGER NOT NULL,
    `mercado_pago_order_id` VARCHAR(100) NULL,
    `idempotency_key` VARCHAR(100) NULL,
    `checkout_url` VARCHAR(1000) NULL,
    `status` ENUM('PENDENTE', 'EM_PROCESSAMENTO', 'APROVADO', 'RECUSADO', 'CANCELADO', 'ESTORNADO', 'EM_DISPUTA') NOT NULL DEFAULT 'PENDENTE',
    `valor` DECIMAL(10, 2) NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `atualizado_em` DATETIME(0) NOT NULL,

    UNIQUE INDEX `tentativa_pagamento_mercado_pago_order_id_key`(`mercado_pago_order_id`),
    UNIQUE INDEX `tentativa_pagamento_idempotency_key_key`(`idempotency_key`),
    INDEX `tentativa_pagamento_pagamento_id_idx`(`pagamento_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tentativa_pagamento` ADD CONSTRAINT `tentativa_pagamento_pagamento_id_fkey` FOREIGN KEY (`pagamento_id`) REFERENCES `pagamento`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
