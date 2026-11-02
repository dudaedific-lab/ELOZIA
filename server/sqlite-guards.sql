CREATE TRIGGER IF NOT EXISTS punches_no_update BEFORE UPDATE ON punches BEGIN SELECT RAISE(ABORT,'Original punches are immutable'); END;
CREATE TRIGGER IF NOT EXISTS punches_no_delete BEFORE DELETE ON punches BEGIN SELECT RAISE(ABORT,'Original punches are immutable'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_events BEGIN SELECT RAISE(ABORT,'Audit history is immutable'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_events BEGIN SELECT RAISE(ABORT,'Audit history is immutable'); END;
CREATE TRIGGER IF NOT EXISTS adjustments_no_update BEFORE UPDATE ON time_adjustments BEGIN SELECT RAISE(ABORT,'Approved adjustments are immutable'); END;
CREATE TRIGGER IF NOT EXISTS adjustments_no_delete BEFORE DELETE ON time_adjustments BEGIN SELECT RAISE(ABORT,'Approved adjustments are immutable'); END;
