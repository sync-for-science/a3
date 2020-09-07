create temporary table pt AS
select
  json_extract(p.json, '$.id') PatientId,
  json_extract(p.json, '$.birthDate_aa.start') birthDate
from
  Patient p;

create temporary table dm_dx AS
SELECT
  json_extract(c.json, '$.subject.reference_id_aa') PatientId,
  json_extract(c.json, '$.id') ResourceId
FROM
  Condition c
  join json_each(json_extract(c.json, '$.clinicalStatus.coding')) clinical_status_coding on (
    json_extract(clinical_status_coding.value, '$.code') = 'active'
  )
  join json_each(json_extract(c.json, '$.code.coding')) condition_coding on (
    json_extract(condition_coding.value, '$.system') = 'http://snomed.info/sct'
    and json_extract(condition_coding.value, '$.code') in (
      '105401000119101', '106281000119103', '10754881000119104', '111307005', '111552007', '123763000', '127012008', '1481000119100', '190330002', '190331003', '190368000', '190372001', '190389009', '190406000', '190407009', '190410002', '190411003', '190412005', '199223000', '199225007', '199226008', '199227004', '199228009', '199229001', '199230006', '199231005', '23045005', '237599002', '237600004', '237601000', '237604008', '237613005', '237618001', '237619009', '237627000', '237651005', '24203005', '2751001', '28032008', '31321000119102', '313435000', '313436004', '314771006', '314893005', '314902007', '314903002', '314904008', '33559001', '359642000', '368521000119107', '408539000', '426705001', '426875007', '427089005', '42954008', '44054006', '445260006', '46635009', '4783006', '51002006', '530558861000132104', '57886004', '59079001', '5969009', '609561005', '609562003', '609563008', '609564002', '609566000', '609567009', '609568004', '609569007', '609570008', '609571007', '609572000', '609573005', '609574004', '609575003', '609576002', '609577006', '609578001', '70694009', '709147009', '710815001', '716362006', '71791000119104', '719216001', '720519003', '722454003', '724136006', '73211009', '733072002', '734022008', '75524006', '75682002', '76751001', '81531005', '8801005', '91352004', '9859006')
  );

create temporary table htn_dx AS
SELECT
  json_extract(c.json, '$.subject.reference_id_aa') PatientId,
  json_extract(c.json, '$.id') ResourceId
FROM
  Condition c
  join json_each(json_extract(c.json, '$.clinicalStatus.coding')) clinical_status_coding on (
    json_extract(clinical_status_coding.value, '$.code') = 'active'
  )
  join json_each(json_extract(c.json, '$.code.coding')) condition_coding on (
    json_extract(condition_coding.value, '$.system') = 'http://snomed.info/sct'
    and json_extract(condition_coding.value, '$.code') in (
      '10725009', '10964002', '1201005', '123799005', '59621000')
  )
  OR (
    json_extract(condition_coding.value, '$.system') = 'http://hl7.org/fhir/ValueSet/icd-9'
    and json_extract(condition_coding.value, '$.code') in ('401.1', '401.9')
  );

create temporary table a1c_2 AS
SELECT
  json_extract(o.json, '$.subject.reference_id_aa') PatientId,
  json_extract(o.json, '$.id') ResourceId,
  json_extract(o.json, '$.valueQuantity') valueQuantity,
  json_extract(o.json, '$.effectiveDateTime_aa.start') effectiveDateTime_start,
  json_extract(o.json, '$.effectiveDateTime_aa.end') effectiveDateTime_end
FROM
  Observation o
  join json_each(json_extract(o.json, '$.code.coding')) observation_coding on (
    json_extract(observation_coding.value, '$.system') = 'http://loinc.org'
    and json_extract(observation_coding.value, '$.code') = '4548-4'
  )
where
  json_extract(valueQuantity, '$.code') = '%'
  and json_extract(valueQuantity, '$.system') = 'http://unitsofmeasure.org'
  and json_extract(o.json, '$.status') in ('final', 'amended', 'corrected');

create temporary table a1c_2_latest AS
SELECT
  *
from
  (
    select
      a1c_2.*,
      dense_rank() over (
        partition by a1c_2.PatientId
        order by
          a1c_2.effectiveDateTime_end DESC
      ) as rank
    from
      a1c_2
  ) as q
where
  rank = 1;

create temporary table a1c_2_elevated AS
select
  *
from
  a1c_2_latest
WHERE
  json_extract(valueQuantity, '$.value') > 6;

create temporary table a1c_1 AS
SELECT
  json_extract(o.json, '$.subject.reference_id_aa') PatientId,
  json_extract(o.json, '$.id') ResourceId,
  json_extract(o.json, '$.valueQuantity') valueQuantity,
  json_extract(o.json, '$.effectiveDateTime_aa.start') effectiveDateTime_start,
  json_extract(o.json, '$.effectiveDateTime_aa.end') effectiveDateTime_end
FROM
  Observation o
  join a1c_2_elevated on (
    a1c_2_elevated.PatientId = json_extract(o.json, '$.subject.reference_id_aa')
    AND DATETIME(
      json_extract(o.json, '$.effectiveDateTime_aa.end')
    ) < DATETIME(a1c_2_elevated.effectiveDateTime_start, '-1 day')
  )
  JOIN pt ON pt.PatientId = json_extract(o.json, '$.subject.reference_id_aa')
  AND DATETIME(
    json_extract(o.json, '$.effectiveDateTime_aa.start')
  ) >= DATETIME(pt.birthDate, '+18 years')
  join json_each(json_extract(o.json, '$.code.coding')) observation_coding on (
    json_extract(observation_coding.value, '$.system') = 'http://loinc.org'
    and json_extract(observation_coding.value, '$.code') = '4548-4'
  )
where
  json_extract(valueQuantity, '$.code') = '%'
  and json_extract(valueQuantity, '$.system') = 'http://unitsofmeasure.org'
  and json_extract(o.json, '$.status') in ('final', 'amended', 'corrected');

create temporary table a1c_1_latest AS
SELECT
  *
from
  (
    select
      a1c_1.*,
      dense_rank() over (
        partition by a1c_1.PatientId
        order by
          a1c_1.effectiveDateTime_end DESC
      ) as rank
    from
      a1c_1
  ) as q
where
  rank = 1;

create temporary table a1c_1_elevated AS
SELECT
  *
from
  a1c_1_latest
WHERE
  json_extract(valueQuantity, '$.value') > 6;


SELECT
  DISTINCT(a1c_1_elevated.PatientId)
FROM
  a1c_1_elevated
  JOIN dm_dx ON a1c_1_elevated.PatientId = dm_dx.PatientId
  LEFT JOIN htn_dx oN a1c_1_elevated.PatientId = htn_dx.PatientId
WHERE
  htn_dx.PatientId IS NULL
