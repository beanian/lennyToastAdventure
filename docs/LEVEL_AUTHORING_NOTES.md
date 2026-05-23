# Level Authoring Notes

Runtime currently loads `src/levels/level1/level1.tmj`. Treat `src/levels/level1/level1.tmx` as the editable Tiled source and export to TMJ from Tiled after changes. Do not hand-edit both files to keep object IDs and export metadata in sync.

## Golden Path First Pass

Use the first 900px of Level 1 as the smallest safe test segment:

- Spawn / first ground: `x=48..336`, top around `y=560`.
- First small platform: `x=368..447`, top around `y=528`.
- Second platform: `x=480..559`, top around `y=496`.
- Third platform: `x=592..671`, top around `y=464`.
- Wider encounter platform: `x=720..911`, top around `y=464`.
- Existing first enemy: object id `68`, `x=868 y=482`.

Recommended Tiled `Objects` layer edits for the next map pass:

- Keep existing toast id `60` at `x=264.5 y=610`.
- Add toast `gid=81` near `x=392 y=578`.
- Add toast `gid=81` near `x=514 y=546`.
- Add toast `gid=81` near `x=636 y=514`.
- Keep existing toast id `61` at `x=806 y=523.5`.
- Keep existing sockroach id `68`; optionally add `speed=40` and `patrolWidth=112`.

These coordinates match the loader's current `obj.y - obj.height` spawn behavior and should land just above the platform tops.

## Level End

The level-end object is currently a marker with `levelEnd=true`. Runtime now supplies a larger fallback interaction zone and a visible `Press Up` prompt, so Tiled does not need a separate text object.
