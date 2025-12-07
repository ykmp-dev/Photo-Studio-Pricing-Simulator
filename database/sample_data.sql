-- Sample data for testing
-- Based on Yokohama Sogo Photo Studio

-- Insert shop
INSERT INTO shops (name, owner_email) VALUES
('横浜そごう写真館', 'admin@watanabephoto.co.jp')
ON CONFLICT (name) DO NOTHING;

-- Get shop_id (adjust this to your actual shop_id)
DO $$
DECLARE
  v_shop_id INT;
BEGIN
  SELECT id INTO v_shop_id FROM shops WHERE name = '横浜そごう写真館';

  -- Insert plans (七五三プラン)
  INSERT INTO plans (shop_id, name, base_price, description, category, sort_order) VALUES
  (v_shop_id, '七五三 ライトコース', 33000, '基本的な撮影プラン。1着での撮影、写真データ付き', '七五三', 1),
  (v_shop_id, '七五三 スタンダードコース', 55000, '人気No.1プラン。2着での撮影、アルバム付き', '七五三', 2),
  (v_shop_id, '七五三 プレミアムコース', 88000, '最高級プラン。3着での撮影、豪華アルバム・台紙付き', '七五三', 3),
  (v_shop_id, '成人式 ベーシックコース', 44000, '振袖1着での撮影、データ納品', '成人式', 4),
  (v_shop_id, '成人式 スペシャルコース', 77000, '振袖2着での撮影、アルバム・台紙付き', '成人式', 5);

  -- Insert options
  INSERT INTO options (shop_id, name, price, category, description, sort_order) VALUES
  (v_shop_id, 'ヘアセット（女性）', 5500, 'hair', 'プロのスタイリストによるヘアセット', 1),
  (v_shop_id, 'ヘアセット（男性）', 3300, 'hair', '男性向けヘアセット', 2),
  (v_shop_id, 'メイク（女性・フルメイク）', 6600, 'makeup', 'フルメイク（ベースメイク＋ポイントメイク）', 3),
  (v_shop_id, 'メイク（ナチュラルメイク）', 4400, 'makeup', 'ナチュラルな仕上がりのメイク', 4),
  (v_shop_id, '着付（七五三・女の子）', 8800, 'dressing', '三歳・七歳の女の子の着付', 5),
  (v_shop_id, '着付（七五三・男の子）', 7700, 'dressing', '五歳の男の子の着付', 6),
  (v_shop_id, '着付（振袖）', 11000, 'dressing', '成人式振袖の着付', 7),
  (v_shop_id, 'フォトブック追加（20ページ）', 16500, 'photo_item', '高品質フォトブック', 8),
  (v_shop_id, 'デザイン台紙（六切2面）', 8800, 'photo_item', '六切サイズ2面の台紙', 9),
  (v_shop_id, 'データ追加（50カット）', 22000, 'photo_item', '全撮影データ50カット追加', 10);

  -- Insert campaigns
  INSERT INTO campaigns (shop_id, name, start_date, end_date, discount_type, discount_value, is_active) VALUES
  (v_shop_id, '七五三早期予約キャンペーン', '2025-09-01', '2025-10-31', 'percentage', 10, true),
  (v_shop_id, '成人式特別割引', '2025-11-01', '2026-01-15', 'fixed', 5000, true);

  -- Get campaign and plan IDs for associations
  DECLARE
    v_campaign1_id INT;
    v_campaign2_id INT;
    v_plan1_id INT;
    v_plan2_id INT;
    v_plan3_id INT;
    v_plan4_id INT;
    v_plan5_id INT;
  BEGIN
    SELECT id INTO v_campaign1_id FROM campaigns WHERE name = '七五三早期予約キャンペーン';
    SELECT id INTO v_campaign2_id FROM campaigns WHERE name = '成人式特別割引';

    SELECT id INTO v_plan1_id FROM plans WHERE name = '七五三 ライトコース';
    SELECT id INTO v_plan2_id FROM plans WHERE name = '七五三 スタンダードコース';
    SELECT id INTO v_plan3_id FROM plans WHERE name = '七五三 プレミアムコース';
    SELECT id INTO v_plan4_id FROM plans WHERE name = '成人式 ベーシックコース';
    SELECT id INTO v_plan5_id FROM plans WHERE name = '成人式 スペシャルコース';

    -- Associate campaigns with plans
    INSERT INTO campaign_plan_associations (campaign_id, plan_id) VALUES
    (v_campaign1_id, v_plan1_id),
    (v_campaign1_id, v_plan2_id),
    (v_campaign1_id, v_plan3_id),
    (v_campaign2_id, v_plan4_id),
    (v_campaign2_id, v_plan5_id)
    ON CONFLICT DO NOTHING;
  END;
END $$;
