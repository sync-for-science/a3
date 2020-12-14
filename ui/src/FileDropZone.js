import React, { useState } from "react";

export default ({ children, dropHint, fileDropHandler }) => {

	const [dragCounter, setDragCounter] = useState(0);

	const isFileDrag = e => {
		return !e.dataTransfer.types ||
			e.dataTransfer.types[0] === "Files" ||
			e.dataTransfer.types[0] === "application/x-moz-file";
	}
	
	const handleDrop = e => {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer.files && e.dataTransfer.files.length === 1)
			fileDropHandler(e.dataTransfer.files[0]);
		// e.dataTransfer.clearData();
		setDragCounter(0);
	}

	const handleDragOver = e => {
		e.preventDefault();
		e.stopPropagation();	
	}

	const handleDragEnter = e => {
		e.preventDefault();
		e.stopPropagation();
		if (isFileDrag(e))
			setDragCounter(dragCounter+1);
	}

	const handleDragLeave = e => {
		e.preventDefault();
		e.stopPropagation();
		if (isFileDrag(e))
			setDragCounter(dragCounter-1);
	}

	const overlay = <div className="d-flex justify-content-center" style={{
		border: 'dashed grey 4px',
		backgroundColor: 'rgba(255,255,255,.8)',
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0, 
		right: 0,
		zIndex: 9999,
	}}>
		<div className="d-flex align-items-center">
			{ dropHint || "Drop NDJSON or SQLITE DB file here"}
		</div>
	</div>

	return <div 
		style={{position: "relative"}}
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
		{ dragCounter > 0 && overlay }
		{ children }
	</div>
	
	
} 	