// @ts-check
// The only durable I/O owner. A codec failure never reaches setItem; Web Storage
// atomically replaces this one key or throws, retaining its previous value.
/** @param {()=>StoragePort} getStorage @param {string} key */
function createSaveStorage(getStorage, key) {
	return {
		/** @param {SaveCodec} codec @returns {SaveOutcome<SaveCollection|null> & {original?:string}} */
		read(codec) {
			let raw;
			try {
				raw = getStorage().getItem(key);
			} catch (error) {
				return { ok: false, error: "Browser storage is unavailable. Allow storage and retry loading." };
			}
			if (raw === null) return { ok: true, value: null };
			let decoded = codec.decodeCollection(raw);
			return Object.assign({}, decoded, { original: raw });
		},
		/** @param {SaveCollection} collection @param {SaveCodec} codec @returns {SaveOutcome<SaveCollection>} */
		write(collection, codec) {
			let encoded = codec.encodeCollection(collection);
			if (!encoded.ok) return encoded;
			try {
				getStorage().setItem(key, encoded.text);
			} catch (error) {
				return { ok: false, error: "Could not save. Browser storage may be full or blocked. Free space or allow storage, then retry." };
			}
			return { ok: true, value: encoded.value };
		},
	};
}
