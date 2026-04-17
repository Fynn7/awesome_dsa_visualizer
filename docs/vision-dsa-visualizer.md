# Overall Direction and Document Purpose

You are planning a visualization tool for university-level DSA (Data Structures and Algorithms) teaching.

## Pain Point

- Using Miro is inefficient and makes it hard to present synchronized code execution and animation behavior.

## UI Modules

Pointer elements that move with index changes in the animation panel (`i`, `j`, `j-1`, selection sort `min`, etc.), including transition behavior, enter animation (`hidden -> visible`), visibility recovery during rapid step navigation, and de-overlap rules, are specified in the English source of truth: **[ui-design.md §9](ui-design.md)**.

- Code editor area
- Console output area
- Animation area
- Variable tracking area
- Optional PDF viewer area (for problem statements used in class)
- Optional draggable editing for visual elements in the animation area (similar to draw.io)

Note: all areas can be closed or hidden at any time.

## Expected Features

- Step-by-step code execution visualization. For example, inside a `for`/`while` loop, the tool should:
  - Highlight the currently executed line, while algorithm animation (such as insertion sort) advances to the exact same step.
  - Provide a dedicated area for persistent variable tracking (similar to notebook variable inspection, but with clearer UI presentation).
  - ...
- Optional: the code display area should be editable and stay synchronized with animation.
- Optional: support side-by-side comparison of two algorithms.

## Product Positioning

- This is a teaching tool for instructors only.
- It is used for classroom projection and will not be distributed to students.

## UI Language

- English UI
- Optional future support for English/German switching

## Tech Stack

- Browser/Web only

## Algorithm Code Used in Teaching

- Python
