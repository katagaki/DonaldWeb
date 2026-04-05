# Donald - Diet Planner

## Cursor

All interactive elements (buttons, clickable rows, sortable table headers, etc.) must use `cursor:default`, not `cursor:pointer`. This follows macOS native app conventions where the pointer/hand cursor is reserved for hyperlinks only.

## Workflow

When you are done with your work, always:

1. Run `prettier --write .` to format all HTML, JSON, JS, and CSS files.
2. Commit the changes with a descriptive message.
3. Push to the remote repository.
