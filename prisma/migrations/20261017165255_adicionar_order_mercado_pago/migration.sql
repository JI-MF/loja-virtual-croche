/*
  Warnings:

  - A unique constraint covering the columns `[mercado_pago_order_id]` on the table `pagamento` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `pagamento` ADD COLUMN `checkout_url` VARCHAR(1000) NULL,
    ADD COLUMN `mercado_pago_order_id` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pagamento_mercado_pago_order_id_key` ON `pagamento`(`mercado_pago_order_id`);
