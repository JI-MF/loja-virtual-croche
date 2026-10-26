/*
  Warnings:

  - A unique constraint covering the columns `[pedido_id]` on the table `pagamento` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `pagamento_pedido_id_key` ON `pagamento`(`pedido_id`);
