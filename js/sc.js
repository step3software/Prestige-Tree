/** Civ has no softcaps yet; generic engine hooks keep their signatures. */
function createSoftcapRules({derivedState, gameHelpers, saveState}) {
    return {STATIC_SCALE_DATA: [], softcap: (id, value) => value, reverse_softcap: (id, value) => value,
        softcapStaticGain: value => value, scaleStaticCost: value => value};
}
