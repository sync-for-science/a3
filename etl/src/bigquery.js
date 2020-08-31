function buildSchema(basePath, definitions, config={}, fullPath, recursionList={}) {
	let schema = [];
	const basePathLength = basePath.split(".").length;

	const typeMapping = {
		boolean: "BOOLEAN", integer: "INTEGER", decimal: "NUMERIC", unsignedInt: "INTEGER", positiveInt: "INTEGER",
		fhirid: "STRING", string: "STRING", code: "STRING", uri: "STRING", url: "STRING", canonical: "STRING",
		base64Binary: "STRING", oid: "STRING", id: "STRING", uuid: "STRING", markdown: "STRING",
		instant: "STRING", date: "STRING", dateTime: "STRING", time: "STRING" 
	}
	const skip = ["Narrative", "markdown", "Resource"]
	Object.keys(definitions)
		.filter( path => path.indexOf(basePath) === 0 && 
			path.split(".")[0] === basePath.split(".")[0] && 
			path.split(".").length === basePathLength+1
		)
		.sort()
		.forEach( path => {
				
			if (definitions[path] && definitions[path].type === "ContentReference")
				path = definitions[path].contentReference;

			recursionList[path] = recursionList[path] || 0;
			recursionList[path] = recursionList[path] + 1;
			const maxRecursion = (config.recursionLimits && config.recursionLimits[path]) || 
				config.defaultRecursionLimit || 3;
			if (recursionList[path] > maxRecursion) return;

			const name = path.split(".").pop();
			const elemFullPath = fullPath ? fullPath + "." + name : path;

			const definition = definitions[path];

			//only include specified value types in extensions
			if (path.indexOf("Extension") === 0 && 
				!(config.includeExtensions||[]).find(ext => ext.indexOf(elemFullPath) > -1)
			) return;

			//don't allow extensions in complex elements in extensions
			if (config.inExtension && definition.type === "Extension") return;

			if (skip.indexOf(definition.type) > -1) return;
			
			const sqlType = typeMapping[definition.type];
			
			if (sqlType) {
				schema.push({name, type: sqlType, mode: definition.isArray ? "REPEATED" : undefined});

			} else if (definition.type === "BackboneElement" || definition.type === "Element") {
				const fields = buildSchema(path, definitions, config, elemFullPath, {...recursionList});
				if (fields) schema.push({
					name, type: "RECORD", 
					mode: definition.isArray ? "REPEATED" : undefined,
					fields
				});

			} else if (definition.type === "Extension") {
				const newConfig =  {...config, defaultRecursionLimit: 1, inExtension: config.inExtension};
				const fields = buildSchema(definition.type, definitions, newConfig, elemFullPath, {...recursionList});
				if (fields.length) schema.push({
					name, type: "RECORD", 
					mode: definition.isArray ? "REPEATED" : undefined,
					fields: fields.concat([{name: "parent", type: "STRING"},{name: "url", type: "STRING"}])

				});

			} else {
				const childRecursionLimit = config.inExtension ? 1 : config.recursionLimit;
				const newConfig =  {...config, defaultRecursionLimit: childRecursionLimit, inExtension: config.inExtension};
				const fields = buildSchema(definition.type, definitions, newConfig, elemFullPath, {...recursionList});
				
				if (fields) schema.push({
					name, type: "RECORD", 
					mode: definition.isArray ? "REPEATED" : undefined,
					fields
				});
			}

			//augmentation
			if (config.includeAA) {
				if (definition.type === "date" || definition.type === "dateTime" || definition.type === "instant") {
					schema.push({
						name: name+"_aa", type: "RECORD", 
						mode: definition.isArray ? "REPEATED" : undefined,
						fields: [{name: "start", type: "TIMESTAMP"}, {name: "end", type: "TIMESTAMP"}]
					});

				} else if (path === "Reference.reference") {
					schema.push(
						{name: "reference_id_aa", type: "STRING"},
						{name: "reference_prev_aa", type: "STRING"}
					);
				
				} else if (definition.type === "string" && path !== "Extension.parent" && name !== "resourceType" && name !== "reference") {
					schema.push({
						name: name+"_aa", type: "STRING",
						mode: definition.isArray ? "REPEATED" : undefined
					})
	
				} else if (name === "resourceType") {
					schema.push({name: "id_prev_aa", type: "STRING"})
				}
			}
		});

	return schema;
}

module.exports = {buildSchema};