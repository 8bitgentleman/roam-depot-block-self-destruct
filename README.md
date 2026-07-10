Set blocks to self-destruct (be deleted) after a period of time. Every hour the plugin will search for all blocks that reference #[[self-destruct]] (configurable to whatever you would like). Any of those references that are older than the time set will be deleted. Blocks on or referencing template pages (`[[roam/templates]]`, `[[SmartBlock]]`, and `[[42SmartBlock]]`) are ignored.

A custom deletion time can be set by nesting an attribute below the block that you want deleted.

If you use other template pages of your own, add them under the **Custom Template Pages** setting in the extension settings panel and they'll be ignored the same way as the default template pages.

Set an **Exempt Tag** to protect individual blocks. Any block carrying that tag is never deleted, even if it also has the self-destruct tag.

Turn on **Log Page** to keep a record of every run on `[[Self-Destruct Log]]`. By default it only logs a summary and the UIDs of deleted blocks. Enabling **Log Deleted Content** additionally copies the full text of each deleted block onto that page and keeps it there permanently, so only turn it on if you're fine with that content sticking around. The log page itself is never self-destructed.

### Use Case Ideas
- Blocks left over from daily templates 
- Using queries on your Daily Notes page or old queries in general.
- Keeping your graph lean and clean

### Examples
  <img src="https://github.com/8bitgentleman/roam-depot-block-self-destruct/raw/main/example.png" max-width="400"></img>