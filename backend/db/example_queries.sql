-- ============================================================
-- Hospital Waiting Time Dashboard — Example SQL Queries
-- Course: ACS-261 Database Management Systems
-- Description: 10+ demonstration queries covering joins,
--   GROUP BY/HAVING, subqueries, WHERE with multiple conditions
-- ============================================================

-- ────────────────────────────────────────────────
-- QUERY 1: JOIN — All visits with facility & department names
-- ────────────────────────────────────────────────
SELECT
    v.visit_id,
    f.name          AS facility,
    d.name          AS department,
    v.visit_date,
    TRIM(v.day_of_week) AS day,
    v.payment_type,
    v.satisfaction_rating
FROM visits v
JOIN facilities  f ON f.facility_id  = v.facility_id
JOIN departments d ON d.department_id = v.department_id
ORDER BY v.visit_date DESC, v.arrival_time DESC
LIMIT 20;

-- ────────────────────────────────────────────────
-- QUERY 2: GROUP BY — Average wait per facility
-- ────────────────────────────────────────────────
SELECT
    f.name                                 AS facility,
    COUNT(v.visit_id)                      AS total_visits,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60
    ), 1)                                  AS avg_total_wait_mins,
    ROUND(AVG(v.satisfaction_rating::NUMERIC), 2) AS avg_satisfaction
FROM visits v
JOIN facilities f ON f.facility_id = v.facility_id
WHERE v.status <> 'flagged_duplicate'
GROUP BY f.facility_id, f.name
ORDER BY avg_total_wait_mins DESC;

-- ────────────────────────────────────────────────
-- QUERY 3: GROUP BY HAVING — Facilities with >20 visits
--          AND average total wait above 60 minutes
-- ────────────────────────────────────────────────
SELECT
    f.name                                                      AS facility,
    COUNT(v.visit_id)                                           AS visit_count,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60
    ), 1)                                                       AS avg_total_wait_mins
FROM visits v
JOIN facilities f ON f.facility_id = v.facility_id
WHERE v.status <> 'flagged_duplicate'
GROUP BY f.facility_id, f.name
HAVING COUNT(v.visit_id) > 20
   AND AVG(
           EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60
       ) > 60
ORDER BY avg_total_wait_mins DESC;

-- ────────────────────────────────────────────────
-- QUERY 4: WHERE (multiple conditions) — Insurance patients
--          at hospitals who rated satisfaction >= 4
--          and waited more than 45 minutes total
-- ────────────────────────────────────────────────
SELECT
    v.visit_id,
    f.name           AS facility,
    v.visit_date,
    v.payment_type,
    v.satisfaction_rating,
    ROUND(
        EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60
    , 1)             AS total_wait_mins
FROM visits v
JOIN facilities f ON f.facility_id = v.facility_id
WHERE v.payment_type      = 'insurance'
  AND f.facility_type     = 'hospital'
  AND v.satisfaction_rating >= 4
  AND EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60 > 45
  AND v.status           <> 'flagged_duplicate'
ORDER BY total_wait_mins DESC;

-- ────────────────────────────────────────────────
-- QUERY 5: SUBQUERY — Visits with above-average triage wait
--          (correlated: compare each visit to its facility avg)
-- ────────────────────────────────────────────────
SELECT
    v.visit_id,
    f.name AS facility,
    ROUND(
        EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) / 60
    , 1)   AS triage_wait_mins
FROM visits v
JOIN facilities f ON f.facility_id = v.facility_id
WHERE EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) >
      (
          SELECT AVG(EXTRACT(EPOCH FROM (v2.consultation_called_time - v2.arrival_time)))
          FROM   visits v2
          WHERE  v2.facility_id = v.facility_id
            AND  v2.status <> 'flagged_duplicate'
      )
  AND v.status <> 'flagged_duplicate'
ORDER BY triage_wait_mins DESC
LIMIT 20;

-- ────────────────────────────────────────────────
-- QUERY 6: JOIN + GROUP BY — Wait times broken down by
--          payment type (insurance vs cash)
-- ────────────────────────────────────────────────
SELECT
    v.payment_type,
    COUNT(*)                                       AS visit_count,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (v.consultation_called_time - v.arrival_time)) / 60
    ), 1)                                          AS avg_triage_mins,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (v.consultation_end_time - v.consultation_called_time)) / 60
    ), 1)                                          AS avg_consult_mins,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (v.medication_received_time - v.consultation_end_time)) / 60
    ), 1)                                          AS avg_pharmacy_mins,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60
    ), 1)                                          AS avg_total_mins
FROM visits v
WHERE v.status <> 'flagged_duplicate'
GROUP BY v.payment_type
ORDER BY v.payment_type;

-- ────────────────────────────────────────────────
-- QUERY 7: JOIN + GROUP BY — Average wait by day-of-week
--          across all facilities
-- ────────────────────────────────────────────────
SELECT
    TRIM(v.day_of_week)                              AS day_of_week,
    TO_CHAR(v.visit_date, 'ID')::INT                 AS iso_day_num,  -- 1=Mon, 7=Sun
    COUNT(*)                                          AS visit_count,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60
    ), 1)                                             AS avg_total_wait_mins
FROM visits v
WHERE v.status <> 'flagged_duplicate'
GROUP BY TRIM(v.day_of_week), TO_CHAR(v.visit_date, 'ID')::INT
ORDER BY iso_day_num;

-- ────────────────────────────────────────────────
-- QUERY 8: SUBQUERY IN FROM — Rank facilities by avg wait
--          using a derived table
-- ────────────────────────────────────────────────
SELECT
    ranked.*,
    RANK() OVER (ORDER BY avg_total_wait_mins DESC) AS wait_rank
FROM (
    SELECT
        f.facility_id,
        f.name                  AS facility_name,
        f.facility_type,
        COUNT(v.visit_id)       AS total_visits,
        ROUND(AVG(
            EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60
        ), 1)                   AS avg_total_wait_mins,
        ROUND(AVG(v.satisfaction_rating::NUMERIC), 2) AS avg_satisfaction
    FROM facilities f
    JOIN visits v ON v.facility_id = f.facility_id
    WHERE v.status <> 'flagged_duplicate'
    GROUP BY f.facility_id, f.name, f.facility_type
) AS ranked
ORDER BY wait_rank;

-- ────────────────────────────────────────────────
-- QUERY 9: JOIN + WHERE — Flagged visits with flag details
-- ────────────────────────────────────────────────
SELECT
    v.visit_id,
    f.name          AS facility,
    v.patient_token,
    v.visit_date,
    v.status,
    vf.flag_reason,
    vf.flagged_at
FROM visits v
JOIN facilities  f  ON f.facility_id = v.facility_id
JOIN visit_flags vf ON vf.visit_id   = v.visit_id
WHERE v.status = 'flagged_duplicate'
ORDER BY vf.flagged_at DESC;

-- ────────────────────────────────────────────────
-- QUERY 10: GROUP BY HAVING — Departments with consistently
--           LOW satisfaction (avg < 3) and at least 5 visits
-- ────────────────────────────────────────────────
SELECT
    f.name                              AS facility,
    d.name                              AS department,
    COUNT(v.visit_id)                   AS visit_count,
    ROUND(AVG(v.satisfaction_rating::NUMERIC), 2) AS avg_satisfaction,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (v.medication_received_time - v.arrival_time)) / 60
    ), 1)                               AS avg_total_wait_mins
FROM visits v
JOIN facilities  f ON f.facility_id  = v.facility_id
JOIN departments d ON d.department_id = v.department_id
WHERE v.status <> 'flagged_duplicate'
GROUP BY f.facility_id, f.name, d.department_id, d.name
HAVING AVG(v.satisfaction_rating::NUMERIC) < 3.5
   AND COUNT(v.visit_id) >= 5
ORDER BY avg_satisfaction ASC;

-- ────────────────────────────────────────────────
-- QUERY 11: EXISTS subquery — Facilities that have at least
--           one flagged-duplicate visit
-- ────────────────────────────────────────────────
SELECT
    f.facility_id,
    f.name,
    f.facility_type
FROM facilities f
WHERE EXISTS (
    SELECT 1
    FROM visits v
    WHERE v.facility_id = f.facility_id
      AND v.status = 'flagged_duplicate'
);

-- ────────────────────────────────────────────────
-- QUERY 12: CTE + JOIN — Rolling 7-day average wait per facility
--           (useful for trend lines in the dashboard)
-- ────────────────────────────────────────────────
WITH daily_avg AS (
    SELECT
        facility_id,
        visit_date,
        ROUND(AVG(
            EXTRACT(EPOCH FROM (medication_received_time - arrival_time)) / 60
        ), 1) AS daily_avg_wait_mins
    FROM visits
    WHERE status <> 'flagged_duplicate'
    GROUP BY facility_id, visit_date
)
SELECT
    f.name          AS facility,
    da.visit_date,
    da.daily_avg_wait_mins,
    ROUND(AVG(da.daily_avg_wait_mins) OVER (
        PARTITION BY da.facility_id
        ORDER BY da.visit_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 1)           AS rolling_7day_avg_mins
FROM daily_avg da
JOIN facilities f ON f.facility_id = da.facility_id
ORDER BY f.name, da.visit_date;

-- ────────────────────────────────────────────────
-- QUERY 13: USING the pre-built views
-- ────────────────────────────────────────────────
-- a) Stage summary for a specific facility
SELECT * FROM vw_wait_stage_summary
WHERE facility_name ILIKE '%Lukenya%'
ORDER BY visit_date DESC
LIMIT 10;

-- b) Facility daily summary
SELECT * FROM vw_facility_daily_summary
ORDER BY facility_name, iso_day_num;

-- c) Department-level aggregation via view
SELECT
    facility_name,
    department_name,
    COUNT(*)            AS visits,
    AVG(total_wait_mins) AS avg_total_wait
FROM vw_wait_stage_summary
WHERE status <> 'flagged_duplicate'
GROUP BY facility_name, department_name
ORDER BY avg_total_wait DESC;
