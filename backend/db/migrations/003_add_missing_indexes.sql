-- Missing indexes for performance improvements

-- Composite index for reviews filtered by status and ordered by review_date
CREATE INDEX IF NOT EXISTS idx_reviews_status_review_date ON reviews (status, review_date DESC);

-- Composite index for sample/normal orders filtered and ordered by order_date
CREATE INDEX IF NOT EXISTS idx_orders_is_sample_order_date ON orders (is_sample, order_date DESC);

-- Index for orders by product_id (foreign-key-like lookup)
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders (product_id);
