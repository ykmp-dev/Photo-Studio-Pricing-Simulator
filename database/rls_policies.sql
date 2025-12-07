-- Row Level Security (RLS) Policies
-- Run this in your Supabase SQL Editor after creating the schema

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_plan_associations ENABLE ROW LEVEL SECURITY;

-- Shops policies
CREATE POLICY "Public shops are viewable by everyone"
  ON shops FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own shop"
  ON shops FOR UPDATE
  USING (auth.uid()::text = owner_email);

-- Plans policies
CREATE POLICY "Plans are viewable by everyone"
  ON plans FOR SELECT
  USING (true);

CREATE POLICY "Users can insert plans for their shop"
  ON plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = plans.shop_id
      AND shops.owner_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can update plans for their shop"
  ON plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = plans.shop_id
      AND shops.owner_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete plans for their shop"
  ON plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = plans.shop_id
      AND shops.owner_email = auth.uid()::text
    )
  );

-- Options policies
CREATE POLICY "Options are viewable by everyone"
  ON options FOR SELECT
  USING (true);

CREATE POLICY "Users can insert options for their shop"
  ON options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = options.shop_id
      AND shops.owner_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can update options for their shop"
  ON options FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = options.shop_id
      AND shops.owner_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete options for their shop"
  ON options FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = options.shop_id
      AND shops.owner_email = auth.uid()::text
    )
  );

-- Campaigns policies
CREATE POLICY "Campaigns are viewable by everyone"
  ON campaigns FOR SELECT
  USING (true);

CREATE POLICY "Users can insert campaigns for their shop"
  ON campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = campaigns.shop_id
      AND shops.owner_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can update campaigns for their shop"
  ON campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = campaigns.shop_id
      AND shops.owner_email = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete campaigns for their shop"
  ON campaigns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shops
      WHERE shops.id = campaigns.shop_id
      AND shops.owner_email = auth.uid()::text
    )
  );

-- Campaign plan associations policies
CREATE POLICY "Campaign associations are viewable by everyone"
  ON campaign_plan_associations FOR SELECT
  USING (true);

CREATE POLICY "Users can manage associations for their campaigns"
  ON campaign_plan_associations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN shops ON shops.id = campaigns.shop_id
      WHERE campaigns.id = campaign_plan_associations.campaign_id
      AND shops.owner_email = auth.uid()::text
    )
  );
