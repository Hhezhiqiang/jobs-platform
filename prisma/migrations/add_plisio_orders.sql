-- 添加 plisio_orders 表
CREATE TABLE IF NOT EXISTS plisio_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plisio_invoice_id VARCHAR(255) UNIQUE,
    amount DECIMAL(18, 8) NOT NULL,
    currency VARCHAR(10) DEFAULT 'CNY',
    status VARCHAR(20) DEFAULT 'PENDING',
    payment_url TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plisio_orders_user_id ON plisio_orders(user_id);
CREATE INDEX idx_plisio_orders_status ON plisio_orders(status);
CREATE INDEX idx_plisio_orders_plisio_invoice_id ON plisio_orders(plisio_invoice_id);

-- 添加 payment_method 字段到 balance_transactions
ALTER TABLE balance_transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE balance_transactions ADD COLUMN IF NOT EXISTS plisio_order_id UUID;

CREATE INDEX idx_balance_transactions_payment_method ON balance_transactions(payment_method);
