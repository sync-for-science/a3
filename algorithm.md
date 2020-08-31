# FHIR Analytics Annotation Algorithm

Bulk FHIR transformations to apply a standard set of annotations to the FHIR data models to better support the types of queries used in defining cohorts, calculating quality measures, and performing public health data. 

[Prototype implementation](./etl/src/augmentor.js) ([unit tests](./etl/test/augmentor.test.js)).

## Date, DateTime, Instant

1. Convert value to UTC
2. If partial dates, convert to start and end with sub-second precision. For example, '2018-05' will be populated with start date being '2018-05-01T00:00:00.000Z' and end date being '2018-05-31T23:59:59.999Z'. '2017-03-01' will be populated with start date being '2017-03-01T00:00:00.000Z' and end date being '2017-03-01T23:59:59.999Z'
3. Instant types should have the same start and end
4. Add to resource as {elementName}_aa.start and {elementName}_aa.end

* FHIR Timing elements are ignored at present due to their limited use and the complexity involved in converting them into a date range.

## String

1. Convert to uppercase
2. Follow unicode codepoint normalization guidelines (for JS: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
3. Add to resource as {elementName}_aa

* Note: applied to text element in CodeableConcept and display element in Coding
* TODO: review  string normalization implementations in HAPI and MS FHIR servers

## Resource Id

1. Build URL with base url, resourceType, and id
2. Remove scheme 
3. Hash with SHA1
4. Update resource id to hash
5. Retain original id in id_prev_aa

* TODO: is SHA1 the best hashing algorithm for this?

## Narrative and Markdown

1. Omit from analytic dataset by default with option to include Narrative (optional inclusion not yet implemented in prototype)

## Contained Resources

1. Build URL with base url, resourceType, parent resource id, and contained resource id
2. Remove URL scheme 
3. Hash with SHA1
4. Update resource id
5. Retain original id in id_prev_aa
6. Extract from parent resource
7. Update internal references in former parent to new id

* TODO: is SHA1 the best hashing algorithm for this?

## Reference

1. If absolute URL, and base matches FHIR server base URL (ie not an external reference):

	id = hash of url without scheme

2. If relative URL

	id = hash of base url without scheme + relative url 

3. If contained URL

	id = hash of base url without scheme + relative url + "#" + relative id

4. Store previous Reference.reference as reference_prev_aa
5. Update Reference.reference to [resourceType]/[hashed id]
6. Populate Reference.type if not populated
7. Populate reference_id_aa with the hashed id

## Extensions and Modifier Extensions 

Flattened into a record structure for easy querying. 
 
Note that BigQuery uses a typed schema and limits the number of fields in a table, so only FHIR types pre-defined for that extension path are included in the record.

1. Make all extensions URLs absolute
2. Flatten to the following table, replacing the extension element:
   ```
   extension []
     parent (eg. 0.1.2)
	 url (absolute)
     value[x]
   ```
Example queries:
```sql
	SELECT * 
		FROM Patient,
		UNNEST (extension) AS pt_extension
		WHERE pt_extension.url = "http://fhir.org/guides/argonaut/StructureDefinition/argo-race/ombCategory"
			AND pt_extension.valueCoding.system = "http://fhir.org/guides/argonaut/v3/Race"
			AND pt_extension.valueCoding.code = "1002-5"

	SELECT * 
		FROM Patient,
		UNNEST (extension) AS pt_extension
		WHERE pt_extension.url = "http://fhir.org/guides/argonaut/StructureDefinition/argo-race/text"
			AND pt_extension.valueString_aa LIKE "%MIXED%"
```

## Recursive Structures

A few FHIR structures can be infinitely nested and need to be limited to fit in BigQuery and other schema based data stores.

1. Extensions can contain extensions (handled by flattening extensions as described above)
2. Extensions can contain complex types that can contain extensions (currently handled by omitting these)
3. Complex types can contain other complex types (eg. an Reference includes an Identifier has an Assigner which is a Reference). This is handled by limiting the levels of recursion to a pre-defined number of levels by path (prototype defaults to 3).
4. Context References that are circular (eg. Questionnaire.item.item). This is handled by limiting the levels of recursion to a pre-defined number of levels by path (prototype defaults to 3).

## Address - not currently implemented in prototype

1. Normalize city, district, state and country by converting to uppercase and fixing abbreviations where possible
2. Optionally geocode 
3. Add to Address type:
    ```
	city_aa
	district_aa
	state_aa
	country_aa
	geocode_aa
	  longitude Longitude with WGS84 datum
	  latitude decimal Latitude with WGS84 datum
	  altitude decimal Altitude with WGS84 datum
    ```
## Extensions on Primitive Types - not currently implemented in prototype

If needed, primitive extensions could be flattened using a similar approach to that described above for other extensions.

## Drug Exposure Eras (via post load updated queries) - not currently implemented in prototype

* TODO: possible base on approach in OMOP

## Open Questions

1. Is it worth grouping similar choice types (eg. date, dateTime, instant) into one type for querying or should this be handled by the query generator checking for the existence of each type?
2. Support inclusion of timezone offset extension (https://www.hl7.org/fhir/extension-tz-offset.json.html) on date and time elements rather than assuming UTC?
3. Build schema for each upload and tailor to data or build general purpose schema (as is currently done)? Pro: would transparently support extensions and primitive extensions. Con: clients would have to check if fields exists prior to querying.