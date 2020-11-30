import React from 'react';
import { Col }  from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons'

function QuantityRule(props) {

	const options = {
		comparator: [
			{value: "populated", display: "Populated"},
			{value: "not_populated", display: "Not Populated"},
			{value: "eq", display: "Equal To"},
			{value: "lt", display: "Less then"},
			{value: "lte", display: "Less than or equal to"},
			{value: "gt", display: "Greater than"},
			{value: "gte", display: "Greater than or equal to"}
		],
		compareTarget: [
			{value: "fixed", display: "Fixed Value of"}
		],
		offsetDir: [
			{value: "plus", display: "+"},
			{value: "minus", display: "-"}
		]
	}

	//return invalid params
	function validateQuantityProperties(data) {
		const fixedValue = data.comparator.indexOf("populated") === -1 &&
			data.compareTo === "fixed" &&
			!/^\d+\.?\d+$/.test(data.fixedValue);
		const unitCode = data.unitCode && data.unitCode.trim().indexOf(" ") > -1;
		const unitSystem = data.unitSystem && data.unitSystem.trim().indexOf(" ") > -1
		return (fixedValue || unitCode || unitSystem) && 
			{fixedValue, unitCode, unitSystem};
	}

	const handleChange = (field, value) => {
		const newData = {...props.data, [field]: value};
		const invalid = validateQuantityProperties(newData);
		props.onUpdate({...newData, invalid});
	}

	const mapOptions = (property) => {
		return options[property].map( o => {
			return <option value={o.value} key={o.value}>{o.display}</option>
		});
	};

	const renderHeader = () => <div className="my-2">
		<span className="mr-1 font-weight-bold">{props.fieldDefinition.name || props.fieldDefinition.id}</span>
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
		const invalidValue = props.data.validate && props.data.invalid && props.data.invalid.fixedValue;
		const invalidUnitSystem = props.data.validate && props.data.invalid && props.data.invalid.unitSystem;
		const invalidUnitCode = props.data.validate && props.data.invalid && props.data.invalid.unitCode;

		return <>
				<div className="my-2 form-row">
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
					<input type="number" className="form-control"
						required={true} 
						value={props.data.fixedValue || ""} 
						onChange={e => handleChange("fixedValue", e.target.value)}
						className={invalidValue ? "is-invalid form-control" : "form-control"}
					/>
				</Col>}
			</div>
			{(props.data.compareTo === "fixed") && <div className="form-row my-2">
				<Col xs="4">
					<input className="form-control"
						required={false} 
						value={props.data.unitCode || ""} 
						placeholder="Unit Code"
						onChange={e => handleChange("unitCode", e.target.value)}
						className={invalidUnitCode ? "is-invalid form-control" : "form-control"}
					/>
				</Col><Col>
					<input className="form-control"
						required={false} 
						value={props.data.unitSystem || ""} 
						placeholder="Unit System"
						onChange={e => handleChange("unitSystem", e.target.value)}
						className={invalidUnitSystem ? "is-invalid form-control" : "form-control"}
					/>
			</Col>
			</div>}
		</>
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
	</Col></div>

	const simpleComparator = props.data.comparator &&
		props.data.comparator.indexOf("populated") !== -1;

	const renderDisplay = () => {

		const renderOffset = () => {
			if (!props.data.offsetValue) return;
			return <span className="mr-1 mt-1 mark">
				{findOption("offsetDir", props.data.offsetDir)}
				{" "}{props.data.offsetValue}
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
				<span className="mt-1 mr-1 font-weight-bold">{props.fieldDefinition.name || props.fieldDefinition.id}</span>
				<span className="mt-1 mr-1">is</span>
				<span className="mt-1 mr-1 mark">
					{findOption("comparator", props.data.comparator).toLowerCase()}
				</span>

				{!simpleComparator && props.data.compareTo === "fixed" && <>
					<span className="mt-1 mr-1 mark">{props.data.fixedValue}</span>
					{props.data.unitCode && <span className="mt-1 mr-1 mark">{props.data.unitCode}</span>}
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

function defaultQuantityProperties() {
	return {
		comparator: "gte", compareTo: "fixed",
		fixedValue: "",
		offsetDir: "plus", offsetValue: 0, 
		invalid: false
	}
}

export default QuantityRule;
export {defaultQuantityProperties};