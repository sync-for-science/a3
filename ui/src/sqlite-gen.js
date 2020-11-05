function sanitizeValue(value) { return value }

function buildSqlBlocks(blocks) {
	let sqlBlocks = {};
	
	blocks.forEach( block => {

		sqlBlocks[block.id] = sqlBlocks[block.id] || { 
			fields: {}, joinTargets: {}, 
			id: block.id, parentId: block.parentId,
			tableName: block.definition && block.definition.tableName,
			patientIdField: block.definition && block.definition.patientIdField,
			resourceIdField: block.definition && (block.definition.resourceIdField || "id")
		};

		if (block.parentId && !sqlBlocks[block.id].joinTargets[block.id] && block.parentId !== "root")
			sqlBlocks[block.id].joinTargets[block.parentId] = "patient_id";

		(block.rules || []).forEach( rule => {
			const fieldDefinition = block.definition.fields.find( f => f.id === rule.fieldId );
			sqlBlocks[block.id].fields[rule.fieldId] = sqlBlocks[block.id].fields[rule.fieldId] || {};
			
			sqlBlocks[block.id].fields[rule.fieldId].restrictions = 
				sqlBlocks[block.id].fields[rule.fieldId].restrictions || [];
			sqlBlocks[block.id].fields[rule.fieldId].restrictions.push(rule.restrictions);

			sqlBlocks[block.id].fields[rule.fieldId].definition = fieldDefinition;

			sqlBlocks[block.id].isLeaf = blocks.filter( b => b.parentId === block.id).length === 0;
			sqlBlocks[block.id].exclude = block.exclude; 
			
			rule.restrictions.forEach( r => {
				if (r.compareTo && r.compareTo !== "fixed" && r.comparator.indexOf("populated") === -1) {
					const [blockId, fieldId] = r.compareTo.split(".");
					sqlBlocks[blockId] = sqlBlocks[blockId] || { fields: {}, joinTargets: {} };
					sqlBlocks[blockId].fields[fieldId] = sqlBlocks[blockId].fields[fieldId]  || {};
					sqlBlocks[blockId].fields[fieldId].export = true;
					sqlBlocks[blockId].fields[fieldId].definition = fieldDefinition;
					if (!sqlBlocks[block.id].joinTargets[blockId]) 
						sqlBlocks[block.id].joinTargets[blockId] = "patient_id";
				} else if (r.target && fieldDefinition.type === "fhirId") {
					const [blockId, fieldId] = r.target.split(".");
					sqlBlocks[block.id].joinTargets = sqlBlocks[block.id].joinTargets || {};
					sqlBlocks[block.id].joinTargets[blockId] = "resource_id";
				}
			})
		});

		if (block.retention && block.retention.retentionType !== "none") {
			const fieldId = block.retention.retentionSortField;
			sqlBlocks[block.id].retentionSortField = fieldId;
			sqlBlocks[block.id].retentionSortDir = block.retention.retentionType === "latest" ? "DESC" : "ASC";
			if (!sqlBlocks[block.id].fields[fieldId]) {
				const definition = block.definition.fields.find( f => f.id === fieldId);
				sqlBlocks[block.id].fields[fieldId] = {definition};
			}
		}
	})

	if (!sqlBlocks["root"]) 
		sqlBlocks["root"] = {id: "root", tableName: "Patient", patientIdField: "id"}

	let orderedBlocks = [];
	const walkChildren = blockId => {
		if (blockId && sqlBlocks[blockId])
			orderedBlocks.push( sqlBlocks[blockId] );
		blocks.filter( b => b.parentId === blockId )
			.forEach( b => walkChildren(b.id) )
	}
	walkChildren("root");
	return orderedBlocks;
}

function whereToSql(group, prefix, level=0) {

	if (typeof group === "string") 
		return "\t".repeat(level) + (prefix ? prefix + " " : "") + group;

	if (group.criteria.length === 0) 
		return;

	if (group.criteria.length === 1)
		return whereToSql(group.criteria[0], level > 0 ? prefix : null , level);

	const children = group.criteria.map( (item, i) => {
		return whereToSql(item, i>0  ? group.type : null, level+1);
	}).filter( g => !!g );

	if (level === 0) 
		return children.join("\n");

	if (children.length)
		return "\t".repeat(level) + (prefix ? prefix + " (\n" : "(\n") + 
			children.join("\n") + 
			"\n" + "\t".repeat(level) + ")"
}


function buildField(definition, blockId) {

	const prefix = `f_${blockId}_`;

	if (definition.field.indexOf("[]") === -1) return { 
		select: [`json_extract(res.json, '$.${definition.field}') ${prefix}${definition.id}`]
	}

	let select = [];
	let join = [];

	const segments = definition.field.match(/[^\[]+\[\]/g);
	let prevFieldName;
	segments.forEach( (segment, i) => {
		const fieldName = prefix + (i < segments.length-1 
			? segment.replace(/\[\]/g, "").replace(/\./g, "_") 
			: definition.id
		);
		const path = segment.replace(/(^\.?)|(\[\]$)/g, "");
		join.push(`JOIN json_each(json_extract(${prevFieldName || "res.json"}, '$.${path}')) ${fieldName} ON 1=1`);
		prevFieldName = fieldName;
	});

	select.push(`${prevFieldName}.value ${prevFieldName}`);
	return { select, join }
}

function buildRestrictions(field, blockId) {

	const buildFn = {
		code: buildCode, coding: buildCoding, 
		quantity: buildQuantity, date: buildDate
	}[field.definition.type];

	const fieldName = "f_" + blockId + "_"  + field.definition.id;
	let where = {type: "AND", criteria: []};
	field.restrictions.forEach( ruleSet => {
		let ruleSetWhere = {type: "OR", criteria: []}
		buildFn && ruleSet.forEach( r => {
			const group = buildFn(r, fieldName)
			ruleSetWhere.criteria.push(group);
		});
		if (ruleSetWhere.criteria.length)
			where.criteria.push(ruleSetWhere);
	});
	return where.criteria.length ? where : null;
}

function buildQuantity(r, fieldName) {
	const comparator = {
		gte: ">= ", lte: "<= ", gt: "> ", lt: "<  ", eq: "= ", populated: "IS NOT NULL", not_populated: "IS NULL"
	}[r.comparator];
	const hasPredicate = r.comparator.indexOf("populated") === -1;
	const isAbsolute = 
		r.comparator === "populated" || r.comparator === "not_populated" || r.compareTo === "fixed";
	let group = {type: "AND", criteria: [] };

	if (isAbsolute) {
		group.criteria.push(
			`json_extract(${fieldName}, '$.value') ${comparator + (hasPredicate ? r.fixedValue : "")}` 
		)
		if (r.unitSystem) group.criteria.push(
			`json_extract(${fieldName}, '$.system') = '${sanitizeValue(r.unitSystem)}'`
		);
		if (r.unitCode) group.criteria.push(
			`json_extract(${fieldName}, '$.code') = '${sanitizeValue(r.unitCode)}'`
		);
	} else {
		const [blockId, fieldId] = r.compareTo.split(".");
		const offset = r.offsetValue ? `${r.offsetDir === "minus" ? + "-" : "+"} ${r.offsetValue}` : "";
		group.criteria.push(
			`json_extract(${fieldName}, '$.value') ${comparator} json_extract(block_${blockId}.f_${blockId}_${fieldId}, '$.value') ${offset}`,
			`(
				(json_extract(block_${blockId}.f_${blockId}_${fieldId}, '$.system') IS NULL AND json_extract(${fieldName}, '$.system') IS NULL)
				OR json_extract(${fieldName}, '$.system') = json_extract(block_${blockId}.f_${blockId}_${fieldId}, '$.system')
			)`,
			`(
				(json_extract(block_${blockId}.f_${blockId}_${fieldId}, '$.code') IS NULL AND json_extract(${fieldName}, '$.code') IS NULL)
				OR json_extract(${fieldName}, '$.code') = json_extract(block_${blockId}.f_${blockId}_${fieldId}, '$.code')
			)`
		);
	}
	return group;
}

function buildCoding(r, fieldName) {
	let where = {type: "AND", criteria: []}
	const codes = r.code.split(/\s*,\s*/).map( c => `'${sanitizeValue(c)}'` ).join(",");
	if (r.name) where.comment = sanitizeValue(r.name)
	if (r.system) where.criteria.push(
		`json_extract(${fieldName}.value, '$.system') = '${sanitizeValue(r.system)}'`
	)
	where.criteria.push(
		`json_extract(${fieldName}.value, '$.code') IN (${codes})`
	)
	return where;
}

function buildCode(r, fieldName) {
	return `${fieldName} = '${sanitizeValue(r.code)}'`;
}

function buildDate(r, fieldName) {
	const comparator = {
		gte: ">= ", lte: "<= ", gt: "> ", lt: "<  ", eq: "= ", populated: "IS NOT NULL", not_populated: "IS NULL"
	}[r.comparator];
	const hasPredicate = r.comparator.indexOf("populated") === -1;
	
	const isAbsolute = 
		r.comparator === "populated" || r.comparator === "not_populated" || r.compareTo === "fixed";
	if (isAbsolute)
		return `DATETIME(${fieldName}) ${comparator + (hasPredicate ? "DATETIME('" + r.fixedValue +"')" : "")}`;

	const [blockId, fieldId] = r.compareTo.split(".");
	if (r.offsetValue) {
		const offset = `'${r.offsetDir === "minus" ? + "-" : "+"}${r.offsetValue} ${r.offsetUnit}')`;
		return `DATETIME(${fieldName}) ${comparator} DATETIME(block_${blockId}.f_${blockId}_${fieldId}, ${offset})`;
	} else {
		return `DATETIME(${fieldName}) ${comparator} DATETIME(block_${blockId}.f_${blockId}_${fieldId})`;
	}
}

function wrapInTemporalFilter(sqlBlock, sql) {
	return `SELECT outer.* FROM (
		SELECT inner.*,
			dense_rank() over (
				partition by inner.f_${sqlBlock.id}_patient_id
				order by inner.f_${sqlBlock.id}_${sqlBlock.retentionSortField} ${sqlBlock.retentionSortDir}
			) as rank
			FROM (
				${sql.replace(/\n/g, "\n\t\t\t\t")}
			) AS inner
) AS outer WHERE outer.rank = 1`
}

function wrapInTempTable(id, sql) {
	return [
		`DROP TABLE IF EXISTS block_${id};`,
		`CREATE TEMPORARY TABLE block_${id} AS`,
		`${sql};`
	].join("\n");
}

function buildTerminalQuery(sqlBlocks) {

	const rootBlock = sqlBlocks.find( b => b.id === "root" );
	const excludeBlocks = sqlBlocks.filter( b => b.isLeaf && b.exclude );
	const includeBlocks = sqlBlocks.filter( b => b.isLeaf && !b.exclude );

	let select;
	if (excludeBlocks && !includeBlocks.length) {
		select = [
			`SELECT DISTINCT(json_extract(res.json, '$.${rootBlock.patientIdField || "id"}')) list_patient_id \nFROM ${rootBlock.tableName} res`
		]
	} else if (includeBlocks.length) {
		select = includeBlocks.map( (b, i) => {
			return `${i > 0 ? "UNION " : ""}SELECT DISTINCT(block_${b.id}.f_${b.id}_patient_id) list_patient_id FROM block_${b.id}`;
		})
	}

	select = select.concat( excludeBlocks.map( b => {
		return `EXCEPT SELECT DISTINCT(block_${b.id}.f_${b.id}_patient_id) list_patient_id FROM block_${b.id}`;
	}) );

	return [
		`DROP TABLE IF EXISTS patient_list;`, 
		`CREATE TEMPORARY TABLE patient_list AS`
	].concat(select).join("\n")+";";
}

function buildCountQuery(sqlBlocks) {
	const rootBlock = sqlBlocks.find( b => b.id === "root" );
	if (!rootBlock) return;

	let selects = [
		`SELECT 'root' block, COUNT(DISTINCT json_extract(${rootBlock.tableName}.json, '$.${rootBlock.patientIdField || "id"}')) patients FROM ${rootBlock.tableName}`,
		`SELECT 'result' block, COUNT(DISTINCT list_patient_id) patients FROM patient_list`,
	];
	sqlBlocks.forEach( block => {
		if (block.id === "root") return;
		selects.push(`SELECT ${block.id} block, COUNT(DISTINCT f_${block.id}_patient_id) patients FROM block_${block.id}`)
	});
	return selects.join("\nUNION ALL\n") + ";";
}

function buildPatientListQuery(sqlBlocks) {
	const rootBlock = sqlBlocks.find( b => b.id === "root" );
	if (!rootBlock) return;

	return `SELECT list_patient_id, ${rootBlock.tableName}.json FROM patient_list
		INNER JOIN ${rootBlock.tableName}
		ON patient_list.list_patient_id = json_extract(${rootBlock.tableName}.json, '$.${rootBlock.patientIdField || "id"}');`
}

function buildSql(blocks, outputCounts) {
	let sql = [];

	const sqlBlocks = buildSqlBlocks(blocks);

	sqlBlocks.forEach( block => {
		if (!block.tableName || !block.parentId) return;

		let blockElements = {join: [], select: [], where: []};

		Object.keys(block.joinTargets).forEach( joinBlockId => {
			const joinField = block.joinTargets[joinBlockId];
			blockElements.join.push( 
				`INNER JOIN block_${joinBlockId} ON block_${joinBlockId}.f_${joinBlockId}_${joinField} = f_${block.id}_${joinField}`
			)
		});

		blockElements.select.push(
			buildField({field: block.patientIdField, id: "patient_id"}, block.id).select,
			buildField({field: block.resourceIdField, id: "resource_id"}, block.id).select,
		);

		Object.keys(block.fields).forEach( fieldId => {
			const field = block.fields[fieldId];
			
			//fhirIds are handled as a joinTarget above
			if (field.type === "fhirId") return;

			const {join, select} = buildField(field.definition, block.id);
			if (join)
				blockElements.join = blockElements.join.concat(join);
			if (select)
				blockElements.select = blockElements.select.concat(select);
			if (field.restrictions) {
				const fieldWhere = buildRestrictions(field, block.id);
				if (fieldWhere) blockElements.where.push(fieldWhere);	
			};
		});

		const whereSql = blockElements.where.length
			? whereToSql({type: "AND", criteria: blockElements.where})
			: "";
	
		const selectSql = blockElements.select.join(",\n\t");
		const joinSql = blockElements.join.join("\n\t");

		let innerSql = `SELECT\n\t${selectSql}\nFROM\n\t${block.tableName} res` +
			(joinSql.length ? `\n\t${joinSql}` : "") +
			(whereSql.length ? `\nWHERE\n\t${whereSql}` : "");

		if (block.retentionSortField) innerSql = 
			wrapInTemporalFilter(block, innerSql);


		sql.push(wrapInTempTable(block.id, innerSql));

	})
	
	sql.push( buildTerminalQuery(sqlBlocks) )

	if (outputCounts) {
		sql.push( buildCountQuery(sqlBlocks) )
	} else {
		sql.push( buildPatientListQuery(sqlBlocks) )
	}
	
	return sql.join("\n\n");
}

export default {
	buildSql, whereToSql, buildDate, 
	buildQuantity, buildCode, buildCoding
}