# Where bonds go

All measures are at the film's atom size, 34px. At another size `s`, multiply each by `s ÷ 34`. Where a triple's atoms stand, its names and frames: [triples.md](triples.md).

- **Ids.** A triple has two bonds: one from the subject to the predicate (id `<triple>:0`), one from the predicate to the object (id `<triple>:1`). There is never a bond from a subject straight to its object.
- **Length.** A bond runs between its two atoms' centers, wherever the triple's layout puts them: on a line, `slotA ÷ 2 + 34 + slotB ÷ 2` apart.
- **Frames.** A bond to a frame ends at its left edge, and a bond from a frame starts at its right edge, both on the triple's line. Inside it, the triple's own bonds join its atoms as on any line.
- **Draw order.** Frames, bonds, shapes, names.
