export default [{
	"name": "Lab Result - Numerical",
	"version": "1.0.0.alpha",
	"fields": [
		{"name": "patient", "type": "fhirId", "field": "ptId", "exprSuffix": "subject.type = 'Patient'"},
		{"name": "id", "type": "fhirId", "field": "rId"},
		{"name": "status", "type": "coding", "field": "status", "editable": false,
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
		{"name": "effectiveDateTimeStart", "type": "instant", "field": "effectiveDateTimeStart"},
		{"name": "effectiveDateTimeEnd", "type": "instant", "field": "effectiveDateTimeEnd"},
		{"name": "valueQuantity", "type": "quantity", "field": "valueQuantity"},
		{"name": "code", "type": "coding", "field": "code"},
		{"name": "dataAbsentReason", "type": "coding", "field": "dataAbsentReason", "editable": true,
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
	"fields": [
		{"name": "patient", "type": "fhirId", "field": "ptId", "exprSuffix": "subject.type = 'Patient'"},
		{"name": "id", "type": "fhirId", "field": "rId"},
		{"name": "clinicalStatus", "type": "coding", "field": "clinicalStatus", "editable": false,
			"options": [
				{"values": [{"code": "active"}], "name": "Active"},
				{"values": [{"code": "recurrence"}], "name": "- Recurrence"},
				{"values": [{"code": "relapse"}], "name": "- Relapse"},
				{"values": [{"code": "inactive"}], "name": "Inactive"},
				{"values": [{"code": "remission"}], "name": "- Remission"},
				{"values": [{"code": "resolved"}], "name": "- Resolved"},
			]
		},
		{"name": "verificationStatus", "type": "coding", "field": "verificationStatus", "editable": false,
			"options": [
				{"values": [{"code": "unconfirmed"}], "name": "Unconfirmed"},
				{"values": [{"code": "provisional"}], "name": "- Provisional"},
				{"values": [{"code": "differential"}], "name": "- Differential"},
				{"values": [{"code": "confirmed"}], "name": "Confirmed"},
				{"values": [{"code": "refuted"}], "name": "Refuted"},
				{"values": [{"code": "entered-in-error"}], "name": "Entered in Error"},
			]
		},
		{"name": "category", "type": "coding", "field": "category", "editable": false,
			"options": [
				{"values": [{"code": "problem-list-item"}], "name": "Problem List Item"},
				{"values": [{"code": "encounter-diagnosis"}], "name": "Encounter Diagnosis"},
				{"values": [{"code": "health-concern"}], "name": "Health Concern"},
			]
		},
		{"name": "code", "type": "coding", "field": "code"}
	]
},{
	"name": "Demographics",
	"version": "1.0.0.alpha",
	"fields": [
		{"name": "patient", "type": "fhirId", "field": "id"},
		{"name": "id", "type": "fhirId", "field": "rId"},
		{"name": "gender", "type": "coding", "field": "gender", "editable": false,
			"options": [
				{"values": [{"code": "male"}], "name": "Male"},
				{"values": [{"code": "female"}], "name": "Female"},
				{"values": [{"code": "other"}], "name": "Other"},
				{"values": [{"code": "unknown"}], "name": "Unknown"},
			]
		},
		{"name": "birthDate", "type": "instant", "field": "birthDate"},
		{"name": "usCoreRace", "type": "coding", "field": "usCoreRace"},
		{"name": "usCoreEthnicity", "type": "coding", "field": "usCoreEthnicity"},

	]

}]