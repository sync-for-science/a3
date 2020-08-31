import React from 'react';
import { Col }  from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons'


function DateRule(props) {
	const options = {
		comparator: [
			{value: "populated", display: "Populated"},
			{value: "not_populated", display: "Not Populated"},
			{value: "eq", display: "Equal To"},
			{value: "lt", display: "Before"},
			{value: "lte", display: "Before (Inclusive)"},
			{value: "gt", display: "After"},
			{value: "gte", display: "After (Inclusive)"}
		],
		compareTarget: [
			{value: "run", display: "Query Run Date"},
			{value: "fixed", display: "Fixed Date"}
		],
		offsetDir: [
			{value: "plus", display: "+"},
			{value: "minus", display: "-"}
		],
		offsetUnit: [
			{value: "minutes", display: "Minutes"},
			{value: "hours", display: "Hours"},
			{value: "days", display: "Days"},
			{value: "months", display: "Months"},
			{value: "years", display: "Years"}
		]
	}

	const handleChange = (field, value) => {
		const newData = {...props.data, [field]: value};
		const invalid = validateDateProperties(newData);
		props.onUpdate({...newData, invalid});
	}

	const mapOptions = (property) => {
		return options[property].map( o => {
			return <option value={o.value} key={o.value}>{o.display}</option>
		});
	};

	const renderHeader = () => <div className="my-2">
		<span className="mr-1 font-weight-bold">{props.fieldDefinition.name}</span>
		<span>is</span>
		{!props.hideControls && <FontAwesomeIcon 
			icon={faTrashAlt} opacity="0.5"
			onClick={e => props.onDelete(props.id)} 
			style={{cursor: "pointer"}} 
			pull="right" 
		/>}
	</div>

	const renderComparator = () => <div className="my-2">
		<select className="form-control"
			value={props.data.comparator || "gt"} 
			onChange={e => handleChange("comparator", e.target.value)}
		>{mapOptions("comparator")}</select>
	</div>

	const renderCompareTarget = () => {
		const invalidDate = props.data.validate && props.data.invalid;
		return <div className="my-2 form-row">
			<Col>
				<select className="form-control"
					value={props.data.compareTo || "fixed"} 
					onChange={e => handleChange("compareTo", e.target.value)}
				>{mapOptions("compareTarget")}
					{(props.relativeOptions || []).sort().map( r => {
						return <option key={r.value} value={r.value}>{r.label}</option>
					})}
				</select>
			</Col>
			{(!props.data.compareTo || props.data.compareTo === "fixed") && <Col>
				<input type="date" className="form-control"
					required={true} 
					value={props.data.fixedValue || ""} 
					onChange={e => handleChange("fixedValue", e.target.value)}
					className={invalidDate ? "is-invalid form-control" : "form-control"}
				/>
			</Col>}
		</div>
	}

	const renderCompareOffset = () => <div className="my-2 form-row"><Col>
		<select className="form-control"
			value={props.data.offsetDir || "plus"} 
			onChange={e => handleChange("offsetDir", e.target.value)}
		>{mapOptions("offsetDir")}</select>
	</Col><Col>
		<input type="number" className="form-control"
			value={props.data.offsetValue || ""}  required={true}
			onChange={e => handleChange("offsetValue", e.target.value)}
		/>
	</Col><Col>
		<select className="form-control"
			value={props.data.offsetUnit || "years"} 
			onChange={e => handleChange("offsetUnit", e.target.value)}
		>{mapOptions("offsetUnit")}</select>
	</Col></div>

	const simpleComparator = props.data.comparator &&
		props.data.comparator.indexOf("populated") !== -1;

	const renderDisplay = () => {

		const renderOffset = () => {
			if (!props.data.offsetValue) return;
			return <span className="mr-1 mt-1 mark">
				{findOption("offsetDir", props.data.offsetDir)}
				{" "}{props.data.offsetValue}{" "}
				{findOption("offsetUnit", props.data.offsetUnit)}
			</span>
		};

		const findOption = (property, value) => {
			return options[property].find( o => o.value === value).display;
		}

		const compareToLabel = !simpleComparator && props.data.compareTo.indexOf(".") > -1 &&
			props.relativeOptions.find( r => r.value === props.data.compareTo ).label;

		return <div>
			{!props.hideControls && 
				<FontAwesomeIcon icon={faEdit} opacity="0.5" style={{cursor: "pointer"}} pull="right" className="m-1" />
			}
			
			<div style={{lineHeight: 2}}>
				<span className="mt-1 mr-1 font-weight-bold">{props.fieldDefinition.name}</span>
				<span className="mt-1 mr-1">is</span>
				<span className="mt-1 mr-1 mark">
					{findOption("comparator", props.data.comparator).toLowerCase()}
				</span>

				{!simpleComparator && props.data.compareTo === "fixed" && <>
					<span className="mt-1 mr-1 mark">fixed value</span>
					<span className="mt-1 mr-1">of</span>	
					<span className="mt-1 mr-1 mark">{props.data.fixedValue}</span>
				</>}

				{!simpleComparator && props.data.compareTo === "run" && <>
					<span className="mt-1 mr-1 mark">Query Run Date</span>
					{renderOffset()}
				</>}

				{!simpleComparator && props.data.compareTo.indexOf(".") > -1 && <>
					<span className="d-inline-block">
						<span className="mt-1 mr-1 mark">{compareToLabel}</span>
					</span>
					{renderOffset()}
				</>}
			</div>
		</div>
	}

	const renderEdit = () => <>
		{ renderHeader() }
		{ renderComparator() }
		{ !simpleComparator && renderCompareTarget() }
		{ !simpleComparator && props.data.compareTo !== "fixed" && renderCompareOffset() }
	</>

	return props.edit ? renderEdit() : renderDisplay();
	
}

//return invalid params
function validateDateProperties(data) {
	const fixedValue = data.comparator.indexOf("populated") === -1 &&
		data.compareTo === "fixed" &&
		!/^\d{4}-\d{2}-\d{2}$/.test(data.fixedValue)
	return fixedValue && {fixedValue}
	
}

function defaultDateProperties() {
	return {
		comparator: "gte", compareTo: "fixed", 
		fixedValue: "2020-01-01", offsetUnit: "years",
		offsetDir: "plus", offsetValue: 0, invalid: false
	}
}

export default DateRule;
export {defaultDateProperties};