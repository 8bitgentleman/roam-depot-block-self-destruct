Set blocks to self-destruct (be deleted) after a period of time. Every hour the plugin will search for all blocks that reference #[[self-destruct]] (configurable to whatever you would like). Any of those references that are older than the time set will be deleted. Blocks on or referencing template pages (`[[roam/templates]]`, `[[SmartBlock]]`, and `[[42SmartBlock]]`) are ignored.

A custom deletion time can be set by nesting an attribute below the block that you want deleted.

### Use Case Ideas
- Blocks left over from daily templates 
- Using queries on your Daily Notes page or old queries in general.
- Keeping your graph lean and clean

### Examples
  <img src="https://github.com/8bitgentleman/roam-depot-block-self-destruct/raw/main/example.png" max-width="400"></img>