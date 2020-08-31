const buildBundle = (bundle) => {
	let definitions = {};
	let resourceNames = [];

	bundle.entry
		.filter( entry =>  entry.resource.resourceType == "StructureDefinition")
		.forEach( sd => {

			if (sd.resource.kind !== "complex-type" && sd.resource.kind !== "resource") return;
			if (sd.resource.kind === "resource") {
				resourceNames.push(sd.resource.name);
				//resourceType doesn't seem to be a field anywhere?
				definitions[sd.resource.name + ".resourceType"] = {type: "string"};
			}

			sd.resource.snapshot.element.forEach( elem => {

				// if (elem.path.indexOf("Questionnaire") !== 0) return;

				if (!elem.type && elem.contentReference) {
					definitions[elem.path] = {
						type: "ContentReference", 
						isArray: elem.max !== "1", 
						contentReference: elem.contentReference.slice(1)
					}
				}

				elem.type && elem.type.length && elem.type.forEach( type => {
					const path = elem.type.length === 1
						? elem.path
						: elem.path.replace("[x]", type.code[0].toUpperCase() + type.code.slice(1));
					const outputType = type.code === "http://hl7.org/fhirpath/System.String" ? "fhirid" : type.code;
					const isArray =  elem.max !== "1";
					const referenceTargets = type.targetProfile &&
						type.targetProfile.map( profile => profile.split("/")[profile.split("/").length-1] );
					definitions[path] = {type: outputType, isArray, referenceTargets};
				});
			});
		});
	return {definitions, resourceNames};
}

module.exports = {buildBundle}