export default [{
	"name": "Lab Result - Numerical",
	"version": "1.0.0.alpha",
	"tableName": "Observation",
	"patientIdField": "subject.reference_id_aa",
	"fields": [
		{"id": "status", "type": "code", "field": "status", "editable": true,
			"options": [
				{"values": [{"code": "registered"}], "name": "Registered"},
				{"values": [{"code": "preliminary"}], "name": "Preliminary"},
				{"values": [{"code": "final"}], "name": "Final"},
				{"values": [{"code": "amended"}], "name": "Amended"},
				{"values": [{"code": "corrected"}], "name": "- Corrected"},
				{"values": [{"code": "cancelled"}], "name": "Cancelled"},
				{"values": [{"code": "entered-in-error"}], "name": "Entered in Error"},
				{"values": [{"code": "unknown"}], "name": "Unknown"}
			]
		},
		{"id": "id", "type": "fhirId", "field": "id"},
		{"id": "effectiveDateTimeStart", "type": "date", "field": "effectiveDateTime_aa.start"},
		{"id": "effectiveDateTimeEnd", "type": "date", "field": "effectiveDateTime_aa.end"},
		{"id": "valueQuantity", "type": "quantity", "field": "valueQuantity"},
		{"id": "code", "type": "coding", "field": "code.coding[]"},
		{"id": "dataAbsentReason", "type": "coding", "field": "dataAbsentReason.coding", "editable": true,
			"options": [
				{"values": [{"code": "unknown"}], "name": "Unknown"},
				{"values": [{"code": "asked-unknown"}], "name": "-  Asked But Unknown"},
				{"values": [{"code": "temp-unknown"}], "name": "-  Temporarily Unknown"},
				{"values": [{"code": "not-asked"}], "name": "  Not Asked"},
				{"values": [{"code": "asked-declined"}], "name": "-  Asked But Declined"},
				{"values": [{"code": "masked"}], "name": "Masked"},
				{"values": [{"code": "not-applicable"}], "name": "Not Applicable"},
				{"values": [{"code": "unsupported"}], "name": "Unsupported"},
				{"values": [{"code": "as-text"}], "name": "As Text"},
				{"values": [{"code": "error"}], "name": "Error"},
				{"values": [{"code": "not-a-number"}], "name": "-  Not a Number"},
				{"values": [{"code": "negative-infinity"}], "name": "-  Negative Infinity"},
				{"values": [{"code": "positive-infinity"}], "name": "-  Positive Infinity"},
				{"values": [{"code": "not-performed"}], "name": "Not Performed"},
				{"values": [{"code": "not-permitted"}], "name": "Not Permitted"}
			]
		}
	]
},{
	"name": "Condition",
	"version": "1.0.0.alpha",
	"tableName": "Condition",
	"patientIdField": "subject.reference_id_aa",
	"fields": [
		{"id": "id", "type": "fhirId", "field": "id"},
		{"id": "clinicalStatus", "type": "coding", "field": "clinicalStatus.coding[]", "editable": false,
			"options": [
				{"values": [{"code": "active"}], "name": "Active"},
				{"values": [{"code": "recurrence"}], "name": "- Recurrence"},
				{"values": [{"code": "relapse"}], "name": "- Relapse"},
				{"values": [{"code": "inactive"}], "name": "Inactive"},
				{"values": [{"code": "remission"}], "name": "- Remission"},
				{"values": [{"code": "resolved"}], "name": "- Resolved"},
			]
		},
		{"id": "verificationStatus", "type": "coding", "field": "verificationStatus.coding[]", "editable": false,
			"options": [
				{"values": [{"code": "unconfirmed"}], "name": "Unconfirmed"},
				{"values": [{"code": "provisional"}], "name": "- Provisional"},
				{"values": [{"code": "differential"}], "name": "- Differential"},
				{"values": [{"code": "confirmed"}], "name": "Confirmed"},
				{"values": [{"code": "refuted"}], "name": "Refuted"},
				{"values": [{"code": "entered-in-error"}], "name": "Entered in Error"},
			]
		},
		{"id": "category", "type": "coding", "field": "category[].coding[]", "editable": false,
			"options": [
				{"values": [{"code": "problem-list-item"}], "name": "Problem List Item"},
				{"values": [{"code": "encounter-diagnosis"}], "name": "Encounter Diagnosis"},
				{"values": [{"code": "health-concern"}], "name": "Health Concern"},
			]
		},
		{"id": "code", "type": "coding", "field": "code.coding[]"}
	]
},{
	"name": "Demographics",
	"version": "1.0.0.alpha",
	"tableName": "Patient",
	"patientIdField": "id",
	"fields": [
		{"id": "gender", "type": "code", "field": "gender", "editable": false,
			"options": [
				{"values": [{"code": "male"}], "name": "Male"},
				{"values": [{"code": "female"}], "name": "Female"},
				{"values": [{"code": "other"}], "name": "Other"},
				{"values": [{"code": "unknown"}], "name": "Unknown"},
			]
		},
		{"id": "birthDate", "type": "date", "field": "birthDate"},
		// {"name": "US Core Race (OMB Category)", "id": "us-race", "type": "coding", "field": "extension[].valueCoding", 
		// 	"staticFields": [{
		// 		"field": "extension[].url",
		// 		"value": " http://hl7.org/fhir/us/core/StructureDefinition/us-core-race/ombCategory"
		// 	}]
		// },
		// {"name": "US Core Ethnicity (OMB Category)", "id": "us-ethnicity", "type": "coding", "field": "extension[].valueCoding", 
		// 	"staticFields": [{
		// 		"field": "extension[].url",
		// 		"value": " http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity/ombCategory"
		// 	}]
		// },

	]

}]