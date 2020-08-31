import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrashAlt, faCheck } from '@fortawesome/free-solid-svg-icons'


function CodingRule(props) {

	function validateCodingProperties(newData) {
		const code = (!props.fieldDefinition.options || newData.option === "__custom") &&
			(newData.code || "").replace(/[\s,]/g).length === 0
		return code && {code}
	}

	const handleChange = (field, value) => {
		const newData = {...props.data, [field]: value};
		const invalid = validateCodingProperties(newData);
		props.onUpdate({...newData, invalid});
	}

	const renderOptionSelector = () => {
		const selection = (
			props.fieldDefinition.options.find( o => {
				return o.name === props.data.name && o.system === props.data.system && o.code === props.data.code
			})
		|| {}).name;

		const buildOptionDisplay = (o) => {
			const codeCount = (o.code || "").split(",").length;
			const codeText = codeCount > 1 ? ` (${codeCount} codes)` : "";
			return o.name + codeText;
		};

		return <div>
			<div className="my-2">
				<span className="mr-1 font-weight-bold">{props.fieldDefinition.name}</span>
				<span>is</span>
				{!props.hideControls && <FontAwesomeIcon icon={faTrashAlt} opacity="0.5"
					onClick={e => props.onDelete(props.id)} 
					style={{cursor: "pointer"}} 
					pull="right" 
				/>}
			</div>

			<select value={(props.data.option) || ""} 
				onChange={e => handleChange("option", e.target.value)} 
				className={props.data.invalid && props.data.validate ? "is-invalid form-control" : "form-control"}
			>
				{!selection && <option value=""></option>}
				{props.fieldDefinition.options.map( o => <option value={o.name} key={o.name}>
					{buildOptionDisplay(o)}
				</option> )}
				{props.fieldDefinition.editable && <option value="__custom" key="__custom">Custom</option>}
			</select>
		</div>
	}

	const renderCustomEdit = () => {
		return <div>
			{ renderHeader() }
			<div className="form-group">
				<label>Name (optional)</label>
				<input className="form-control" value={props.data.name || ""}
					onChange={e => handleChange("name", e.target.value)}
				/>
			</div><div className="form-group">
				<label>System (optional)</label>
				<input className="form-control" value={props.data.system || ""}
					placeholder="http://loinc.org"
					onChange={e => handleChange("system", e.target.value)}
				/>
			</div><div className="form-group">
				<label>Codes (comma separated)</label>
				<textarea value={props.data.code || ""}
					onChange={e => handleChange("code", e.target.value)}
					className={props.data.invalid && props.data.validate ? "is-invalid form-control" : "form-control"}
				/>
			</div>
		</div>
	}

	const renderHeader = () => <div className="my-2">
		<span className="mr-1 font-weight-bold">{props.fieldDefinition.name}</span>
		<span>matches at least one code in</span>
		{!props.hideControls && <FontAwesomeIcon icon={faTrashAlt} opacity="0.5"
			onClick={e => props.onDelete(props.id)} 
			style={{cursor: "pointer"}} 
			pull="right" 
		/>}
	</div>

	const renderEdit = () => {
		const isCustom = props.data.option === "__custom" || !props.fieldDefinition.options;
		return isCustom ? renderCustomEdit() : renderOptionSelector();
	}

	const renderDisplay = () => {
		const codeCount = props.data.code ? props.data.code.split(",").length : 0;
		const name = (props.data.option && props.data.option !== "__custom" && props.data.option.replace(/^[ -]*/, "")) ||
			props.data.name || 
			(codeCount === 1 && props.data.code) ||
			"Unnamed";

		return 	<div>
			{!props.hideControls && 
				<FontAwesomeIcon icon={faEdit} opacity="0.5"
					 style={{cursor: "pointer"}} pull="right" className="m-1" 
				/>
			}
			<div style={{lineHeight: 2}}>
				<span className="mt-1 mr-1 font-weight-bold">{props.fieldDefinition.name}</span>
				{codeCount > 1 ? " matches at least one code in valueset " : " matches code "}
				<span className="mark mt-1">{name}</span>
				{codeCount > 1 && <span className="mt-1">({codeCount} codes)</span>}
			</div>
		</div>
		
	
	}
	return props.edit ? renderEdit() : renderDisplay();
	
}

function defaultCodingProperties() {
	return {invalid: {code: true}}
}

export default CodingRule;
export { defaultCodingProperties };