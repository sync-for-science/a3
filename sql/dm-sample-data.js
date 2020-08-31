const dm_pt = "p1";
const htn_pt = "p1";
const dob = "2000-01-01";
const a1c_1_pt = "p1";
const a1c_2_pt = "p1"
const a1c_1_dt = "2019-12-31";
const a1c_2_dt = "2019-11-30";
const a1c_1_val = 8.22;
const a1c_2_val = 8.22;

const data = [{
	"resourceType": "Patient",
	"id": "p1",
	// "extension": [{
	// 	"url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race/ombCategory",
	// 	"parent": "0",
	// 	"valueCoding": {
	// 		"system": "urn:oid:2.16.840.1.113883.6.238",
	// 		"code": "2106-3",
	// 		"display_aa": "WHITE",
	// 		"display": "White"
	// 	}
	// }],
	// "identifier": [{
	// 	"type": {
	// 		"coding": [{
	// 			"system": "http://terminology.hl7.org/CodeSystem/v2-0203",
	// 			"code": "MR",
	// 			"display_aa": "MEDICAL RECORD NUMBER",
	// 			"display": "Medical Record Number"
	// 		}]
	// 	},
	// 	"system": "http://hospital.smarthealthit.org",
	// 	"value_aa": "31A0457F-F170-4BFF-9554-320FD8370333",
	// 	"value": "31a0457f-f170-4bff-9554-320fd8370333"
	// }],
	// "name": [{
	// 	"use": "official",
	// 	"family_aa": "STROSIN214",
	// 	"family": "Strosin214",
	// 	"given_aa": ["WILLIAMS176"],
	// 	"given": ["Williams176"]
	// }],
	// "telecom": [{
	// 	"system": "phone",
	// 	"value_aa": "555-377-1613",
	// 	"value": "555-377-1613",
	// 	"use": "home"
	// }],
	// "gender": "male",
	"birthDate_aa": {
		"start": dob + " 00:00:00.000Z",
		"end": dob + " 23:59:59.999Z"
	},
	// "birthDate": dob,
	// "id_prev_aa": "31a0457f-f170-4bff-9554-320fd8370333"
},{
	"resourceType": "Condition",
	"id": "c1",
	"clinicalStatus": {
		"coding": [{
			"system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
			"code": "active"
		}]
	},
	"verificationStatus": {
		"coding": [{
			"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
			"code": "confirmed"
		}]
	},
	"code": {
		"coding": [{
			"system": "http://snomed.info/sct",
			"code": "44054006",
			// "display_aa": "DIABETES",
			"display": "Diabetes"
		}],
		// "text_aa": "DIABETES",
		// "text": "Diabetes"
	},
	"subject": {
		// "reference": "Patient/"+dm_pt,
		"reference_id_aa": dm_pt,
		// "reference_prev_aa": "Patient/e3a38819-cc1e-48eb-bcb3-583cbd2fb9c6",
		"type": "Patient"
	},
	// "encounter": {
	// 	"reference": "Encounter/e1",
	// 	"reference_id_aa": "e1",
	// 	"reference_prev_aa": "Encounter/272dca99-5a03-4903-ac5e-fcbc81fbaea2",
	// 	"type": "Encounter"
	// },
	// "onsetDateTime_aa": {
	// 	"start": "2005-07-03 03:22:31.000-04:00",
	// 	"end": "2005-07-03 03:22:31.999-04:00"
	// },
	// "onsetDateTime": "2005-07-03T03:22:31-04:00",
	// "recordedDate_aa": {
	// 	"start": "2005-07-03 03:22:31.000-04:00",
	// 	"end": "2005-07-03 03:22:31.999-04:00"
	// },
	// "recordedDate": "2005-07-03T03:22:31-04:00",
	// "id_prev_aa": "d3eda5d3-4dec-4481-a15b-a2bb7bd3397f"
},{
	"resourceType": "Condition",
	"id": "c2",
	"clinicalStatus": {
		"coding": [{
			"system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
			"code": "active"
		}]
	},
	"verificationStatus": {
		"coding": [{
			"system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
			"code": "confirmed"
		}]
	},
	"code": {
		"coding": [{
				"system": "http://snomed.info/sct",
				"code": "59621000",
				// "display_aa": "HYPERTENSION",
				"display": "Hypertension"
			}],
		// "text_aa": "HYPERTENSION",
		// "text": "Hypertension"
	},
	"subject": {
		// "reference": "Patient/"+htn_pt,
		"reference_id_aa": htn_pt,
		// "reference_prev_aa": "Patient/4d4bd280-79c9-4d27-a63c-4bfc709c15ab",
		"type": "Patient"
	},
	// "encounter": {
	// 	"reference": "Encounter/e1",
	// 	"reference_id_aa": "e1",
	// 	"reference_prev_aa": "Encounter/272dca99-5a03-4903-ac5e-fcbc81fbaea2",
	// 	"type": "Encounter"
	// },
	// "onsetDateTime_aa": {
	// 	"start": "2017-08-03 10:05:12.000-04:00",
	// 	"end": "2017-08-03 10:05:12.999-04:00"
	// },
	// "onsetDateTime": "2017-08-03T10:05:12-04:00",
	// "recordedDate_aa": {
	// 	"start": "2017-08-03 10:05:12.000-04:00",
	// 	"end": "2017-08-03 10:05:12.999-04:00"
	// },
	// "recordedDate": "2017-08-03T10:05:12-04:00",
	// "id_prev_aa": "ec513505-5a67-4feb-8347-6acaa08d85ba"
},{
	"resourceType": "Observation",
	"id": "o1",
	"status": "final",
	"category": [{
		"coding": [{
				"system": "http://terminology.hl7.org/CodeSystem/observation-category",
				"code": "laboratory",
				// "display_aa": "LABORATORY",
				// "display": "laboratory"
		}]
	}],
	"code": {
		"coding": [{
			"system": "http://loinc.org",
			"code": "4548-4",
			// "display_aa": "HEMOGLOBIN A1C/HEMOGLOBIN.TOTAL IN BLOOD",
			"display": "Hemoglobin A1c/Hemoglobin.total in Blood"
		}],
	// "text_aa": "HEMOGLOBIN A1C/HEMOGLOBIN.TOTAL IN BLOOD",
	// "text": "Hemoglobin A1c/Hemoglobin.total in Blood"
	},
	"subject": {
		// "reference": "Patient/" + a1c_1_pt,
		"reference_id_aa": a1c_1_pt,
		// "reference_prev_aa": "Patient/e16a32f6-19aa-4b3d-b1b7-a13a585a8af9",
		"type": "Patient"
	},
	// "encounter": {
	// 	"reference": "Encounter/e1",
	// 	"reference_id_aa": "e1",
	// 	"reference_prev_aa": "Encounter/94c42449-79c4-47d6-85e0-402e160aa594",
	// 	"type": "Encounter"
	// },
	"effectiveDateTime_aa": {
		"start": a1c_1_dt + " 11:53:47.000-05:00",
		"end": a1c_1_dt + " 11:53:47.999-05:00"
	},
	// "effectiveDateTime": a1c_1_dt + "3T11:53:47-05:00",
	// "issued_aa": {
	// 	"start":  a1c_1_dt +" 11:53:47.597-05:00",
	// 	"end":  a1c_1_dt +" 11:53:47.597-05:00"
	// },
	// "issued":  a1c_1_dt + "T11:53:47.597-05:00",
	"valueQuantity": {
		"value": a1c_1_val,
		// "unit_aa": "%",
		// "unit": "%",
		"system": "http://unitsofmeasure.org",
		"code": "%"
	},
	// "id_prev_aa": "ec4dfb4f-57a4-4c74-97b9-a4922e913b77"
},{
	"resourceType": "Observation",
	"id": "o2",
	"status": "final",
	"category": [{
		"coding": [{
				"system": "http://terminology.hl7.org/CodeSystem/observation-category",
				"code": "laboratory",
				// "display_aa": "LABORATORY",
				// "display": "laboratory"
		}]
	}],
	"code": {
		"coding": [{
			"system": "http://loinc.org",
			"code": "4548-4",
			// "display_aa": "HEMOGLOBIN A1C/HEMOGLOBIN.TOTAL IN BLOOD",
			"display": "Hemoglobin A1c/Hemoglobin.total in Blood"
		}],
	// "text_aa": "HEMOGLOBIN A1C/HEMOGLOBIN.TOTAL IN BLOOD",
	// "text": "Hemoglobin A1c/Hemoglobin.total in Blood"
	},
	"subject": {
		// "reference": "Patient/" + a1c_2_pt,
		"reference_id_aa": a1c_2_pt,
		// "reference_prev_aa": "Patient/e16a32f6-19aa-4b3d-b1b7-a13a585a8af9",
		"type": "Patient"
	},
	// "encounter": {
	// 	"reference": "Encounter/e1",
	// 	"reference_id_aa": "e1",
	// 	"reference_prev_aa": "Encounter/94c42449-79c4-47d6-85e0-402e160aa594",
	// 	"type": "Encounter"
	// },
	"effectiveDateTime_aa": {
		"start": a1c_2_dt + " 11:53:47.000-05:00",
		"end": a1c_2_dt + " 11:53:47.999-05:00"
	},
	// "effectiveDateTime": a1c_2_dt + "3T11:53:47-05:00",
	// "issued_aa": {
	// 	"start":  a1c_2_dt +" 11:53:47.597-05:00",
	// 	"end":  a1c_2_dt +" 11:53:47.597-05:00"
	// },
	// "issued":  a1c_2_dt + "T11:53:47.597-05:00",
	"valueQuantity": {
		"value": a1c_2_val,
		// "unit_aa": "%",
		// "unit": "%",
		"system": "http://unitsofmeasure.org",
		"code": "%"
	},
	// "id_prev_aa": "ec4dfb4f-57a4-4c74-97b9-a4922e913b77"
}]

module.exports = data;