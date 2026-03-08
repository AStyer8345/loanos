-- ============================================================
-- LoanOS — Migration 002: Add doc_type and uploaded_by to documents
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS doc_type     TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_by  TEXT DEFAULT 'adam';
