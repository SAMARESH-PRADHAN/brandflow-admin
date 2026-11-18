-- 020_sales_agent_kyc_bank.sql
-- Add PAN, Aadhaar and Bank details for Sales Agents

ALTER TABLE sales_agents
  ADD COLUMN IF NOT EXISTS pan_number          TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS aadhaar_number      TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_name   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_ifsc           TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_name           TEXT NOT NULL DEFAULT '';