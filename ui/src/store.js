import { createStoreon } from "storeon";
import definitions from "./definitions.js";
import dmExample from "./dm-example";

const defaultState = {
	"nextId": 1,
	"definitions": definitions,
	"blocks": [{
		"id": "root",
		"name": "All Patients",
		"parentId": null
	}]
}

const actions = store => {
	store.on("@init", () => {
		return /example=true/.test(window.location.search)
			? dmExample
			: defaultState;
	});
	
	store.on("block/upsert", ({nextId, blocks}, {block, insertAbove}) => {
		const result = block.id === undefined ? {
			nextId: nextId+1,
			blocks: blocks.map( b => {
				return b.id === insertAbove
					? {...b, parentId: nextId+1}
					: b;
				}).concat([{...block, id: nextId+1}])
			} : {
				blocks: blocks.map( b => {
					if (block.id !== b.id) {
						return b
					} else {
						return {...b, ...block};
					}
				})
			}
		console.log(block);
		return result;
	});

	store.on("block/delete", ({blocks}, {id, parentId}) => {
		const result =  {
			blocks: blocks
				.map( b => b.parentId === id
					? {...b, parentId}
					: b
				)	
				.filter( b => b.id !== id)
		}
		return result;
	});

}

const store = createStoreon([actions]);
export default store;