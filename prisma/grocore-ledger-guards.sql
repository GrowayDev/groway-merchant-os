-- =============================================================================
-- GroCore — Ledger Guard Migration (PostgreSQL only)
-- Apply after the GroCore tables exist. These triggers enforce:
--   1. Every journal entry must net to zero (checked at commit)
--   2. Append-only: block UPDATE and DELETE on ledger + consent tables
--
-- Designed and Built by Motheto Selepe.
-- =============================================================================

-- 1. Every journal entry must net to zero, checked at commit.
CREATE OR REPLACE FUNCTION grocore_assert_entry_balanced() RETURNS trigger AS $$
BEGIN
  IF (SELECT COALESCE(SUM("amountMinor"), 0) FROM "GroCoreLedgerLine" WHERE "entryId" = NEW."entryId") <> 0 THEN
    RAISE EXCEPTION 'journal entry % does not net to zero', NEW."entryId";
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER grocore_ledger_line_balanced
  AFTER INSERT ON "GroCoreLedgerLine" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION grocore_assert_entry_balanced();

ALTER TABLE "GroCoreLedgerLine" ADD CONSTRAINT grocore_nonzero_amount CHECK ("amountMinor" <> 0);

-- 2. Append-only: block UPDATE and DELETE on ledger and consent tables for every role, including the app role.
CREATE OR REPLACE FUNCTION grocore_block_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION '% on % is not allowed: ledger tables are append-only', TG_OP, TG_TABLE_NAME; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER grocore_entry_append_only BEFORE UPDATE OR DELETE ON "GroCoreJournalEntry" FOR EACH ROW EXECUTE FUNCTION grocore_block_mutation();
CREATE TRIGGER grocore_line_append_only  BEFORE UPDATE OR DELETE ON "GroCoreLedgerLine"   FOR EACH ROW EXECUTE FUNCTION grocore_block_mutation();
CREATE TRIGGER grocore_consent_append_only BEFORE UPDATE OR DELETE ON "GroCoreConsentEvent" FOR EACH ROW EXECUTE FUNCTION grocore_block_mutation();
