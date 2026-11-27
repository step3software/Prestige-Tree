// @ts-check
/**
 * JavaScript boundary vocabulary. Player shape is inferred from the one default
 * owner; save validation remains in save-codec.js, never in a second schema.
 * @typedef {ReturnType<ReturnType<typeof createSaveDefaults>['createSavePlayer']> & Partial<OptionalPlayerFields>} GameState
 * @typedef {ReturnType<typeof createDerivedState>['tmp']} DerivedState
 * @typedef {number} ElapsedSeconds Finite, nonnegative seconds (validated at advancement).
 */
/** @template T
 * @typedef {{ok:true,value:T,text?:string}|{ok:false,error:string}} SaveOutcome
 */
/** @template T
 * @typedef {{ok:true,value:T,text:string}|{ok:false,error:string}} EncodedSaveOutcome
 */

/** Optional fields understood by the canonical codec, absent from fresh saves.
 * @typedef {ReturnType<ReturnType<typeof createSaveDefaults>['optionalPlayerFields']>} OptionalPlayerFields
 * @typedef {{set:string} & Record<string, GameState|string>} SaveCollection
 * @typedef {{decodePlayer(raw:unknown):SaveOutcome<GameState>, decodeCollection(raw:unknown):SaveOutcome<SaveCollection>, encodePlayer(raw:unknown):EncodedSaveOutcome<GameState>, encodeCollection(raw:unknown):EncodedSaveOutcome<SaveCollection>}} SaveCodec
 * @typedef {{getItem(key:string):string|null, setItem(key:string,value:string):void}} StoragePort
 * @typedef {{player:GameState, temp:DerivedState, disposed:boolean}} GameIdentity
 * @typedef {'stopped'|'running'|'error'|'disposed'} RuntimeState
 * @typedef {{readonly state:RuntimeState,readonly error:unknown,session:GameIdentity,start():boolean,stop():void,dispose():void}} RuntimeHandle
 * @typedef {{addEventListener(type:string, callback:Function):void, removeEventListener(type:string, callback:Function):void}} RuntimeEventTarget
 * @typedef {{session:GameIdentity, clock:{now():number}, scheduler:{setInterval(callback:()=>void,milliseconds:number):unknown,clearInterval(handle:unknown):void}, listeners?:Array<[RuntimeEventTarget,string,Function]>, resume(nowMs:number):void, tick(nowMs:number):void, autosave():void, refresh():void, onError(error:unknown):void, onStop?:()=>void}} RuntimePorts
 * @typedef {ReturnType<typeof createGameView>} GameViewPort
 * @typedef {{Date?:{now():number},setValue?:(object:object,key:string,value:unknown)=>void,document?:Document,window?:Window,localStorage?:StoragePort,setInterval?:(callback:()=>void,milliseconds:number)=>unknown,clearInterval?:(handle:unknown)=>void,alert?:(message:string)=>void}} HeadlessEffects
 * @typedef {{saveState:ReturnType<typeof createSaveState>,derivedState:ReturnType<typeof createDerivedState>,layerRegistry:ReturnType<typeof createLayerRegistry>,gameRules:ReturnType<typeof createGameRules>,gameHelpers:ReturnType<typeof createGameHelpers>,modRules:ReturnType<typeof createModRules>,softcapRules:ReturnType<typeof createSoftcapRules>,saveDefaults:ReturnType<typeof createSaveDefaults>,treeLayout:ReturnType<typeof createTreeLayout>,effects:HeadlessEffects}} GameLayerPorts
 */

/** The authored boundary's narrow port for the untyped vendored Decimal class.
 * This describes its existing instance API; it is not a second save schema or
 * runtime implementation. Codec hydration still constructs/checks real Decimals.
 * @typedef {number|string|DecimalValue} DecimalInput
 * @typedef {{sign:number,layer:number,mag:number,toString():string,toNumber():number,eq(value:DecimalInput):boolean,gte(value:DecimalInput):boolean,add(value:DecimalInput):DecimalValue}} DecimalValue
 */
