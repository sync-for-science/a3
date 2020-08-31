import React from "react";
import _ from "lodash";

function Retention(props) {

	const retentionValue = props.retentionType !== "none" && 
		props.retentionType !== "all" && props.retentionSortField
			? props.retentionType + "." + props.retentionSortField 
			: props.retentionType || "none";

	const retentionOptions = [
		{name: `Don't retain matching ${props.definition.name} values` , value: "none"},
		{name: `Retain all matching ${props.definition.name} values`, value: "all"}
	].concat(
		_.chain(props.definition.fields)
			.filter( f => f.type === "instant" )
			.sortBy( "name" )
			.map( f => [
				{name: "Retain most recent match based on " + f.name , value: "latest."+f.name},
				{name: "Retain earliest match based on " + f.name , value: "earliest."+f.name}
			]).flatten().value()
	);

	const handleVarChange = e => {
		if (/^[a-zA-Z_]?[a-zA-Z0-9_]*$/.test(e.target.value)) {
			const invalid = !e.target.value || 
				(props.usedVars||[]).find( v => v === e.target.value );
			props.onChange({retentionVar: e.target.value, invalid});
		}
	}

	const handleValueChange = e => {
		const [retentionType, retentionSortField] = e.target.value.split(".");
		const invalid = retentionType !== "none" && (!props.retentionVar || props.invalid);
		props.onChange({retentionType, retentionSortField, invalid});
	}

	const renderEdit = () => {
		const errors = props.validate && props.invalid;
		const retentionVar = props.retentionVar || "";
	
		return <div className="container-fluid">
			<div className="row my-1"><div className="col">
				<select className="form-control"
					value={retentionValue} 
					onChange={handleValueChange}
				>{
					retentionOptions.map( r => {
						return <option key={r.value} value={r.value}>{r.name}</option>
					})
				}</select>
			</div></div>
	
			{retentionValue !== "none" && <div className="form-row my-2">
				<div className="col col-auto align-self-center">as</div>
				<div className="col">
					<input value={retentionVar} 
						placeholder="Name"
						onChange={handleVarChange} 
						className={errors ? "is-invalid form-control" : "form-control"}
					/>
					{ errors &&
						<div className="small text-danger mt-1">Note: variable name can't be blank and must be unique</div>
					}
				</div>
			</div>}
	
		</div>
	}

	return renderEdit() ;


}

export default Retention;