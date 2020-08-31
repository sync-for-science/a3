import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons'


function IdRule(props) {

	const handleChange = (field, value) => {
		const newData = {...props.data, [field]: value};
		props.onUpdate({...newData, invalid: false});
	}

	const renderEdit = () => {
		return <div>
			<div className="my-2">
				<span className="mr-1 font-weight-bold">{props.fieldDefinition.name}</span>
				<span>is equal to</span>
				{!props.hideControls && <FontAwesomeIcon icon={faTrashAlt} opacity="0.5"
					onClick={e => props.onDelete(props.id)} 
					style={{cursor: "pointer"}} 
					pull="right" 
				/>}
			</div>
			<select value={props.data.target} 
				className={props.data.validate && !props.data.target ? "is-invalid form-control" : "form-control"}
				onChange={e => handleChange("target", e.target.value)}
			>
				{ !props.data.target && <option key="" value=""></option>}
				{(props.relativeOptions || []).sort().map( r => {
					return <option key={r.value} value={r.value}>{r.label}</option>
				})}
			</select>
		</div>
	}

	const renderDisplay = () => {
		const targetLabel = props.data.target 
			? props.relativeOptions.find( r => r.value === props.data.target ).label
			: "";
		return <div>
			{!props.hideControls && 
				<FontAwesomeIcon icon={faEdit} opacity="0.5" style={{cursor: "pointer"}} pull="right" className="m-1" />
			}
			<div style={{lineHeight: 2, paddingLeft: "24px", textIndent: "-24px"}}>
				<span className="mr-1 font-weight-bold">{props.fieldDefinition.name}</span>
				<span className="mr-1">is equal to</span>
				<span className="mr-1 mark">{targetLabel}</span>
			</div>
		</div>
	}

	return props.edit ? renderEdit() : renderDisplay();
	
}

export default IdRule;
