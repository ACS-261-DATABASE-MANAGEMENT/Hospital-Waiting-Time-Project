-- ============================================================
-- Hospital Waiting Time Dashboard — Seed Data
-- Facilities: Lukenya Hospital, Athi River Health Centre,
--             Mlolongo Clinic, Mavoko Sub-County Hospital,
--             Katani Dispensary
-- ~150 synthetic visits spread across dates, days, payment types
-- ============================================================

-- ============================================================
-- FACILITIES
-- ============================================================
INSERT INTO facilities (name, location, area, facility_type) VALUES
('Lukenya Mission Hospital',      'Lukenya, off Mombasa Road',     'Lukenya',      'hospital'),
('Athi River Health Centre',      'Athi River Town, Machakos Rd',  'Athi River',   'health_centre'),
('Mlolongo Medical Clinic',       'Mlolongo, along Mombasa Rd',    'Mlolongo',     'clinic'),
('Mavoko Sub-County Hospital',    'Athi River, Mavoko Township',   'Athi River',   'hospital'),
('Katani Community Dispensary',   'Katani, off Eastern Bypass',    'Katani',       'dispensary');

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO departments (facility_id, name) VALUES
-- Lukenya Mission Hospital (facility_id = 1)
(1, 'Outpatient Department'),
(1, 'Maternity'),
(1, 'Emergency & Casualty'),
-- Athi River Health Centre (facility_id = 2)
(2, 'General Outpatient'),
(2, 'Maternal & Child Health'),
-- Mlolongo Medical Clinic (facility_id = 3)
(3, 'General Consultation'),
(3, 'Pharmacy'),
-- Mavoko Sub-County Hospital (facility_id = 4)
(4, 'Outpatient Department'),
(4, 'Paediatrics'),
(4, 'Accident & Emergency'),
-- Katani Community Dispensary (facility_id = 5)
(5, 'General Outpatient');

-- ============================================================
-- HELPER: Generate realistic visit rows
-- Spread across 6 weeks, various times, payment types
-- ============================================================

-- We use a DO block to generate ~150 rows programmatically
DO $$
DECLARE
    v_facility_id       INT;
    v_department_id     INT;
    v_visit_date        DATE;
    v_arrival           TIMESTAMPTZ;
    v_called            TIMESTAMPTZ;
    v_end_consult       TIMESTAMPTZ;
    v_medication        TIMESTAMPTZ;
    v_satisfaction      SMALLINT;
    v_payment           VARCHAR(20);
    v_token             VARCHAR(64);
    v_triage_mins       INT;
    v_consult_mins      INT;
    v_pharmacy_mins     INT;

    -- Facility/dept mapping arrays (facility_id, dept_id pairs)
    fac_dept_pairs INT[][] := ARRAY[
        ARRAY[1,1], ARRAY[1,2], ARRAY[1,3],
        ARRAY[2,4], ARRAY[2,5],
        ARRAY[3,6], ARRAY[3,7],
        ARRAY[4,8], ARRAY[4,9], ARRAY[4,10],
        ARRAY[5,11]
    ];
    pair_idx INT;
    i INT;

    -- Date range: last 6 weeks
    base_date DATE := CURRENT_DATE - INTERVAL '42 days';
BEGIN
    FOR i IN 1..155 LOOP
        -- Pick a random facility/dept pair
        pair_idx := (ARRAY[1,2,3,4,5,6,7,8,9,10,11])[1 + MOD(i * 7, 11)];
        v_facility_id   := fac_dept_pairs[pair_idx][1];
        v_department_id := fac_dept_pairs[pair_idx][2];

        -- Random visit date within last 42 days
        v_visit_date := base_date + (FLOOR(RANDOM() * 43))::INT;

        -- Arrival between 07:00 and 14:00 local time (East Africa Time = UTC+3)
        v_arrival := (v_visit_date::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi')
                     + INTERVAL '7 hours'
                     + (FLOOR(RANDOM() * 420) || ' minutes')::INTERVAL;

        -- Triage wait: 15–90 minutes (longer for hospitals, shorter for clinics)
        v_triage_mins := CASE
            WHEN v_facility_id IN (1, 4) THEN 30 + FLOOR(RANDOM() * 60)::INT
            WHEN v_facility_id IN (2, 3) THEN 15 + FLOOR(RANDOM() * 40)::INT
            ELSE 10 + FLOOR(RANDOM() * 25)::INT
        END;
        v_called := v_arrival + (v_triage_mins || ' minutes')::INTERVAL;

        -- Consultation: 10–40 minutes
        v_consult_mins := 10 + FLOOR(RANDOM() * 30)::INT;
        v_end_consult  := v_called + (v_consult_mins || ' minutes')::INTERVAL;

        -- Pharmacy wait: 5–35 minutes
        v_pharmacy_mins := 5 + FLOOR(RANDOM() * 30)::INT;
        v_medication    := v_end_consult + (v_pharmacy_mins || ' minutes')::INTERVAL;

        -- Payment type: ~60% insurance, 40% cash
        v_payment := CASE WHEN RANDOM() < 0.6 THEN 'insurance' ELSE 'cash' END;

        -- Satisfaction: weighted toward 3-4 for realistic data
        v_satisfaction := CASE
            WHEN RANDOM() < 0.10 THEN 1
            WHEN RANDOM() < 0.20 THEN 2
            WHEN RANDOM() < 0.50 THEN 3
            WHEN RANDOM() < 0.80 THEN 4
            ELSE 5
        END;

        -- Anonymous patient token (simulated hash)
        v_token := MD5('patient_' || i || '_device_' || FLOOR(RANDOM() * 5000)::TEXT);

        INSERT INTO visits (
            facility_id, department_id, patient_token, visit_date,
            payment_type, arrival_time, consultation_called_time,
            consultation_end_time, medication_received_time,
            satisfaction_rating, status
        ) VALUES (
            v_facility_id, v_department_id, v_token, v_visit_date,
            v_payment, v_arrival, v_called, v_end_consult, v_medication,
            v_satisfaction, 'submitted'
        );
    END LOOP;
END $$;

-- ============================================================
-- A few hand-crafted rows for specific known dates
-- so the dashboard has clean data for the current week
-- ============================================================
INSERT INTO visits (
    facility_id, department_id, patient_token, visit_date,
    payment_type, arrival_time, consultation_called_time,
    consultation_end_time, medication_received_time, satisfaction_rating
) VALUES
(1, 1, MD5('handcraft_001'), CURRENT_DATE,
 'insurance',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '8 hours',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '8 hours 45 minutes',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '9 hours 15 minutes',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '9 hours 40 minutes',
 4),
(4, 8, MD5('handcraft_002'), CURRENT_DATE,
 'cash',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '9 hours',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '10 hours 20 minutes',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '10 hours 55 minutes',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '11 hours 25 minutes',
 3),
(2, 4, MD5('handcraft_003'), CURRENT_DATE,
 'insurance',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '7 hours 30 minutes',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '8 hours',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '8 hours 25 minutes',
 (CURRENT_DATE::TIMESTAMPTZ AT TIME ZONE 'Africa/Nairobi') + INTERVAL '8 hours 45 minutes',
 5);

-- Verify seed counts
SELECT 'facilities' AS tbl, COUNT(*) AS rows FROM facilities
UNION ALL SELECT 'departments', COUNT(*) FROM departments
UNION ALL SELECT 'visits',      COUNT(*) FROM visits;
