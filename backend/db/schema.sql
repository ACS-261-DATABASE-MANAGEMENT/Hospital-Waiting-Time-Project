-- ============================================================
-- Hospital Waiting Time Dashboard — PostgreSQL Schema
-- Course: ACS-261 Database Management Systems
-- Description: Citizen-Generated Data (CGD) system for tracking
--              patient wait times at Lukenya-area health facilities
-- ============================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLE: facilities
-- Stores health facilities in the Lukenya/Athi River area
-- ============================================================
CREATE TABLE IF NOT EXISTS facilities (
    facility_id   SERIAL        PRIMARY KEY,
    name          VARCHAR(150)  NOT NULL,
    location      VARCHAR(200)  NOT NULL,
    area          VARCHAR(100)  NOT NULL DEFAULT 'Lukenya',
    facility_type VARCHAR(50)   NOT NULL
                  CHECK (facility_type IN ('hospital','clinic','health_centre','dispensary')),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: departments
-- Departments within each facility
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL        PRIMARY KEY,
    facility_id   INT           NOT NULL
                  REFERENCES facilities(facility_id) ON DELETE CASCADE,
    name          VARCHAR(100)  NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (facility_id, name)
);

-- ============================================================
-- TABLE: visits
-- Core CGD table — one row per patient visit submission
-- patient_token is anonymous (hashed device ID or UUID)
-- ============================================================
CREATE TABLE IF NOT EXISTS visits (
    visit_id                 SERIAL       PRIMARY KEY,
    facility_id              INT          NOT NULL
                             REFERENCES facilities(facility_id) ON DELETE RESTRICT,
    department_id            INT          NOT NULL
                             REFERENCES departments(department_id) ON DELETE RESTRICT,
    patient_token            VARCHAR(64)  NOT NULL,              -- anonymous identifier
    visit_date               DATE         NOT NULL,
    payment_type             VARCHAR(20)  NOT NULL
                             CHECK (payment_type IN ('insurance', 'cash')),
    arrival_time             TIMESTAMPTZ  NOT NULL,
    consultation_called_time TIMESTAMPTZ  NOT NULL,
    consultation_end_time    TIMESTAMPTZ  NOT NULL,
    medication_received_time TIMESTAMPTZ  NOT NULL,
    satisfaction_rating      SMALLINT     NOT NULL
                             CHECK (satisfaction_rating BETWEEN 1 AND 5),
    status                   VARCHAR(25)  NOT NULL DEFAULT 'submitted'
                             CHECK (status IN ('submitted','under_review','flagged_duplicate','resolved')),
    submitted_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Logical ordering constraints
    CONSTRAINT chk_called_after_arrival
        CHECK (consultation_called_time > arrival_time),
    CONSTRAINT chk_end_after_called
        CHECK (consultation_end_time > consultation_called_time),
    CONSTRAINT chk_medication_after_end
        CHECK (medication_received_time >= consultation_end_time),
    CONSTRAINT chk_arrival_matches_visit_date
        CHECK (DATE(arrival_time AT TIME ZONE 'Africa/Nairobi') = visit_date)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_visits_facility     ON visits(facility_id);
CREATE INDEX IF NOT EXISTS idx_visits_department   ON visits(department_id);
CREATE INDEX IF NOT EXISTS idx_visits_visit_date   ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_payment_type ON visits(payment_type);
CREATE INDEX IF NOT EXISTS idx_visits_status       ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_token_fac_dt ON visits(patient_token, facility_id, visit_date);

-- ============================================================
-- TABLE: visit_flags
-- Audit trail of quality/duplicate flags applied to visits
-- ============================================================
CREATE TABLE IF NOT EXISTS visit_flags (
    flag_id     SERIAL       PRIMARY KEY,
    visit_id    INT          NOT NULL
                REFERENCES visits(visit_id) ON DELETE CASCADE,
    flag_reason TEXT         NOT NULL,
    flagged_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flags_visit ON visit_flags(visit_id);

-- ============================================================
-- TRIGGER: Auto-flag duplicate visits
--
-- Duplicate Detection Logic:
--   A "duplicate" is defined as a new visit INSERT where the
--   same patient_token + facility_id combination already has a
--   submitted visit on the SAME visit_date.  Because a patient
--   legitimately cannot visit the same facility twice in the
--   same calendar day and submit separate CGD reports, we
--   automatically mark the newer row as 'flagged_duplicate' and
--   insert a record into visit_flags explaining why.
--
--   The configurable "time window" is the calendar day boundary
--   (visit_date equality), but can be tightened to an INTERVAL
--   check on arrival_time if needed (see comment below).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_flag_duplicate_visit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_existing_id INT;
    -- Configurable window: change '1 day' to e.g. '4 hours' for stricter dedup
    v_window INTERVAL := '1 day';
BEGIN
    -- Look for any non-flagged visit with same token + facility on same date
    SELECT visit_id INTO v_existing_id
    FROM   visits
    WHERE  patient_token  = NEW.patient_token
      AND  facility_id    = NEW.facility_id
      AND  visit_date     = NEW.visit_date
      AND  visit_id      <> NEW.visit_id          -- exclude the row just inserted
      AND  status        <> 'flagged_duplicate'   -- ignore already-flagged rows
      AND  arrival_time  >= (NEW.arrival_time - v_window)
    LIMIT 1;

    IF FOUND THEN
        -- Mark the new visit as a duplicate
        UPDATE visits
        SET    status = 'flagged_duplicate'
        WHERE  visit_id = NEW.visit_id;

        -- Record the flag in the audit table
        INSERT INTO visit_flags (visit_id, flag_reason)
        VALUES (
            NEW.visit_id,
            FORMAT(
                'Possible duplicate: visit %s shares patient_token=%s, facility_id=%s, visit_date=%s',
                v_existing_id, NEW.patient_token, NEW.facility_id, NEW.visit_date
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Fire AFTER INSERT so the new row already has its visit_id PK
CREATE OR REPLACE TRIGGER trg_flag_duplicate_visit
AFTER INSERT ON visits
FOR EACH ROW EXECUTE FUNCTION fn_flag_duplicate_visit();

-- ============================================================
-- VIEW: vw_wait_stage_summary
-- Per-visit wait times broken down by stage (in minutes)
-- ============================================================
CREATE OR REPLACE VIEW vw_wait_stage_summary AS
SELECT
    v.visit_id,
    v.facility_id,
    f.name                                                    AS facility_name,
    v.department_id,
    d.name                                                    AS department_name,
    v.visit_date,
    TRIM(TO_CHAR(v.visit_date, 'Day'))                        AS day_of_week,
    v.payment_type,
    v.satisfaction_rating,
    v.status,
    -- Stage wait times in minutes (rounded to 1 decimal)
    ROUND(
        EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) / 60.0
    , 1)                                                      AS triage_wait_mins,
    ROUND(
        EXTRACT(EPOCH FROM (v.consultation_end_time - v.consultation_called_time)) / 60.0
    , 1)                                                      AS consultation_duration_mins,
    ROUND(
        EXTRACT(EPOCH FROM (v.medication_received_time - v.consultation_end_time)) / 60.0
    , 1)                                                      AS pharmacy_wait_mins,
    ROUND(
        EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60.0
    , 1)                                                      AS total_wait_mins
FROM visits v
JOIN facilities  f ON f.facility_id  = v.facility_id
JOIN departments d ON d.department_id = v.department_id;

-- ============================================================
-- VIEW: vw_facility_daily_summary
-- Average wait times aggregated per facility × day_of_week
-- ============================================================
CREATE OR REPLACE VIEW vw_facility_daily_summary AS
SELECT
    s.facility_id,
    s.facility_name,
    s.day_of_week,
    COUNT(*)                            AS visit_count,
    ROUND(AVG(s.triage_wait_mins), 1)  AS avg_triage_wait_mins,
    ROUND(AVG(s.consultation_duration_mins), 1) AS avg_consultation_mins,
    ROUND(AVG(s.pharmacy_wait_mins), 1) AS avg_pharmacy_wait_mins,
    ROUND(AVG(s.total_wait_mins), 1)   AS avg_total_wait_mins,
    ROUND(AVG(s.satisfaction_rating::NUMERIC), 2) AS avg_satisfaction
FROM vw_wait_stage_summary s
WHERE s.status NOT IN ('flagged_duplicate')
GROUP BY s.facility_id, s.facility_name, s.day_of_week;
