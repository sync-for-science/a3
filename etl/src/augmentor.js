const crypto = require("crypto");

function trimUrl(url) {
	return url.replace(/\/$/, "");
}

function urlToHash(url) {
	const hashUrl = url.replace(/^http(s?):\/\//, "")
	return crypto.createHash("sha1").update(hashUrl, "binary").digest("hex");
}
function transformDate(value, tzOffset="Z") {

	//year only
	if (/^\d{4}$/.test(value)) {
		return {
			start: `${value}-01-01 00:00:00.000${tzOffset}`, 
			end: `${value}-12-31 23:59:59.999${tzOffset}`,
		}

	//year and month	
	} else if (/^\d{4}-\d{2}$/.test(value)) {
		const d = new Date(value.split("-")[0], value.split("-")[1], 0);
		return {
			start: `${value}-01 00:00:00.000${tzOffset}`,
			end: `${value}-${d.getDate()} 23:59:59.999${tzOffset}`,
		} 

	//year, month, and day
	} else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return {
			start: `${value} 00:00:00.000${tzOffset}`, 
			end: `${value} 23:59:59.999${tzOffset}`,
		} 

	//year, month, day, and time
	} else if (/T\d{2}:\d{2}:\d{2}/.test(value)) {
		const parts = value.match(/(.+)T(\d{2}:\d{2}:\d{2})(\.\d+)?(.*)/);
		const startMs = (parts[3]||"") + ".000".slice((parts[3]||"").length);
		const endMs = (parts[3]||"") + ".999".slice((parts[3]||"").length);
		return {
			start: `${parts[1]} ${parts[2]}${startMs}${parts[4]||tzOffset}`,
			end: `${parts[1]} ${parts[2]}${endMs}${parts[4]||tzOffset}`
		}
	}

}

function transformReference(value, baseUrl, containedResources, definitions, schemaConfig={}, fullPath, recursionList={}, parentResource) {

	const urlToType = (url) => {
		const parts = trimUrl(url).split("/");
		return parts[parts.length-2];
	}

	value = walkElement(value, definitions, ["Reference"], null, schemaConfig, fullPath, recursionList);

	//ignore references without a resource url
	if (!value.reference) return value;

	//reference to contained resource
	if (value.reference[0] === "#") {

		const resource = value.reference !== "#"
			? containedResources.find( res => res.id_prev_aa.split("#")[res.id_prev_aa.split("#").length-1] === value.reference.slice(1))
			: parentResource;

		return {
			...value,
			reference: `${resource.resourceType}/${resource.id}`,
			reference_id_aa: resource.id,
			reference_prev_aa: value.reference,
			type: resource.resourceType
		}
	}

	const url = (value.reference.indexOf("http:") === 0 || value.reference.indexOf("https:") === 0)
		? value.reference //full url
		: trimUrl(baseUrl) + "/" + value.reference; //relative url

	const type = urlToType(url);
	const id = urlToHash(url);
	return {
		...value,
		reference: `${type}/${id}`,
		reference_id_aa: id,
		reference_prev_aa: value.reference,
		type
	}

}

function transformText(value) {
	//standardize unicode representation, remove diacritics, capitalize
	//see https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript 
	return value.toUpperCase()
		.normalize("NFD") //decompose
		.replace(/[\u0300-\u036f]/g, "")
		.normalize(); //recompose
}

function transformExtension(value, definitions, schemaConfig, fullPath) {
	let flatExtensions = [];
	const flattenExtension = (extension, parentUrl=null, parentPos=[]) => {
		extension.forEach( (ext, i) => {
			const url = (parentUrl ? trimUrl(parentUrl) + "/" : "") + ext.url;
			pos = [].concat(parentPos, [i]);
			if (ext.extension) {
				flattenExtension(ext.extension, url, pos);
			} else {
				const valueKey = Object.keys(ext).filter(k => k!== "url")[0];
				const parent = parentPos.length ? parentPos.join(".") : null;
				const newSchemaConfig = {...schemaConfig, inExtension: true, defaultRecursionLimit: 1}
				const value = walkElement({[valueKey]: ext[valueKey]}, definitions, ["Extension"], null, newSchemaConfig, fullPath);
				if (Object.keys(value).length > 0) flatExtensions.push({url, parent, ...value})
			}
		})
	}

	flattenExtension(value);
	return (flatExtensions.length ? flatExtensions : undefined)

}

function transformId(value, baseUrl, resourceType) {
	const url = trimUrl(baseUrl) + "/" + resourceType + "/" + value;
	return urlToHash(url);
}

function walkElement(element, definitions, path=[], baseUrl="", schemaConfig={}, fullPath, recursionList={}, containedList=[], parentResource) {
	let output = {};

	Object.keys(element).forEach( key => {
	
		let joinedPath = [].concat(path, key).join(".");
		const elementValue = element[key];

		//jump to contentReference
		if (definitions[joinedPath] && definitions[joinedPath].type === "ContentReference")
			joinedPath = definitions[joinedPath].contentReference;
		
		//update recursion list
		recursionList[joinedPath] = recursionList[joinedPath] || 0;
		recursionList[joinedPath] = recursionList[joinedPath] + 1;
		const maxRecursion = schemaConfig.recursionLimits && schemaConfig.recursionLimits[joinedPath] ||
			schemaConfig.defaultRecursionLimit || 3;
		if (recursionList[joinedPath] > maxRecursion && !schemaConfig.suppressRecursionErrors) {
			throw new Error(`Recursion limit exceeded on ${joinedPath}`);
		} else if (recursionList[joinedPath] > maxRecursion) {
			return;
		}

		const elemFullPath = fullPath ? fullPath+"."+key : joinedPath;
		
		const definition = key === "resourceType"
			? {type: "string"}
			: definitions[joinedPath];
		
		if (!definition)
			throw new Error(`Definition not found for ${joinedPath}`);

		//only allow pre-defined value types in extension
		if ((path[0] === "Extension") && 
			!(schemaConfig.includeExtensions||[]).find(ext => ext.indexOf(elemFullPath) > -1) 
		) {
			if (!schemaConfig.suppressExtensionErrors) 
				throw new Error("Schema not found not found for " + elemFullPath);
			return;
		}

		//don't allow extensions in complex elements in extensions
		if (schemaConfig.inExtension && definition.type === "Extension") {
			if (!schemaConfig.suppressExtensionErrors) 
				throw new Error("Nested extension found in " + elemFullPath);
			return;
		};

		//type is narrative or markdown -> skip
		if (definition.type === "Narrative" || definition.type === "markdown" || definition.type === "Resource")
			return;

		//type is Extension
		if (definition.type === "Extension") {
			output[key] = transformExtension(elementValue, definitions, schemaConfig, elemFullPath);

		//type is a Reference
		} else if (definition.type === "Reference") {
			output[key] = Array.isArray(elementValue)
				? elementValue.map( v => transformReference(v, baseUrl, containedList, definitions, schemaConfig, elemFullPath, {...recursionList}, parentResource))
				: transformReference(elementValue, baseUrl, containedList, definitions, schemaConfig, elemFullPath, {...recursionList}, parentResource);

		//type is a backbone element
		} else if (definition.type === "BackboneElement" || definition.type === "Element") {
			output[key] = Array.isArray(elementValue)
				? elementValue.map(v => walkElement(v, definitions, joinedPath, baseUrl, schemaConfig, elemFullPath, {...recursionList}, containedList, parentResource))
				: walkElement(elementValue, definitions, joinedPath, baseUrl, schemaConfig, elemFullPath, {...recursionList}, containedList, parentResource);
			
		//type is another complex type
		} else if (definition.type[0].toUpperCase() === definition.type[0]) {
			output[key] = Array.isArray(elementValue)
				? elementValue.map(v => walkElement(v, definitions, [definition.type], baseUrl, schemaConfig, elemFullPath, {...recursionList}, containedList, parentResource))
				: walkElement(elementValue, definitions, [definition.type], baseUrl, schemaConfig, elemFullPath, {...recursionList}, containedList, parentResource);

		//type is text
		} else if (definition.type === "string" && key !== "resourceType" && key !== "reference") {
			output[key+"_aa"] = Array.isArray(elementValue)
				? elementValue.map(transformText)
				: transformText(elementValue);
			output[key] = elementValue;

		//type is date
		} else if (definition.type === "date" || definition.type === "dateTime" || definition.type === "instant") {
			output[key+"_aa"] = Array.isArray(elementValue)
				? elementValue.map(transformDate)
				: transformDate(elementValue);
			output[key] = elementValue;

		//truncate decimal precision (bq supports 9 places)
		} else if (definition.type === "decimal") {
			output[key] = parseFloat(elementValue.toFixed(9));

		//type is a non-augmented simple type
		} else {
			output[key] = elementValue;
		}
	});
	return output;
};

function transformResource(value, definitions, baseUrl="", parent, schemaConfig={}) {
	let contained  = [];

	//concat id if contained resource
	const id_prev_aa = parent && parent.id_prev_aa ? parent.id_prev_aa + "#" + value.id : value.id;
	//convert id to hash
	const id = id_prev_aa && transformId(id_prev_aa, baseUrl, value.resourceType);
	const resourceDetail = {id, id_prev_aa, resourceType: value.resourceType};

	//un-contain contained resources
	if (value.contained) contained = 
		value.contained.map( res => transformResource(res, definitions, baseUrl, resourceDetail, schemaConfig) );
	
	let augmented = walkElement(value, definitions, [value.resourceType], baseUrl, schemaConfig, null, {}, contained, parent);
	
	augmented.id_prev_aa = id_prev_aa;
	augmented.id = id;

	return (contained.length ? contained.concat([augmented]) : augmented);
}

module.exports = {
	transformDate, transformReference, 
	transformId, transformExtension, transformText,
	transformResource
}