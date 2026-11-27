// ab — autobuyers content. Registration: manifest.js.
function createAutobuyersLayer() {
    return {
	startData() { return {unlocked: true}},
	color: "yellow",
	symbol: "AB",
	row: "side",
	layerShown() { return player.t.unlocked || player.s.unlocked },
	tooltip: "Autobuyers",
	clickables: {
		rows: 6,
		cols: 4,
		11: {
			title: "Boosters",
			display(){
				return hasMilestone("t", 3)?(player.b.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.t.unlocked },
			canClick() { return hasMilestone("t", 3) },
			onClick() { player.b.auto = !player.b.auto },
			style: {"background-color"() { return player.b.auto?"#6e64c4":"#666666" }},
		},
		12: {
			title: "Generators",
			display(){
				return hasMilestone("s", 3)?(player.g.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.s.unlocked },
			canClick() { return hasMilestone("s", 3) },
			onClick() { player.g.auto = !player.g.auto },
			style: {"background-color"() { return player.g.auto?"#a3d9a5":"#666666" }},
		},
		13: {
			title: "Enhancers",
			display(){
				return hasMilestone("q", 1)?(player.e.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.q.unlocked },
			canClick() { return hasMilestone("q", 1) },
			onClick() { player.e.auto = !player.e.auto },
			style: {"background-color"() { return player.e.auto?"#b82fbd":"#666666" }},
		},
		14: {
			title: "Extra Time Capsules",
			display(){
				return hasMilestone("q", 1)?(player.t.autoExt?"On":"Off"):"Locked"
			},
			unlocked() { return player.q.unlocked },
			canClick() { return hasMilestone("q", 1) },
			onClick() { player.t.autoExt = !player.t.autoExt },
			style: {"background-color"() { return player.t.autoExt?"#006609":"#666666" }},
		},
		21: {
			title: "Time Capsules",
			display(){
				return hasMilestone("q", 3)?(player.t.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.q.unlocked },
			canClick() { return hasMilestone("q", 3) },
			onClick() { player.t.auto = !player.t.auto },
			style: {"background-color"() { return player.t.auto?"#006609":"#666666" }},
		},
		22: {
			title: "Space Energy",
			display(){
				return hasMilestone("q", 3)?(player.s.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.q.unlocked },
			canClick() { return hasMilestone("q", 3) },
			onClick() { player.s.auto = !player.s.auto },
			style: {"background-color"() { return player.s.auto?"#dfdfdf":"#666666" }},
		},
		23: {
			title: "Super Boosters",
			display(){
				return hasMilestone("q", 4)?(player.sb.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.q.unlocked },
			canClick() { return hasMilestone("q", 4) },
			onClick() { player.sb.auto = !player.sb.auto },
			style: {"background-color"() { return player.sb.auto?"#504899":"#666666" }},
		},
		24: {
			title: "Super Generators",
			display(){
				return hasMilestone("q", 6)?(player.sg.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.sg.unlocked },
			canClick() { return hasMilestone("q", 6) },
			onClick() { player.sg.auto = !player.sg.auto },
			style: {"background-color"() { return player.sg.auto?"#248239":"#666666" }},
		},
		31: {
			title: "Space Buildings",
			display(){
				return hasMilestone("q", 7)?(player.s.autoBld?"On":"Off"):"Locked"
			},
			unlocked() { return player.sg.unlocked },
			canClick() { return hasMilestone("q", 7) },
			onClick() { player.s.autoBld = !player.s.autoBld },
			style: {"background-color"() { return player.s.autoBld?"#dfdfdf":"#666666" }},
		},
		32: {
			title: "Quirk Layers",
			display(){
				return hasMilestone("ba", 1)?(player.q.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.ba.unlocked },
			canClick() { return hasMilestone("ba", 1) },
			onClick() { player.q.auto = !player.q.auto },
			style: {"background-color"() { return player.q.auto?"#c20282":"#666666" }},
		},
		33: {
			title: "Subspace Energy",
			display(){
				return hasMilestone("ba", 2)?(player.ss.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.ba.unlocked },
			canClick() { return hasMilestone("ba", 2) },
			onClick() { player.ss.auto = !player.ss.auto },
			style: {"background-color"() { return player.ss.auto?"#e8ffff":"#666666" }},
		},
		34: {
			title: "Spells",
			display(){
				return hasMilestone("hn", 2)?(player.m.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.hn.unlocked },
			canClick() { return hasMilestone("hn", 2) },
			onClick() { player.m.auto = !player.m.auto },
			style: {"background-color"() { return player.m.auto?"#eb34c0":"#666666" }},
		},
		41: {
			title: "Phantom Souls",
			display(){
				return hasMilestone("hn", 4)?(player.ps.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.hn.unlocked },
			canClick() { return hasMilestone("hn", 4) },
			onClick() { player.ps.auto = !player.ps.auto },
			style: {"background-color"() { return player.ps.auto?"#b38fbf":"#666666" }},
		},
		42: {
			title: "Wraiths",
			display(){
				return hasMilestone("hn", 5)?(player.ps.autoW?"On":"Off"):"Locked"
			},
			unlocked() { return player.hn.unlocked },
			canClick() { return hasMilestone("hn", 5) },
			onClick() { player.ps.autoW = !player.ps.autoW },
			style: {"background-color"() { return player.ps.autoW?"#b38fbf":"#666666" }},
		},
		43: {
			title: "Ghost Spirit",
			display(){
				return hasMilestone("ma", 0)?(player.ps.autoGhost?"On":"Off"):"Locked"
			},
			unlocked() { return player.ma.unlocked },
			canClick() { return hasMilestone("ma", 0) },
			onClick() { player.ps.autoGhost = !player.ps.autoGhost },
			style: {"background-color"() { return player.ps.autoGhost?"#b38fbf":"#666666" }},
		},
		44: {
			title: "Imperium Bricks",
			display(){
				return hasMilestone("ma", 4)?(player.i.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.ma.unlocked },
			canClick() { return hasMilestone("ma", 4) },
			onClick() { player.i.auto = !player.i.auto },
			style: {"background-color"() { return player.i.auto?"#e5dab7":"#666666" }},
		},
		51: {
			title: "Hyperspace",
			display(){
				return hasMilestone("ma", 5)?(player.hs.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.ma.unlocked },
			canClick() { return hasMilestone("ma", 5) },
			onClick() { player.hs.auto = !player.hs.auto },
			style: {"background-color"() { return player.hs.auto?"#dfdfff":"#666666" }},
		},
		52: {
			title: "Gear Upgrades",
			display() { return hasMilestone("ge", 3)?(player.ge.auto?"On":"Off"):"Locked" },
			unlocked() { return player.ai.unlocked && player.ge.unlocked },
			canClick() { return hasMilestone("ge", 3) },
			onClick() { player.ge.auto = !player.ge.auto },
			style: {"background-color"() { return player.ge.auto?"#ababab":"#666666" }},
		},
		53: {
			title: "Shell Expansion",
			display() {
				return hasMilestone("id", 3)?(player.mc.autoSE?"On":"Off"):"Locked"
			},
			unlocked() { return player.id.unlocked && player.mc.unlocked },
			canClick() { return hasMilestone("id", 3) },
			onClick() { player.mc.autoSE = !player.mc.autoSE },
			style: {"background-color"() { return player.mc.autoSE?"#c99a6b":"#666666" }},
		},
		54: {
			title: "Motherboard",
			display() { return hasMilestone("mc", 1)?(player.mc.auto?"On":"Off"):"Locked" },
			unlocked() { return player.ai.unlocked && player.mc.unlocked },
			canClick() { return hasMilestone("mc", 1) },
			onClick() { player.mc.auto = !player.mc.auto },
			style: {"background-color"() { return player.mc.auto?"#c99a6b":"#666666" }},
		},
		61: {
			title: "Neurons",
			display() {
				return hasMilestone("ne", 5)?(player.ne.auto?"On":"Off"):"Locked"
			},
			unlocked() { return player.ne.unlocked && player.en.unlocked },
			canClick() { return hasMilestone("ne", 5) },
			onClick() { player.ne.auto = !player.ne.auto },
			style: {"background-color"() { return player.ne.auto?"#ded9ff":"#666666" }},
		},
		62: {
			title: "Neural Networks",
			display() {
				return hasMilestone("ne", 7)?(player.ne.autoNN?"On":"Off"):"Locked"
			},
			unlocked() { return player.ne.unlocked && player.ai.unlocked },
			canClick() { return hasMilestone("ne", 7) },
			onClick() { player.ne.autoNN = !player.ne.autoNN },
			style: {"background-color"() { return player.ne.autoNN?"#ded9ff":"#666666" }},
		},
		63: {
			title: "Ideas",
			display() { return hasMilestone("id", 4)?(player.id.auto?"On":"Off"):"Locked" },
			unlocked() { return player.id.unlocked && player.ai.unlocked },
			canClick() { return hasMilestone("id", 4) },
			onClick() { player.id.auto = !player.id.auto },
			style: {"background-color"() { return player.id.auto?"#fad682":"#666666" }},
		},
	},
};
}
