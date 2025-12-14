-- 初期テーブル作成
-- shops, plans, options, campaigns などの基本テーブルを作成

-- ========== updated_at自動更新関数 ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========== shops テーブル ==========
CREATE TABLE IF NOT EXISTS shops (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- デフォルトショップを挿入
INSERT INTO shops (id, name, owner_email)
VALUES (1, 'デモスタジオ', 'demo@example.com')
ON CONFLICT (id) DO NOTHING;

-- ========== plans テーブル（旧システム・後で削除予定） ==========
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  base_price INT NOT NULL,
  description TEXT,
  category VARCHAR(100),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_shop_id ON plans(shop_id);
CREATE INDEX IF NOT EXISTS idx_plans_category ON plans(category);

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== options テーブル（旧システム・後で削除予定） ==========
CREATE TABLE IF NOT EXISTS options (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price INT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'hair', 'makeup', 'dressing', 'photo_item'
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_options_shop_id ON options(shop_id);
CREATE INDEX IF NOT EXISTS idx_options_category ON options(category);

CREATE TRIGGER update_options_updated_at BEFORE UPDATE ON options
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== campaigns テーブル ==========
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  shop_id INT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
  discount_value INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_shop_id ON campaigns(shop_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== campaign_plan_associations テーブル（旧システム・後で削除予定） ==========
CREATE TABLE IF NOT EXISTS campaign_plan_associations (
  id SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  plan_id INT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_plan_associations_campaign ON campaign_plan_associations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_plan_associations_plan ON campaign_plan_associations(plan_id);

-- ========== コメント ==========
COMMENT ON TABLE shops IS 'スタジオ情報';
COMMENT ON TABLE plans IS '撮影プラン（旧システム・migration 006以降は不要）';
COMMENT ON TABLE options IS '追加オプション（旧システム・migration 006以降は不要）';
COMMENT ON TABLE campaigns IS 'キャンペーン';
COMMENT ON TABLE campaign_plan_associations IS 'キャンペーン×プラン関連付け（旧システム・migration 007で削除）';
