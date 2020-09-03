# A3 - Prototype of FHIR-native ETL+Q Platform

## Use Cases
- Cohort definition for research studies
	- Export dataset for analysis
	- Export patient list for chart review
	- Analysis within a data visualization tool
- Patient lists for care management and gap identification
- Defining CDS inclusion and exclusion criteria
- Cohort definition for CQM numerator and denominator (especially in simple measures)

## Extract

Electronic Health Record systems (EHRs) and Payor systems have increasingly mapped clinical and claims data into the HL7 FHIR format. This includes most major EHR vendors (Epic, Cerner, Allscripts, NextGen, Meditech, eClinicalWorks, and others), and major payors organizations like Medicare. Today, most of this data is available through an API focused on retrieving data on a single patient at a time. Using the recently released [FHIR Bulk Data Access API](https://hl7.org/fhir/uv/bulkdata/index.html), these standardized data models can be efficiently extracted from systems for a population of patients, replacing custom, system specific export formats. 

A number of new regulatory requirements will catalyze broad deployment of this capability over the next few years:
- 21st Century Cures Act ONC Rules require support for the FHIR Bulk Data Access API access as a condition of EHR certification beginning in mid-2022.
- CMS API Rules requires that Medicaid, the Children’s Health Insurance Program, Medicare Advantage plans, and Qualified Health Plans in the federally facilitated exchanges to provide enrollees with API access to medical claims and other health information electronically by January 2021.
- NIH Notice NOT-OD-19-122 (June 2019) encourages NIH researchers to "explore the use of [FHIR] to capture, integrate, and exchange clinical data for research purposes and to enhance capabilities to share research data." 

Existing FHIR Bulk Data API implementations include:
- Open Source FHIR Servers
	- [Microsoft](https://github.com/microsoft/fhir-server)
	- [IBM](https://github.com/IBM/FHIR)
	- [HAPI](https://hapifhir.io/)
- Cloud Services
	- [Microsoft Azure](https://azure.microsoft.com/en-us/services/azure-api-for-fhir/)
	- [CareEvolution](https://fhir.docs.careevolution.com/interface/r4/operations/)
- Data Providers
	- [CMS Data at the Point of Care (pilot)](https://dpc.cms.gov/)
	- [CMS ACO Beneficiary Claims Data (pilot)](https://sandbox.bcda.cms.gov/)
- Synthetic Data for Testing
	- [SMART Bulk Data Server (no registration required)](https://bulk-data.smarthealthit.org/): Developer tool for Bulk Data clients
	- [Synthea](https://synthetichealth.github.io/synthea/): Open source synthetic FHIR data generator that can create FHIR Bulk Data files

## Transform

This activity picks up where the current HL7 FHIR Bulk Data API extraction leaves off - with a set of raw FHIR data export files in NDJSON format. While the FHIR data model schemas are well structured, extensible and flexible, they are designed for data transport, rather than storage or analytics. FHIR is not unique in this regard, EHR and billing data exports generally require transformation to support analytic queries.

However, as a highly compressible, streamable format with broad tooling support, NDJSON provides a robust base for data transformation. These transformations can be performed in a pipeline that varies by data source and use case, creating new, modified  NDJSON files to be loaded into an analytics platform.

A3 represents a component in such a transformation pipeline that adds a standard set of annotations to the FHIR data models to better support the types of queries used in defining cohorts, calculating quality measures, and performing public health data surveillance. There are a number of advantages to a model where FHIR data is annotated rather than converted into a new format:

- The raw data are always available to users if questions arise around the derived data models
- There is extensive documentation of FHIR in the form of thousands of pages of creative commons licensed text, publicly available videos, and training courses
- As more developers and researchers use FHIR in building clinical applications, they will be able to re-use these skills in analytics work (and vice versa)
- There is no loss of fidelity that can result when converting from EHR FHIR exports (and increasingly, exports from billing systems supporting the Blue Button 2.0 API) to a format with a different level of granularity or that only supports a subset of the fields
- Large community efforts exist to map formats such as OMOP and i2b2 to FHIR making it a lingua franca for healthcare data
- Even when data is ultimately converted to another format, there are advantages to running some analytics in parallel in the source format to ensure that data integrity is maintained in the transformation

The initial set of annotations defined in A3 cover the areas below (described in more detail in [algorithm.md](algorithm.md)), as unit tests in [augmentor.test.js](./etl/test/augmentor.test.js), and implemented in [augmentor.js](./etl/src/augmentor.js)). Of course, there is always a trade off between storing additional annotation data and building more complex queries at run time. Many modern big data systems are CPU bound rather than disk bound, and every system is limited  by developer/data analyst availability, so A3 leans toward reducing complexity and computation by storing additional data. However, A3 does not alter the structure of the FHIR resources, instead annotating them with additional properties (in the case of contained resources generating supplementary resources). All of the A3 annotations are all suffixed by `_aa` (eg. `display_aa`) so the resources can easily be returned to a validatable FHIR format by stripping out these elements.

A3 Annotations:
- Date and time values (eg. a FHIR date of "2019" should be queryable as a date range of 1-1-2019 to 12-31-2019). [Details](algorithm.md#date-datetime-instant)
- Text values (eg. text with differing unicode codepoints that appears the same to end users should be queryable using a single text string). [Details](algorithm.md#string)
- Resource identifiers (eg. there may be namespace collisions when data is integrated from multiple systems). [Details](algorithm.md#resource-id)
- Contained Resources (eg. users should not have to know the embedding business rules used by the source FHIR server). [Details](algorithm.md#contained-resources)
- Resource references (eg. as with identifiers, there may be namespace collisions when data is integrated from multiple systems). [Details](algorithm.md#reference)
- Extensions (eg. may be nested with relative urls making querying difficult). [Details](algorithm.md#extensions-and-modifier-extensions)
- Recursive Structures (eg. some structures can be infinitely recursive and need to be truncated to be stored in a queryable format). [Details](algorithm.md#recursive-structures)
- Address (eg. postal standardization and geocoding) - not currently implemented in prototype. [Details](algorithm.md#address---not-currently-implemented-in-prototype)
- Aggregations (eg. drug and device exposure eras) - not currently implemented in prototype.

Other transformations that may be applied as stages in the pipeline in conjunction with A3 include NLP to convert clinical notes to structured FHIR data, terminology expansion to insert additional identifiers, de-identification (Microsoft has recently released an open source bulk data tool for this at https://github.com/microsoft/FHIR-Tools-for-Anonymization), validation (for example, the NLM LOINC to unit validator at https://github.com/lhncbc/loinc-mapping-validator), matching patients and providers to master patient and provider indexes and adding these identifiers to the FHIR resources, and even ML based risk scoring.

An earlier project tackling FHIR data transformation for analytics is described at https://github.com/FHIR/sql-on-fhir/blob/master/sql-on-fhir.md though it does not appear to be actively developed.

## Load

The annotated NDJSON files resulting from the transform stage are system agnostic and can be loaded into many different big data platforms, often leveraging built in NDJSON support. A3 can currently generate schema files for Google BigQuery based on the structured FHIR resource definitions included with the standard ([bigquery.js](./etl/src/bigquery.js) and [bigquery.test.js](./etl/test/bigquery.test.js)). The BigQuery command line tools can then be used to load the Bulk Data NDJSON files. In the future, it may make sense to explore generating the schema files from a combination of the data files and the FHIR resource definitions, particularly in sparsely populated datasets, to more closely align the schema definitions to the FHIR elements that are being used.

## Query

### Cohort Query UI

There are a number of popular cohort query tools, such as OHDSI Atlas and i2b2. However, with the exception of the AHRQ CDS development tool, they pre-date the creation of FHIR and don't align smoothly with the FHIR data modeling approach. The A3 Query UI provides a SQL generation tool that is a first step in creating FHIR native cohort tooling. The tool mimics "Figure 1" in many papers, enabling users to create a flow that excludes members of the patient population through a set of filters. Note that the capability to dynamically generate SQL based on the rules defined in the UI is still under development.

The example visual definition and SQL query below builds a cohort of patients who meet the following criteria:
- Diagnosis of diabetes
- No diagnosis of hypertension
- Most recent A1C lab result is elevated
- Result of at least one day prior is also elevated
- Patient was at least 18 years old when the earlier lab was taken

Links:
- [A3 Query UI Demo (A1C Example)](http://syncfor.science/a3/index.html?example=true)
- [A3 Query UI Demo](http://syncfor.science/a3/)
- [BigQuery SQL - Dynamic Data](./sql/dm-example-bq.sql) - hand coded example, but goal is to auto-generate from the Cohort Query UI down the road. Queries a public A3 dataset of 118 synthetic patients generated using https://github.com/synthetichealth/synthea.
- [BigQuery SQL - Static Data](./sql/dm-example-bq-static-data.sql) - queries hard coded temp tables loaded at the start of the SQL script to simplify experimentation.

### Cohort Definition UI Prior Art

- i2b2 Temporal Query Tool
	- User Guide: https://www.i2b2.org/webclient/help/tqt.html
- AHRQ CDS Connect
	- Webinar: https://www.youtube.com/watch?v=3hI6GIuYQgs
	- User Guide: https://cds.ahrq.gov/authoring/userguide
	- Demo: https://cds.ahrq.gov/authoring/
- OHDSI Atlas Cohort Tool
	- Tutorial: https://www.youtube.com/watch?v=JQFGedOaNiw
	- Demo: http://atlas-demo.ohdsi.org/#/cohortdefinition
- TriNetX Cohort Builder
	- Demo: https://www.youtube.com/watch?v=Nb6-oKi29Gs&t=1501s
- MDClone Cohort Builder
	- Demo: https://youtu.be/GKYcPz4vc6I
- Generic Query Builder UI Tools
	- Visual SQL: https://chartio.com/docs/visual-sql/
	- Jquery: https://querybuilder.js.org/
	- React: https://github.com/ukrbublik/react-awesome-query-builder
	- Firebase Dynamic Audience Builder: 
		- Overview: https://firebase.googleblog.com/2019/01/a-crash-course-in-using-new-audiences.html
		- Demo: https://www.youtube.com/watch?v=ouZkadjMn94 


## Using the A3 Prototype

### Data transformation and loading
1. Install GCP CLI and NodeJs
2. `npm i`
3. Generate schema JSON: `node ./etl/scripts/gen-bq-schemas`. This will create a set of schema files in output location identified in `./etl/scripts/config-bq-schemas.json`. The resources and extensions to include, as well as the desired level of recursion can also be specified in the config file.
4. Transform NDJSON for analytics: `node ./etl/scripts/gen-annotated`. The source and destination file locations are defined in `./etl/scripts/config-annotated.json`. The resources and extensions to include, as well as the desired level of recursion can also be specified in the config file.
5. Upload to GCP: `node ./etl/scripts/bq-upload`. The file locations and GCP project information can be specified in `./etl/scripts/config-bq-upload.json`.

### User Interface
1. Make sure NodeJs is installed
2. `cd ./ui`
3. `npm i`
4. `npm start`