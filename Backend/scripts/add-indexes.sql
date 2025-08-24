CREATE INDEX idx_posters_status_created ON posters (status, created_at);
CREATE INDEX idx_post_image_post ON post_image (post_id);
CREATE INDEX idx_landmarks_post ON landmarks (post_id);
CREATE INDEX idx_post_likes_user_post ON post_likes (user_id, post_id);
CREATE INDEX idx_wallets_user ON wallets (user_id);
CREATE INDEX idx_wallet_tx_user_time ON wallet_transactions (user_id, created_at);
CREATE INDEX idx_book_logs_post_time ON book_logs (post_id, book_date, deleted_at);
