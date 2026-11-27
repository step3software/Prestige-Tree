// Session-bound layer owner; composition supplies only the named ports.
// ab — autobuyers content. Registration: manifest.js.
/** @param {Pick<GameLayerPorts, 'gameHelpers'|'saveState'>} ports */
function createAutobuyersLayer({ gameHelpers, saveState }) {
    return {
	startData() { return {unlocked: true}},
	color: "yellow",
	symbol: "AB",
	row: "side",
	layerShown() { return saveState.player.t.unlocked || saveState.player.s.unlocked },
	tooltip: "Autobuyers",
	clickables: {
		rows: 6,
		cols: 4,
		11: {
			title: "Boosters",
			display(){
				return gameHelpers.hasMilestone("t", 3)?(saveState.player.b.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.t.unlocked },
			canClick() { return gameHelpers.hasMilestone("t", 3) },
			onClick() { saveState.player.b.auto = !saveState.player.b.auto },
			style: {"background-color"() { return saveState.player.b.auto?"#6e64c4":"#666666" }},
		},
		12: {
			title: "Generators",
			display(){
				return gameHelpers.hasMilestone("s", 3)?(saveState.player.g.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.s.unlocked },
			canClick() { return gameHelpers.hasMilestone("s", 3) },
			onClick() { saveState.player.g.auto = !saveState.player.g.auto },
			style: {"background-color"() { return saveState.player.g.auto?"#a3d9a5":"#666666" }},
		},
		13: {
			title: "Enhancers",
			display(){
				return gameHelpers.hasMilestone("q", 1)?(saveState.player.e.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.q.unlocked },
			canClick() { return gameHelpers.hasMilestone("q", 1) },
			onClick() { saveState.player.e.auto = !saveState.player.e.auto },
			style: {"background-color"() { return saveState.player.e.auto?"#b82fbd":"#666666" }},
		},
		14: {
			title: "Extra Time Capsules",
			display(){
				return gameHelpers.hasMilestone("q", 1)?(saveState.player.t.autoExt?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.q.unlocked },
			canClick() { return gameHelpers.hasMilestone("q", 1) },
			onClick() { saveState.player.t.autoExt = !saveState.player.t.autoExt },
			style: {"background-color"() { return saveState.player.t.autoExt?"#006609":"#666666" }},
		},
		21: {
			title: "Time Capsules",
			display(){
				return gameHelpers.hasMilestone("q", 3)?(saveState.player.t.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.q.unlocked },
			canClick() { return gameHelpers.hasMilestone("q", 3) },
			onClick() { saveState.player.t.auto = !saveState.player.t.auto },
			style: {"background-color"() { return saveState.player.t.auto?"#006609":"#666666" }},
		},
		22: {
			title: "Space Energy",
			display(){
				return gameHelpers.hasMilestone("q", 3)?(saveState.player.s.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.q.unlocked },
			canClick() { return gameHelpers.hasMilestone("q", 3) },
			onClick() { saveState.player.s.auto = !saveState.player.s.auto },
			style: {"background-color"() { return saveState.player.s.auto?"#dfdfdf":"#666666" }},
		},
		23: {
			title: "Super Boosters",
			display(){
				return gameHelpers.hasMilestone("q", 4)?(saveState.player.sb.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.q.unlocked },
			canClick() { return gameHelpers.hasMilestone("q", 4) },
			onClick() { saveState.player.sb.auto = !saveState.player.sb.auto },
			style: {"background-color"() { return saveState.player.sb.auto?"#504899":"#666666" }},
		},
		24: {
			title: "Super Generators",
			display(){
				return gameHelpers.hasMilestone("q", 6)?(saveState.player.sg.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.sg.unlocked },
			canClick() { return gameHelpers.hasMilestone("q", 6) },
			onClick() { saveState.player.sg.auto = !saveState.player.sg.auto },
			style: {"background-color"() { return saveState.player.sg.auto?"#248239":"#666666" }},
		},
		31: {
			title: "Space Buildings",
			display(){
				return gameHelpers.hasMilestone("q", 7)?(saveState.player.s.autoBld?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.sg.unlocked },
			canClick() { return gameHelpers.hasMilestone("q", 7) },
			onClick() { saveState.player.s.autoBld = !saveState.player.s.autoBld },
			style: {"background-color"() { return saveState.player.s.autoBld?"#dfdfdf":"#666666" }},
		},
		32: {
			title: "Quirk Layers",
			display(){
				return gameHelpers.hasMilestone("ba", 1)?(saveState.player.q.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.ba.unlocked },
			canClick() { return gameHelpers.hasMilestone("ba", 1) },
			onClick() { saveState.player.q.auto = !saveState.player.q.auto },
			style: {"background-color"() { return saveState.player.q.auto?"#c20282":"#666666" }},
		},
		33: {
			title: "Subspace Energy",
			display(){
				return gameHelpers.hasMilestone("ba", 2)?(saveState.player.ss.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.ba.unlocked },
			canClick() { return gameHelpers.hasMilestone("ba", 2) },
			onClick() { saveState.player.ss.auto = !saveState.player.ss.auto },
			style: {"background-color"() { return saveState.player.ss.auto?"#e8ffff":"#666666" }},
		},
		34: {
			title: "Spells",
			display(){
				return gameHelpers.hasMilestone("hn", 2)?(saveState.player.m.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.hn.unlocked },
			canClick() { return gameHelpers.hasMilestone("hn", 2) },
			onClick() { saveState.player.m.auto = !saveState.player.m.auto },
			style: {"background-color"() { return saveState.player.m.auto?"#eb34c0":"#666666" }},
		},
		41: {
			title: "Phantom Souls",
			display(){
				return gameHelpers.hasMilestone("hn", 4)?(saveState.player.ps.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.hn.unlocked },
			canClick() { return gameHelpers.hasMilestone("hn", 4) },
			onClick() { saveState.player.ps.auto = !saveState.player.ps.auto },
			style: {"background-color"() { return saveState.player.ps.auto?"#b38fbf":"#666666" }},
		},
		42: {
			title: "Wraiths",
			display(){
				return gameHelpers.hasMilestone("hn", 5)?(saveState.player.ps.autoW?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.hn.unlocked },
			canClick() { return gameHelpers.hasMilestone("hn", 5) },
			onClick() { saveState.player.ps.autoW = !saveState.player.ps.autoW },
			style: {"background-color"() { return saveState.player.ps.autoW?"#b38fbf":"#666666" }},
		},
		43: {
			title: "Ghost Spirit",
			display(){
				return gameHelpers.hasMilestone("ma", 0)?(saveState.player.ps.autoGhost?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.ma.unlocked },
			canClick() { return gameHelpers.hasMilestone("ma", 0) },
			onClick() { saveState.player.ps.autoGhost = !saveState.player.ps.autoGhost },
			style: {"background-color"() { return saveState.player.ps.autoGhost?"#b38fbf":"#666666" }},
		},
		44: {
			title: "Imperium Bricks",
			display(){
				return gameHelpers.hasMilestone("ma", 4)?(saveState.player.i.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.ma.unlocked },
			canClick() { return gameHelpers.hasMilestone("ma", 4) },
			onClick() { saveState.player.i.auto = !saveState.player.i.auto },
			style: {"background-color"() { return saveState.player.i.auto?"#e5dab7":"#666666" }},
		},
		51: {
			title: "Hyperspace",
			display(){
				return gameHelpers.hasMilestone("ma", 5)?(saveState.player.hs.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.ma.unlocked },
			canClick() { return gameHelpers.hasMilestone("ma", 5) },
			onClick() { saveState.player.hs.auto = !saveState.player.hs.auto },
			style: {"background-color"() { return saveState.player.hs.auto?"#dfdfff":"#666666" }},
		},
		52: {
			title: "Gear Upgrades",
			display() { return gameHelpers.hasMilestone("ge", 3)?(saveState.player.ge.auto?"On":"Off"):"Locked" },
			unlocked() { return saveState.player.ai.unlocked && saveState.player.ge.unlocked },
			canClick() { return gameHelpers.hasMilestone("ge", 3) },
			onClick() { saveState.player.ge.auto = !saveState.player.ge.auto },
			style: {"background-color"() { return saveState.player.ge.auto?"#ababab":"#666666" }},
		},
		53: {
			title: "Shell Expansion",
			display() {
				return gameHelpers.hasMilestone("id", 3)?(saveState.player.mc.autoSE?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.id.unlocked && saveState.player.mc.unlocked },
			canClick() { return gameHelpers.hasMilestone("id", 3) },
			onClick() { saveState.player.mc.autoSE = !saveState.player.mc.autoSE },
			style: {"background-color"() { return saveState.player.mc.autoSE?"#c99a6b":"#666666" }},
		},
		54: {
			title: "Motherboard",
			display() { return gameHelpers.hasMilestone("mc", 1)?(saveState.player.mc.auto?"On":"Off"):"Locked" },
			unlocked() { return saveState.player.ai.unlocked && saveState.player.mc.unlocked },
			canClick() { return gameHelpers.hasMilestone("mc", 1) },
			onClick() { saveState.player.mc.auto = !saveState.player.mc.auto },
			style: {"background-color"() { return saveState.player.mc.auto?"#c99a6b":"#666666" }},
		},
		61: {
			title: "Neurons",
			display() {
				return gameHelpers.hasMilestone("ne", 5)?(saveState.player.ne.auto?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.ne.unlocked && saveState.player.en.unlocked },
			canClick() { return gameHelpers.hasMilestone("ne", 5) },
			onClick() { saveState.player.ne.auto = !saveState.player.ne.auto },
			style: {"background-color"() { return saveState.player.ne.auto?"#ded9ff":"#666666" }},
		},
		62: {
			title: "Neural Networks",
			display() {
				return gameHelpers.hasMilestone("ne", 7)?(saveState.player.ne.autoNN?"On":"Off"):"Locked"
			},
			unlocked() { return saveState.player.ne.unlocked && saveState.player.ai.unlocked },
			canClick() { return gameHelpers.hasMilestone("ne", 7) },
			onClick() { saveState.player.ne.autoNN = !saveState.player.ne.autoNN },
			style: {"background-color"() { return saveState.player.ne.autoNN?"#ded9ff":"#666666" }},
		},
		63: {
			title: "Ideas",
			display() { return gameHelpers.hasMilestone("id", 4)?(saveState.player.id.auto?"On":"Off"):"Locked" },
			unlocked() { return saveState.player.id.unlocked && saveState.player.ai.unlocked },
			canClick() { return gameHelpers.hasMilestone("id", 4) },
			onClick() { saveState.player.id.auto = !saveState.player.id.auto },
			style: {"background-color"() { return saveState.player.id.auto?"#fad682":"#666666" }},
		},
	},
};
}
